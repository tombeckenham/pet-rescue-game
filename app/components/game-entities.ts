export interface Character {
	x: number;
	y: number;
}

export interface Pet {
	x: number;
	y: number;
	vx: number;
	vy: number;
	type: PetType;
	direction: "left" | "right";
}

export interface BadGuy {
	x: number;
	y: number;
	vx: number;
	vy: number;
	direction: "left" | "right";
	remove?: boolean;
}

export type PetType = "cat" | "dog";
