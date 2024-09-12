import React from "react";

interface RoadProps {
	width: number;
	height: number;
}

const Road: React.FC<RoadProps> = ({ width, height }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern
					id="roadPattern"
					patternUnits="userSpaceOnUse"
					width="20"
					height="20"
				>
					<rect width="20" height="20" fill="#A9A9A9" /> {/* Lighter gray */}
					<rect x="9" y="0" width="2" height="20" fill="#FFFF00" />
				</pattern>
			</defs>
			<rect width={width} height={height} fill="url(#roadPattern)" />
			<rect width={width} height={height} fill="url(#roadPattern)" />
		</svg>
	);
};

export default Road;
