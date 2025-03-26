import { Projectile } from "./projectile";
import { TILE_SIZE } from "./tilemap";
import type { Vector2 } from "./types";

export class Player {
	position: Vector2;
	width: number;
	height: number;
	speed: number;

	desiredMoveX = 0;
	desiredMoveY = 0;

	health: number;
	coins: number;
	damage: number;

	shootCooldown = 0;
	shootDelay = 80;

	constructor(x: number, y: number) {
		this.position = { x, y };
		this.width = TILE_SIZE * 0.8;
		this.height = TILE_SIZE * 0.8;
		this.speed = 1;

		this.health = 5;
		this.coins = 0;
		this.damage = 1;
	}

	update(
		input: {
			up: boolean;
			down: boolean;
			left: boolean;
			right: boolean;
			shootUp: boolean;
			shootDown: boolean;
			shootLeft: boolean;
			shootRight: boolean;
		},
		projectiles: Projectile[],
	) {
		this.desiredMoveX = 0;
		this.desiredMoveY = 0;

		if (input.up) this.desiredMoveY -= this.speed;
		if (input.down) this.desiredMoveY += this.speed;
		if (input.left) this.desiredMoveX -= this.speed;
		if (input.right) this.desiredMoveX += this.speed;

		if (this.shootCooldown > 0) {
			this.shootCooldown--;
		} else {
			let dirX = 0;
			let dirY = 0;
			if (input.shootUp) dirY = -1;
			if (input.shootDown) dirY = 1;
			if (input.shootLeft) dirX = -1;
			if (input.shootRight) dirX = 1;

			if (dirX !== 0 || dirY !== 0) {
				const bulletSpeed = 3;
				projectiles.push(
					new Projectile(
						this.position.x + this.width / 2,
						this.position.y + this.height / 2,
						dirX * bulletSpeed,
						dirY * bulletSpeed,
						"player",
					),
				);
				this.shootCooldown = this.shootDelay;
			}
		}
	}

	takeDamage(amount: number) {
		this.health -= amount;
		if (this.health < 0) this.health = 0;
	}

	drawAt(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement, drawX: number, drawY: number) {
		ctx.drawImage(sprite, drawX, drawY, this.width, this.height);
	}
}
