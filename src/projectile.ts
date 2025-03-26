import { LEVEL_MAP, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, WALL_TILE } from "./tilemap";
import type { Vector2 } from "./types";

export class Projectile {
	position: Vector2;
	velocity: Vector2;
	owner: string;
	radius: number;

	constructor(x: number, y: number, vx: number, vy: number, owner: string) {
		this.position = { x, y };
		this.velocity = { x: vx, y: vy };
		this.owner = owner;

		if (owner === "enemy") {
			this.radius = 8;
			this.velocity.x *= 0.4;
			this.velocity.y *= 0.4;
		} else {
			this.radius = 5;
			this.velocity.x *= 0.5;
			this.velocity.y *= 0.5;
		}
	}

	update() {
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
	}

	isOutsideMap(): boolean {
		const maxW = MAP_WIDTH * TILE_SIZE;
		const maxH = MAP_HEIGHT * TILE_SIZE;
		return (
			this.position.x < 0 || this.position.y < 0 || this.position.x > maxW || this.position.y > maxH
		);
	}

	checkTileCollision(): boolean {
		const tx = Math.floor(this.position.x / TILE_SIZE);
		const ty = Math.floor(this.position.y / TILE_SIZE);
		if (ty < 0 || ty >= LEVEL_MAP.length || tx < 0 || tx >= LEVEL_MAP[0].length) {
			return true;
		}
		if (LEVEL_MAP[ty][tx] === WALL_TILE) {
			return true;
		}
		return false;
	}

	drawAt(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
		ctx.beginPath();
		ctx.fillStyle = this.owner === "player" ? "white" : "red";
		ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.closePath();
	}
}
