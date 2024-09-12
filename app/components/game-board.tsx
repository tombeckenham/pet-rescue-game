"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Character, Pet, BadGuy } from "./game-entities";
import OpeningScreen from "./opening-screen";
import GameOverScreen from "./game-over-screen";

export default function GameBoard() {
	const [score, setScore] = useState(0);
	const [character, setCharacter] = useState<Character>({
		x: window.innerWidth / 2,
		y: window.innerHeight / 2 - 30,
	});
	const [gameState, setGameState] = useState<
		"opening" | "playing" | "gameOver"
	>("opening");
	const [gameEntities, setGameEntities] = useState<{
		pets: Pet[];
		badGuys: BadGuy[];
	}>({
		pets: [],
		badGuys: [],
	});
	const gameAreaRef = useRef<HTMLDivElement>(null);
	const lastTimeRef = useRef<number>(0);
	const animationFrameRef = useRef<number>();

	const [gameWidth, setGameWidth] = useState(window.innerWidth);
	const [gameHeight, setGameHeight] = useState(window.innerHeight);
	const [wallY, setWallY] = useState(window.innerHeight * 0.75);
	const [gateWidth, setGateWidth] = useState(
		Math.min(100, window.innerWidth * 0.1)
	);
	const [gateX, setGateX] = useState(
		(window.innerWidth - Math.min(100, window.innerWidth * 0.1)) / 2
	);

	const spawnPet = useCallback(
		(prevGameEntities: { pets: Pet[]; badGuys: BadGuy[] }) => {
			const safeDistance = Math.min(gameWidth, gameHeight) / 4;
			let x: number, y: number;
			let isSafe = false;
			let attempts = 0;
			const maxAttempts = 5;

			do {
				x = Math.random() * gameWidth;
				y = 0; // Always start from the top

				// Check distance from all bad guys
				isSafe = prevGameEntities.badGuys.every((badGuy) => {
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

	const startGame = useCallback(() => {
		setGameState("playing");
		setScore(0);
		setGameEntities({ pets: [], badGuys: [] });
		lastTimeRef.current = 0;
		// Reset character position
		setCharacter({
			x: window.innerWidth / 2,
			y: window.innerHeight * 0.75 - 30,
		});
	}, []);

	const restartGame = useCallback(() => {
		startGame();
	}, [startGame]);

	useEffect(() => {
		if (gameState !== "playing") return;

		const petInterval = setInterval(() => {
			setGameEntities((prev) => {
				const newPet = spawnPet(prev);
				return {
					...prev,
					pets: [...prev.pets, newPet],
				};
			});
		}, 2000);

		const badGuyInterval = setInterval(() => {
			setGameEntities((prev) => ({
				...prev,
				badGuys: [...prev.badGuys, spawnBadGuy()],
			}));
		}, 3000);

		return () => {
			clearInterval(petInterval);
			clearInterval(badGuyInterval);
		};
	}, [gameState, spawnPet, spawnBadGuy]);

	useEffect(() => {
		const handleResize = () => {
			setGameWidth(window.innerWidth);
			setGameHeight(window.innerHeight);
			setWallY(window.innerHeight * 0.75);
			setGateWidth(Math.min(100, window.innerWidth * 0.1));
			setGateX(
				(window.innerWidth - Math.min(100, window.innerWidth * 0.1)) / 2
			);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Update character position logic
	useEffect(() => {
		if (gameState !== "playing") return;

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

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("touchmove", handleTouchMove, {
			passive: false,
		});

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("touchmove", handleTouchMove);
		};
	}, [gameState, gameWidth, wallY]);

	const gameLoop = useCallback(
		(currentTime: number) => {
			if (lastTimeRef.current === 0) {
				lastTimeRef.current = currentTime;
			}
			const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
			lastTimeRef.current = currentTime;

			setGameEntities((prevState) => {
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
					setGameState("gameOver");
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
		if (gameState !== "playing") return;

		animationFrameRef.current = requestAnimationFrame(gameLoop);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [gameState, gameLoop]);

	if (gameState === "opening") {
		return <OpeningScreen onStartGame={startGame} />;
	}

	if (gameState === "gameOver") {
		return <GameOverScreen score={score} onRestart={restartGame} />;
	}

	return (
		<div
			ref={gameAreaRef}
			className="fixed inset-0"
			style={{
				width: "100vw",
				height: "100vh",
				touchAction: "none", // Prevent scrolling on touch devices
			}}
		>
			<div className="absolute top-0 left-0 p-2 bg-white z-10">
				Score: {score}
			</div>
			{/* Wall */}
			<div
				className="absolute bg-gray-800"
				style={{
					left: 0,
					top: wallY,
					width: "100%",
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
			{gameEntities.pets.map((pet, index) => (
				<div
					key={`pet-${index}`}
					className="absolute bg-green-500 rounded-full"
					style={{ left: pet.x - 5, top: pet.y - 5, width: 10, height: 10 }}
				/>
			))}
			{/* Bad Guys */}
			{gameEntities.badGuys.map((badGuy, index) => (
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
