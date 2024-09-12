import { useState } from "react";

interface OpeningScreenProps {
	onStartGame: () => void;
}

export default function OpeningScreen({ onStartGame }: OpeningScreenProps) {
	return (
		<div className="flex flex-col items-center justify-center h-screen bg-blue-100">
			<h1 className="text-4xl font-bold mb-4">Pet Rescue</h1>
			<div className="text-center mb-4">
				<p className="mb-4">
					Rescue as many pets as possible before they get eaten by bad guys!
				</p>
				<p className="mb-4">
					Move your character with the mouse or touch to catch the pets.
				</p>
				<p className="mb-4">
					Avoid the red bad guys and guide the green pets to safety!
				</p>
				<button
					onClick={onStartGame}
					className="bg-green-500 text-white px-4 py-2 rounded mt-4"
				>
					Start Game
				</button>
			</div>
		</div>
	);
}
