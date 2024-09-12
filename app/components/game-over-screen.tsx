interface GameOverScreenProps {
	score: number;
	onRestart: () => void;
}

export default function GameOverScreen({
	score,
	onRestart,
}: GameOverScreenProps) {
	const shareScore = () => {
		const shareText = `I rescued ${score} pets in Pet Rescue! Can you beat my score?`;
		const shareUrl = "https://your-app-url.com"; // Replace with your actual app URL
		const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
			shareText
		)}&url=${encodeURIComponent(shareUrl)}`;
		window.open(twitterUrl, "_blank");
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen bg-blue-100">
			<h2 className="text-3xl font-bold mb-4">Game Over</h2>
			<p className="text-xl mb-4">You rescued {score} pets!</p>
			<div className="flex space-x-4">
				<button
					onClick={onRestart}
					className="bg-green-500 text-white px-4 py-2 rounded"
				>
					Play Again
				</button>
				<button
					onClick={shareScore}
					className="bg-blue-500 text-white px-4 py-2 rounded"
				>
					Share Score
				</button>
			</div>
		</div>
	);
}
