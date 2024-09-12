"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Character, Pet, BadGuy } from "./game-entities";

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 600;
const WALL_Y = GAME_HEIGHT / 2;
const GATE_WIDTH = 100;
const GATE_X = (GAME_WIDTH - GATE_WIDTH) / 2;

export default function GameBoard() {
	const [score, setScore] = useState(0);
	const [character, setCharacter] = useState<Character>({
		x: GAME_WIDTH / 2,
		y: WALL_Y - 30,
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
			const safeDistance = Math.min(GAME_WIDTH, GAME_HEIGHT) / 4;
			let x: number, y: number;
			let isSafe = false;
			let attempts = 0;
			const maxAttempts = 5;

			do {
				x = Math.random() * GAME_WIDTH;
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
			const targetX = GATE_X + GATE_WIDTH / 2;
			const targetY = WALL_Y;
			const angle = Math.atan2(targetY - y, targetX - x);

			return {
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
			};
		},
		[]
	);

	const spawnBadGuy = useCallback(() => {
		const x = Math.random() * GAME_WIDTH;
		const y = GAME_HEIGHT;
		const targetX = GATE_X + GATE_WIDTH / 2;
		const targetY = WALL_Y;
		const angle = Math.atan2(targetY - y, targetX - x);
		const speed = 120; // Speed in pixels per second
		return {
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
		};
	}, []);

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
		const handleMouseMove = (e: MouseEvent) => {
			if (gameAreaRef.current) {
				const rect = gameAreaRef.current.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				setCharacter({
					x: Math.max(0, Math.min(GAME_WIDTH, x)),
					y: Math.max(0, Math.min(WALL_Y - 20, y)),
				});
			}
		};

		const gameArea = gameAreaRef.current;
		if (gameArea) {
			gameArea.addEventListener("mousemove", handleMouseMove);
		}

		return () => {
			if (gameArea) {
				gameArea.removeEventListener("mousemove", handleMouseMove);
			}
		};
	}, []);

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
					if (newY >= WALL_Y && newX >= GATE_X && newX <= GATE_X + GATE_WIDTH) {
						return { ...pet, x: newX, y: WALL_Y };
					}

					// Only adjust direction if the pet is near a wall
					const nearWall =
						newX <= 10 ||
						newX >= GAME_WIDTH - 10 ||
						newY <= 10 ||
						newY >= GAME_HEIGHT - 10;

					if (nearWall) {
						const targetX = GATE_X + GATE_WIDTH / 2;
						const targetY = WALL_Y;
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
							(newY <= WALL_Y && (newX < 0 || newX > GAME_WIDTH))
						) {
							return { ...badGuy, remove: true };
						}

						if (newY <= WALL_Y) {
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
		[score, character]
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
			className="relative cursor-none"
			style={{
				width: GAME_WIDTH,
				height: GAME_HEIGHT,
				border: "2px solid black",
			}}
		>
			<div className="absolute top-0 left-0 p-2 bg-white">Score: {score}</div>
			{/* Wall */}
			<div
				className="absolute bg-gray-800"
				style={{
					left: 0,
					top: WALL_Y,
					width: GAME_WIDTH,
					height: 10,
				}}
			/>
			{/* Gate */}
			<div
				className="absolute bg-yellow-500"
				style={{
					left: GATE_X,
					top: WALL_Y,
					width: GATE_WIDTH,
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
