import Image from "next/image";
import { useState, useRef } from "react";

interface ClosingScreenProps {
	score: number;
	onRestartGame: () => void;
}

export default function ClosingScreen({
	score,
	onRestartGame,
}: ClosingScreenProps) {
	const [copied, setCopied] = useState(false);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const shareText = `I just rescued ${score} pets in Trump Pet Rescue! Can you beat my score? Play now at ${window.location.origin}`;

	const copyToClipboard = () => {
		if (textAreaRef.current) {
			textAreaRef.current.select();
			document.execCommand("copy");
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const shareScore = () => {
		if (navigator.share) {
			navigator
				.share({
					title: "Trump Pet Rescue",
					text: shareText,
					url: window.location.origin,
				})
				.catch((error) => console.log("Error sharing:", error));
		} else {
			window.open(
				`https://twitter.com/intent/tweet?text=${encodeURIComponent(
					shareText
				)}`,
				"_blank"
			);
		}
	};

	return (
		<div className="closing-screen">
			<Image
				src="/game-over.jpg"
				alt="Game Over"
				width={600}
				height={400}
				className="game-over-image"
			/>
			<h1>Game Over</h1>
			<p className="text-white">Your score: {score}</p>
			<div className="share-container">
				<textarea
					ref={textAreaRef}
					value={shareText}
					readOnly
					className="share-text"
				/>
				<div className="button-group">
					<button onClick={copyToClipboard} className="secondary-button">
						{copied ? "Copied!" : "Copy"}
					</button>
					<button onClick={shareScore} className="secondary-button">
						Share
					</button>
				</div>
			</div>
			<div className="button-container">
				<button onClick={onRestartGame} className="primary-button">
					Play Again
				</button>
			</div>
		</div>
	);
}
