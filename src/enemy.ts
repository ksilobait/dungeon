import { Projectile } from "./projectile";
import { TILE_SIZE } from "./tilemap";
import type { Vector2 } from "./types";

export class Enemy {
	position: Vector2;
	width: number;
	height: number;
	speed: number;
	health: number;

	desiredMoveX = 0;
	desiredMoveY = 0;

	shootCooldown = 0;
	shootDelay = 120;

	wanderTimer = 0;
	direction: Vector2 = { x: 0, y: 0 };

	constructor(x: number, y: number) {
		this.position = { x, y };
		this.width = TILE_SIZE * 0.8;
		this.height = TILE_SIZE * 0.8;
		this.speed = 1;
		this.health = 3;
	}

	update(projectiles: Projectile[], playerPos: Vector2) {
		if (this.wanderTimer <= 0) {
			this.wanderTimer = 60;
			this.direction = {
				x: Math.floor(Math.random() * 3) - 1,
				y: Math.floor(Math.random() * 3) - 1,
			};
		} else {
			this.wanderTimer--;
		}

		this.desiredMoveX = this.direction.x * this.speed;
		this.desiredMoveY = this.direction.y * this.speed;

		if (this.shootCooldown > 0) {
			this.shootCooldown--;
			return;
		}

		const dx = playerPos.x - this.position.x;
		const dy = playerPos.y - this.position.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist < 250) {
			const bulletSpeed = 2.5;
			const vx = (dx / dist) * bulletSpeed;
			const vy = (dy / dist) * bulletSpeed;
			projectiles.push(
				new Projectile(
					this.position.x + this.width / 2,
					this.position.y + this.height / 2,
					vx,
					vy,
					"enemy",
				),
			);
		}
		this.shootCooldown = this.shootDelay;
	}

	takeDamage(amount: number) {
		this.health -= amount;
	}

	drawAt(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement, drawX: number, drawY: number) {
		ctx.drawImage(sprite, drawX, drawY, this.width, this.height);
	}
}
