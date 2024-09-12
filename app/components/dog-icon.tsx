import Image from "next/image";
import dog from "@/app/images/dog.png";

interface DogIconProps {
	direction: "left" | "right";
}

export default function DogIcon({ direction }: DogIconProps) {
	return (
		<div style={{ transform: direction === "left" ? "none" : "scaleX(-1)" }}>
			<Image src={dog} alt="Dog" width={60} height={60} />
		</div>
	);
}
