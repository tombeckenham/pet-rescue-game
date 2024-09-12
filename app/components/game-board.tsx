"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Character, Pet, BadGuy, PetType } from "./game-entities";
import Gate from "./gate";
import CatIcon from "./cat-icon";
import DogIcon from "./dog-icon";
import BadGuyIcon from "./bad-guy-icon";
import MainCharacterIcon from "./main-character-icon";
import OpeningScreen from "./opening-screen";
import ClosingScreen from "./closing-screen";

export default function GameBoard() {
	const [score, setScore] = useState(0);
	const [character, setCharacter] = useState<Character>({ x: 0, y: 0 });
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

	const [gameWidth, setGameWidth] = useState(0);
	const [gameHeight, setGameHeight] = useState(0);
	const [wallY, setWallY] = useState(0);
	const [gateWidth, setGateWidth] = useState(0);
	const [gateX, setGateX] = useState(0);

	const [characterDirection, setCharacterDirection] = useState<
		"left" | "right"
	>("right");

	useEffect(() => {
		// Initialize state values that depend on window
		setGameWidth(window.innerWidth);
		setGameHeight(window.innerHeight);
		setWallY(window.innerHeight * 0.75);
		setGateWidth(Math.min(100, window.innerWidth * 0.1));
		setGateX((window.innerWidth - Math.min(100, window.innerWidth * 0.1)) / 2);
		setCharacter({
			x: window.innerWidth / 2,
			y: window.innerHeight / 2 - 30,
		});

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

			const petType: PetType = Math.random() < 0.5 ? "cat" : "dog";
			const direction: "left" | "right" =
				Math.cos(angle) > 0 ? "right" : "left";

			return {
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				type: petType,
				direction,
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
		const direction: "left" | "right" = Math.cos(angle) > 0 ? "right" : "left";
		return {
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			direction,
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
					pets: [...prev.pets, newPet as Pet],
				};
			});
		}, 2000);
		const badGuyInterval = setInterval(() => {
			setGameEntities((prev) => ({
				...prev,
				badGuys: [...prev.badGuys, spawnBadGuy() as BadGuy],
			}));
		}, 3000);

		return () => {
			clearInterval(petInterval);
			clearInterval(badGuyInterval);
		};
	}, [gameState, spawnPet, spawnBadGuy]);

	// Update character position logic
	useEffect(() => {
		if (gameState !== "playing") return;

		const handleMouseMove = (e: MouseEvent) => {
			if (gameAreaRef.current) {
				const rect = gameAreaRef.current.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				setCharacter((prev) => {
					const newX = Math.max(0, Math.min(gameWidth, x));
					if (Math.abs(newX - prev.x) > 1) {
						// Only change direction if there's significant movement
						setCharacterDirection(newX > prev.x ? "right" : "left");
					}
					return {
						x: newX,
						y: Math.max(0, Math.min(wallY - 20, y)),
					};
				});
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (gameAreaRef.current && e.touches[0]) {
				const rect = gameAreaRef.current.getBoundingClientRect();
				const x = e.touches[0].clientX - rect.left;
				const y = e.touches[0].clientY - rect.top;
				setCharacter((prev) => {
					const newX = Math.max(0, Math.min(gameWidth, x));
					if (Math.abs(newX - prev.x) > 1) {
						// Only change direction if there's significant movement
						setCharacterDirection(newX > prev.x ? "right" : "left");
					}
					return {
						x: newX,
						y: Math.max(0, Math.min(wallY - 20, y)),
					};
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

					// Update direction based on horizontal velocity
					const direction: "left" | "right" = pet.vx > 0 ? "right" : "left";

					// If the pet reaches the gate, keep it there
					if (newY >= wallY && newX >= gateX && newX <= gateX + gateWidth) {
						return { ...pet, x: newX, y: wallY, direction };
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
							direction,
						};
					}

					// If not near a wall, continue with current velocity
					return { ...pet, x: newX, y: newY, direction };
				});

				// Update bad guys
				const updatedBadGuys = badGuys
					.map((badGuy) => {
						const newX = badGuy.x + badGuy.vx * deltaTime;
						const newY = badGuy.y + badGuy.vy * deltaTime;

						// Update direction based on horizontal velocity
						const direction: "left" | "right" =
							badGuy.vx > 0 ? "right" : "left";

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
									direction,
								};
							}
						}

						return { ...badGuy, x: newX, y: newY, direction };
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
		[character, gameWidth, gameHeight, wallY, gateX, gateWidth]
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
		return <ClosingScreen score={score} onRestartGame={restartGame} />;
	}

	return (
		<div
			ref={gameAreaRef}
			className="fixed inset-0"
			style={{
				width: "100vw",
				height: "100vh",
				touchAction: "none", // Prevent scrolling on touch devices
				background: "linear-gradient(to bottom, #f0e6d2, #e6d8b5)", // Much lighter desert-like gradient
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
				style={{
					position: "absolute",
					left: gateX,
					top: wallY,
					width: gateWidth,
					height: 100,
				}}
			>
				<Gate width={gateWidth} height={100} />
			</div>
			{/* Main Character */}
			<div
				className="absolute"
				style={{
					left: character.x - 30,
					top: character.y - 30,
					width: 60,
					height: 60,
				}}
			>
				<MainCharacterIcon direction={characterDirection} />
			</div>
			{/* Pets */}
			{gameEntities.pets.map((pet, index) => (
				<div
					key={`pet-${index}`}
					className="absolute"
					style={{
						left: pet.x - 30,
						top: pet.y - 30,
						width: 60,
						height: 60,
					}}
				>
					{pet.type === "cat" ? (
						<CatIcon direction={pet.direction} />
					) : (
						<DogIcon direction={pet.direction} />
					)}
				</div>
			))}
			{/* Bad Guys */}
			{gameEntities.badGuys.map((badGuy, index) => (
				<div
					key={`badguy-${index}`}
					className="absolute"
					style={{
						left: badGuy.x - 30,
						top: badGuy.y - 30,
						width: 60,
						height: 60,
					}}
				>
					<BadGuyIcon direction={badGuy.direction} />
				</div>
			))}
		</div>
	);
}
