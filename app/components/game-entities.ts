export interface Character {
	x: number;
	y: number;
}

export interface Pet {
	x: number;
	y: number;
	vx: number;
	vy: number;
}

export interface BadGuy {
	x: number;
	y: number;
	vx: number;
	vy: number;
	remove?: boolean;
}
