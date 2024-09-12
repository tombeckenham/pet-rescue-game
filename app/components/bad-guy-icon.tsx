import Image from "next/image";
import badGuy from "@/app/images/badguy.png";

interface BadGuyIconProps {
	direction: "left" | "right";
}

export default function BadGuyIcon({ direction }: BadGuyIconProps) {
	return (
		<div style={{ transform: direction === "left" ? "none" : "scaleX(-1)" }}>
			<Image src={badGuy} alt="Bad Guy" width={60} height={60} />
		</div>
	);
}
