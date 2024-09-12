import Image from "next/image";

interface OpeningScreenProps {
	onStartGame: () => void;
}

export default function OpeningScreen({ onStartGame }: OpeningScreenProps) {
	return (
		<div className="opening-screen">
			<Image
				src="/hero-image.jpg"
				alt="Hero Image"
				width={600}
				height={400}
				className="hero-image"
			/>
			<h1>Welcome Trump Pet Rescue</h1>
			<p className="text-white">
				Rescue as many pets as possible before they get eaten!
			</p>
			<p className="text-white pb-4">
				Move your character with the mouse or touch to catch the pets.
			</p>
			<button onClick={onStartGame}>Start Game</button>
		</div>
	);
}
