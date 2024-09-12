import Image from "next/image";
import donald from "@/app/images/donald.png";

interface MainCharacterIconProps {
	size?: number;
	className?: string;
	direction: "left" | "right";
}

export default function MainCharacterIcon({
	size = 50,
	className = "",
	direction,
}: MainCharacterIconProps) {
	return (
		<div
			className={`relative ${className}`}
			style={{
				width: size,
				height: size,
				transform: direction === "left" ? "scaleX(-1)" : "none",
			}}
		>
			<Image
				src={donald}
				alt="Main character"
				layout="fill"
				objectFit="contain"
				priority
			/>
		</div>
	);
}
