import type { Player } from "./player";
import { TILE_SIZE } from "./tilemap";
import type { Vector2 } from "./types";

export const ShopTypes = [
	{ name: "health", desc: "Health + 3" },
	{ name: "speed", desc: "Speed++" },
	{ name: "delay", desc: "Delay--" },
	{ name: "damage", desc: "Damage++" },
];

export class ShopKeeper {
	position: Vector2;
	width: number;
	height: number;
	price: number;
	itemType: string;
	description: string;

	purchased = false;

	constructor(x: number, y: number, price: number, itemType: string, description: string) {
		this.position = { x, y };
		this.width = TILE_SIZE * 0.8;
		this.height = TILE_SIZE * 0.8;

		this.price = price;
		this.itemType = itemType;
		this.description = description;
	}

	applyEffect(player: Player): void {
		switch (this.itemType) {
			case "health":
				player.health += 3;
				break;
			case "speed":
				player.speed += 0.2;
				break;
			case "delay":
				player.shootDelay -= 5;
				break;
			case "damage":
				player.damage += 1;
				break;
		}
	}

	update(player: Player): void {
		if (this.purchased) {
			return;
		}

		const dx = player.position.x + player.width / 2 - (this.position.x + this.width / 2);
		const dy = player.position.y + player.height / 2 - (this.position.y + this.height / 2);
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist < 48 && player.coins >= this.price) {
			player.coins -= this.price;
			this.applyEffect(player);
			this.purchased = true;
		}
	}

	drawAt(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement, sx: number, sy: number): void {
		ctx.drawImage(sprite, sx, sy, 32, 32);
		ctx.fillStyle = "yellow";
		ctx.fillText(`${this.description}(${this.price}c)`, sx, sy - 2);
	}
}
