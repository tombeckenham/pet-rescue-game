import GameBoard from "./components/game-board";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4">
			<h1 className="text-4xl font-bold mb-4">Pet Rescue Game</h1>
			<GameBoard />
			<p className="mt-4">Use arrow keys to move and rescue pets!</p>
		</main>
	);
}
