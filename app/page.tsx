import GameBoard from "./components/game-board";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-4">
			<GameBoard />
		</main>
	);
}
