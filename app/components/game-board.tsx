"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Character, Pet, BadGuy } from "./game-entities";

const DESKTOP_WIDTH = 1000;
const DESKTOP_HEIGHT = 600;
const MOBILE_WIDTH = 360;
const MOBILE_HEIGHT = 640;

export default function GameBoard() {
	const [isMobile, setIsMobile] = useState(false);
	const [gameWidth, setGameWidth] = useState(DESKTOP_WIDTH);
	const [gameHeight, setGameHeight] = useState(DESKTOP_HEIGHT);
	const [wallY, setWallY] = useState(DESKTOP_HEIGHT / 2);
	const [gateWidth, setGateWidth] = useState(100);
	const [gateX, setGateX] = useState((DESKTOP_WIDTH - 100) / 2);

	const [score, setScore] = useState(0);
	const [character, setCharacter] = useState<Character>({
		x: DESKTOP_WIDTH / 2,
		y: DESKTOP_HEIGHT / 2 - 30,
	});
	const [gameState, setGameState] = useState<{
		pets: Pet[];
		badGuys: BadGuy[];
	}>({
		pets: [],
		badGuys: [],
	});
	const gameAreaRef = useRef<HTMLDivElement>(null);
	const lastTimeRef = useRef<number>(0);
	const animationFrameRef = useRef<number>();

	const spawnPet = useCallback(
		(prevGameState: { pets: Pet[]; badGuys: BadGuy[] }) => {
			const safeDistance = Math.min(gameWidth, gameHeight) / 4;
			let x: number, y: number;
			let isSafe = false;
			let attempts = 0;
			const maxAttempts = 5;

			do {
				x = Math.random() * gameWidth;
				y = 0; // Always start from the top

				// Check distance from all bad guys
				isSafe = prevGameState.badGuys.every((badGuy) => {
					const distance = Math.hypot(x - badGuy.x, y - badGuy.y);
					return distance > safeDistance;
				});

				attempts++;
			} while (!isSafe && attempts < maxAttempts);

			if (!isSafe) {
				console.warn(
					"Couldn't find a safe spot for new pet after max attempts"
				);
			}

			const speed = 60; // Speed in pixels per second
			const targetX = gateX + gateWidth / 2;
			const targetY = wallY;
			const angle = Math.atan2(targetY - y, targetX - x);

			return {
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
			};
		},
		[gameWidth, gameHeight, gateX, gateWidth, wallY]
	);

	const spawnBadGuy = useCallback(() => {
		const x = Math.random() * gameWidth;
		const y = gameHeight;
		const targetX = gateX + gateWidth / 2;
		const targetY = wallY;
		const angle = Math.atan2(targetY - y, targetX - x);
		const speed = 120; // Speed in pixels per second
		return {
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
		};
	}, [gameWidth, gameHeight, gateX, gateWidth, wallY]);

	useEffect(() => {
		const petInterval = setInterval(() => {
			setGameState((prev) => {
				const newPet = spawnPet(prev);
				return {
					...prev,
					pets: [...prev.pets, newPet],
				};
			});
		}, 2000);
		const badGuyInterval = setInterval(() => {
			setGameState((prev) => ({
				...prev,
				badGuys: [...prev.badGuys, spawnBadGuy()],
			}));
		}, 3000);
		return () => {
			clearInterval(petInterval);
			clearInterval(badGuyInterval);
		};
	}, [spawnPet, spawnBadGuy]);

	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth < 768;
			setIsMobile(mobile);

			if (mobile) {
				setGameWidth(MOBILE_WIDTH);
				setGameHeight(MOBILE_HEIGHT);
				setWallY(MOBILE_HEIGHT * 0.75);
				setGateWidth(80);
				setGateX((MOBILE_WIDTH - 80) / 2);
			} else {
				setGameWidth(DESKTOP_WIDTH);
				setGameHeight(DESKTOP_HEIGHT);
				setWallY(DESKTOP_HEIGHT / 2);
				setGateWidth(100);
				setGateX((DESKTOP_WIDTH - 100) / 2);
			}
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Update character position logic
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (gameAreaRef.current) {
				const rect = gameAreaRef.current.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				setCharacter({
					x: Math.max(0, Math.min(gameWidth, x)),
					y: Math.max(0, Math.min(wallY - 20, y)),
				});
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (gameAreaRef.current && e.touches[0]) {
				const rect = gameAreaRef.current.getBoundingClientRect();
				const x = e.touches[0].clientX - rect.left;
				const y = e.touches[0].clientY - rect.top;
				setCharacter({
					x: Math.max(0, Math.min(gameWidth, x)),
					y: Math.max(0, Math.min(wallY - 20, y)),
				});
			}
		};

		const gameArea = gameAreaRef.current;
		if (gameArea) {
			gameArea.addEventListener("mousemove", handleMouseMove);
			gameArea.addEventListener("touchmove", handleTouchMove);
		}

		return () => {
			if (gameArea) {
				gameArea.removeEventListener("mousemove", handleMouseMove);
				gameArea.removeEventListener("touchmove", handleTouchMove);
			}
		};
	}, [gameWidth, wallY]);

	const gameLoop = useCallback(
		(currentTime: number) => {
			if (lastTimeRef.current === 0) {
				lastTimeRef.current = currentTime;
			}
			const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
			lastTimeRef.current = currentTime;

			setGameState((prevState) => {
				const { pets, badGuys } = prevState;

				// Update pets
				const updatedPets = pets.map((pet) => {
					const newX = pet.x + pet.vx * deltaTime;
					const newY = pet.y + pet.vy * deltaTime;

					// If the pet reaches the gate, keep it there
					if (newY >= wallY && newX >= gateX && newX <= gateX + gateWidth) {
						return { ...pet, x: newX, y: wallY };
					}

					// Only adjust direction if the pet is near a wall
					const nearWall =
						newX <= 10 ||
						newX >= gameWidth - 10 ||
						newY <= 10 ||
						newY >= gameHeight - 10;

					if (nearWall) {
						const targetX = gateX + gateWidth / 2;
						const targetY = wallY;
						const angle = Math.atan2(targetY - newY, targetX - newX);
						const speed = Math.sqrt(pet.vx ** 2 + pet.vy ** 2);
						return {
							...pet,
							x: newX,
							y: newY,
							vx: Math.cos(angle) * speed,
							vy: Math.sin(angle) * speed,
						};
					}

					// If not near a wall, continue with current velocity
					return { ...pet, x: newX, y: newY };
				});

				// Update bad guys
				const updatedBadGuys = badGuys
					.map((badGuy) => {
						const newX = badGuy.x + badGuy.vx * deltaTime;
						const newY = badGuy.y + badGuy.vy * deltaTime;

						// If the bad guy reaches the top of the game board or goes beyond the sides when above the wall, mark it for removal
						if (
							newY <= 0 ||
							(newY <= wallY && (newX < 0 || newX > gameWidth))
						) {
							return { ...badGuy, remove: true };
						}

						if (newY <= wallY) {
							// We're above or at the wall
							// We can never hit the wall as the bad guys are always moving towards the gate

							// Passed through the gate, find nearest pet

							const nearestPet = updatedPets.reduce((nearest, pet) => {
								const distToPet = Math.hypot(pet.x - newX, pet.y - newY);
								const distToNearest = Math.hypot(
									nearest.x - newX,
									nearest.y - newY
								);
								return distToPet < distToNearest ? pet : nearest;
							}, updatedPets[0]);

							if (nearestPet) {
								const angle = Math.atan2(
									nearestPet.y - newY,
									nearestPet.x - newX
								);
								const speed = Math.sqrt(badGuy.vx ** 2 + badGuy.vy ** 2);
								return {
									...badGuy,
									x: newX,
									y: newY,
									vx: Math.cos(angle) * speed,
									vy: Math.sin(angle) * speed,
								};
							}
						}

						return { ...badGuy, x: newX, y: newY };
					})
					.filter((badGuy) => !badGuy.remove); // Remove bad guys that have been marked for removal

				// Check for pet rescue by user
				const rescuedPets = updatedPets.filter(
					(pet) => Math.hypot(character.x - pet.x, character.y - pet.y) < 20
				);
				const remainingPets = updatedPets.filter(
					(pet) => !rescuedPets.includes(pet)
				);

				// Check for collisions between bad guys and pets
				const caughtPets = remainingPets.filter((pet) =>
					updatedBadGuys.some(
						(badGuy) => Math.hypot(badGuy.x - pet.x, badGuy.y - pet.y) < 15
					)
				);

				if (caughtPets.length > 0) {
					// A pet was caught, game over
					alert(`Game Over! Your score: ${score}`);
					setScore(0);
					return { pets: [], badGuys: [] };
				}

				// Update score
				setScore((prevScore) => prevScore + rescuedPets.length);

				return { pets: remainingPets, badGuys: updatedBadGuys };
			});

			animationFrameRef.current = requestAnimationFrame(gameLoop);
		},
		[score, character, gameWidth, gameHeight, wallY, gateX, gateWidth]
	);

	useEffect(() => {
		animationFrameRef.current = requestAnimationFrame(gameLoop);
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [gameLoop]);

	return (
		<div
			ref={gameAreaRef}
			className="relative cursor-none mx-auto"
			style={{
				width: gameWidth,
				height: gameHeight,
				border: "2px solid black",
				touchAction: "none", // Prevent scrolling on touch devices
			}}
		>
			<div className="absolute top-0 left-0 p-2 bg-white">Score: {score}</div>
			{/* Wall */}
			<div
				className="absolute bg-gray-800"
				style={{
					left: 0,
					top: wallY,
					width: gameWidth,
					height: 10,
				}}
			/>
			{/* Gate */}
			<div
				className="absolute bg-yellow-500"
				style={{
					left: gateX,
					top: wallY,
					width: gateWidth,
					height: 10,
				}}
			/>
			{/* Character */}
			<div
				className="absolute bg-blue-500 rounded-full"
				style={{
					left: character.x - 10,
					top: character.y - 10,
					width: 20,
					height: 20,
				}}
			/>
			{/* Pets */}
			{gameState.pets.map((pet, index) => (
				<div
					key={`pet-${index}`}
					className="absolute bg-green-500 rounded-full"
					style={{ left: pet.x - 5, top: pet.y - 5, width: 10, height: 10 }}
				/>
			))}
			{/* Bad Guys */}
			{gameState.badGuys.map((badGuy, index) => (
				<div
					key={`badguy-${index}`}
					className="absolute bg-red-500 rounded-full"
					style={{
						left: badGuy.x - 7,
						top: badGuy.y - 7,
						width: 14,
						height: 14,
					}}
				/>
			))}
		</div>
	);
}
