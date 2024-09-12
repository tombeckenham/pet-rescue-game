import Image from "next/image";
import cat from "@/app/images/cat.png";

interface CatIconProps {
	direction: "left" | "right";
}

export default function CatIcon({ direction }: CatIconProps) {
	return (
		<div style={{ transform: direction === "left" ? "scaleX(-1)" : "none" }}>
			<Image src={cat} alt="Cat" width={60} height={60} />
		</div>
	);
}
