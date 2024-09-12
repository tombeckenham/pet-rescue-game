import Image from "next/image";
import flag from "@/app/images/us-flag.png";

interface GateProps {
	width: number;
	height: number;
}

function Gate({ width, height }: GateProps) {
	return (
		<div className="gate relative" style={{ width, height }}>
			<div className="absolute top-[-100px] left-0 right-0 h-[100px] overflow-hidden">
				<Image src={flag} alt="US Flag" layout="fill" objectFit="cover" />
			</div>
			<div className="absolute inset-0 bg-green-800 border-4 border-gray-600">
				<div className="absolute top-0 left-0 right-0 h-2 bg-brown-600" />
				<div className="absolute bottom-0 left-0 right-0 h-2 bg-brown-600" />
			</div>
		</div>
	);
}

export default Gate;
