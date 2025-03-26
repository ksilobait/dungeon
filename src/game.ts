import { Enemy } from "./enemy";
import { Player } from "./player";
import type { Projectile } from "./projectile";
import { ShopKeeper, ShopTypes } from "./shopkeeper";
import {
	COINS_TILE,
	EMPTY_TILE,
	EXIT_TILE,
	LEVEL_MAP,
	MAP_HEIGHT,
	MAP_WIDTH,
	TILE_SIZE,
	WALL_TILE,
	generateDungeon,
	generateShopDungeon,
	generationMethodName,
} from "./tilemap";

interface InputState {
	up: boolean;
	down: boolean;
	left: boolean;
	right: boolean;
	shootUp: boolean;
	shootDown: boolean;
	shootLeft: boolean;
	shootRight: boolean;
}

export class Game {
	private gameOver = false;
	private levelNumber = 1;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	public input: InputState;
	private player!: Player;
	private enemies: Enemy[];
	private projectiles: Projectile[];
	private shopKeepers: ShopKeeper[];
	private cameraX = 0;
	private cameraY = 0;
	private cameraWidth: number;
	private cameraHeight: number;

	private playerImage: HTMLImageElement;
	private enemyImage: HTMLImageElement;
	private wallImage: HTMLImageElement;
	private floorImage: HTMLImageElement;
	private exitImage: HTMLImageElement;
	private coinsImage: HTMLImageElement;
	private shopKeeperImage: HTMLImageElement;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const c = canvas.getContext("2d");
		if (!c) throw new Error("no ctx");
		this.ctx = c;
		this.input = {
			up: false,
			down: false,
			left: false,
			right: false,
			shootUp: false,
			shootDown: false,
			shootLeft: false,
			shootRight: false,
		};
		this.cameraWidth = canvas.width;
		this.cameraHeight = canvas.height;

		this.enemies = [];
		this.projectiles = [];
		this.shopKeepers = [];

		this.playerImage = new Image();
		this.playerImage.src = "/assets/player.png";
		this.enemyImage = new Image();
		this.enemyImage.src = "/assets/enemy.png";
		this.wallImage = new Image();
		this.wallImage.src = "/assets/wall.png";
		this.floorImage = new Image();
		this.floorImage.src = "/assets/floor.png";
		this.exitImage = new Image();
		this.exitImage.src = "/assets/exit.png";
		this.coinsImage = new Image();
		this.coinsImage.src = "/assets/coins.png";
		this.shopKeeperImage = new Image();
		this.shopKeeperImage.src = "/assets/shopkeeper.png";

		this.resetLevel();
	}

	private resetLevel(): void {
		if (this.levelNumber % 5 === 0) {
			generateShopDungeon();
		} else {
			generateDungeon();
		}

		const spawn = this.findSpawnLocation();
		let oldHealth = 5;
		let oldCoins = 0;
		if (this.player) {
			oldHealth = this.player.health;
			oldCoins = this.player.coins;
		}
		this.player = new Player(spawn.x, spawn.y);
		this.player.health = oldHealth;
		this.player.coins = oldCoins;

		this.enemies = [];
		this.projectiles = [];
		this.shopKeepers = [];
		this.gameOver = false;

		if (this.levelNumber % 5 === 0) {
			for (const shopType of ShopTypes) {
				const loc = this.findSpawnLocation();
				this.shopKeepers.push(new ShopKeeper(loc.x, loc.y, 3, shopType.name, shopType.desc));
			}
		} else {
			for (let i = 0; i < (this.levelNumber + 1) / 2; i++) {
				const ep = this.findSpawnLocation();
				this.enemies.push(new Enemy(ep.x, ep.y));
			}
		}
	}

	private findSpawnLocation(): { x: number; y: number } {
		while (true) {
			const rx = Math.floor(Math.random() * MAP_WIDTH);
			const ry = Math.floor(Math.random() * MAP_HEIGHT);
			if (LEVEL_MAP[ry][rx] !== EMPTY_TILE) continue;
			const px = rx * TILE_SIZE;
			const py = ry * TILE_SIZE;
			const w = TILE_SIZE * 0.8;
			const h = TILE_SIZE * 0.8;
			if (!this.testCollision(px, py, w, h)) return { x: px, y: py };
		}
	}

	private testCollision(x: number, y: number, w: number, h: number): boolean {
		const left = Math.floor(x / TILE_SIZE);
		const right = Math.floor((x + w) / TILE_SIZE);
		const top = Math.floor(y / TILE_SIZE);
		const bottom = Math.floor((y + h) / TILE_SIZE);
		for (let ty = top; ty <= bottom; ty++) {
			for (let tx = left; tx <= right; tx++) {
				if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
				if (LEVEL_MAP[ty][tx] === WALL_TILE) return true;
			}
		}
		return false;
	}

	public update(): void {
		if (this.gameOver) {
			return;
		}
		if (this.player.health <= 0) {
			this.gameOver = true;
			this.levelNumber = 1;
			this.player.health = 5;
			this.player.coins = 0;
			this.resetLevel();
			return;
		}

		this.player.update(this.input, this.projectiles);
		const oldX = this.player.position.x;
		this.player.position.x += this.player.desiredMoveX;
		if (this.checkCollision(this.player)) this.player.position.x = oldX;
		const oldY = this.player.position.y;
		this.player.position.y += this.player.desiredMoveY;
		if (this.checkCollision(this.player)) this.player.position.y = oldY;
		this.checkItems();
		for (const e of this.enemies) {
			e.update(this.projectiles, this.player.position);
			const ex0 = e.position.x;
			e.position.x += e.desiredMoveX;
			if (this.checkCollision(e)) e.position.x = ex0;
			const ey0 = e.position.y;
			e.position.y += e.desiredMoveY;
			if (this.checkCollision(e)) e.position.y = ey0;
		}
		for (let i = this.projectiles.length - 1; i >= 0; i--) {
			const proj = this.projectiles[i];
			proj.update();
			if (this.outOfMap(proj) || this.hitWall(proj)) {
				this.projectiles.splice(i, 1);
				continue;
			}
			if (proj.owner === "player") {
				for (const en of this.enemies) {
					if (this.circleRect(proj, en)) {
						en.takeDamage(this.player.damage);
						this.projectiles.splice(i, 1);
						break;
					}
				}
			} else {
				if (this.circleRect(proj, this.player)) {
					this.player.takeDamage(1);
					this.projectiles.splice(i, 1);
				}
			}
		}
		for (const k of this.shopKeepers) {
			k.update(this.player);
		}
		this.enemies = this.enemies.filter((e) => e.health > 0);
	}

	public draw(): void {
		this.updateCamera();
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		for (let y = 0; y < MAP_HEIGHT; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {
				const sx = x * TILE_SIZE - this.cameraX;
				const sy = y * TILE_SIZE - this.cameraY;
				if (LEVEL_MAP[y][x] === WALL_TILE) {
					this.ctx.drawImage(this.wallImage, sx, sy, TILE_SIZE, TILE_SIZE);
				} else if (LEVEL_MAP[y][x] === EXIT_TILE) {
					this.ctx.drawImage(this.floorImage, sx, sy, TILE_SIZE, TILE_SIZE);
					this.ctx.drawImage(this.exitImage, sx, sy, TILE_SIZE, TILE_SIZE);
				} else if (LEVEL_MAP[y][x] === COINS_TILE) {
					this.ctx.drawImage(this.floorImage, sx, sy, TILE_SIZE, TILE_SIZE);
					this.ctx.drawImage(this.coinsImage, sx, sy, TILE_SIZE, TILE_SIZE);
				} else {
					this.ctx.drawImage(this.floorImage, sx, sy, TILE_SIZE, TILE_SIZE);
				}
			}
		}
		for (const pr of this.projectiles) {
			const px = pr.position.x - this.cameraX;
			const py = pr.position.y - this.cameraY;
			pr.drawAt(this.ctx, px, py);
		}
		for (const en of this.enemies) {
			const ex = en.position.x - this.cameraX;
			const ey = en.position.y - this.cameraY;
			en.drawAt(this.ctx, this.enemyImage, ex, ey);
		}
		for (const keeper of this.shopKeepers) {
			const sx = keeper.position.x - this.cameraX;
			const sy = keeper.position.y - this.cameraY;
			keeper.drawAt(this.ctx, this.shopKeeperImage, sx, sy);
		}

		const xx = this.player.position.x - this.cameraX;
		const yy = this.player.position.y - this.cameraY;
		this.player.drawAt(this.ctx, this.playerImage, xx, yy);
		this.ctx.fillStyle = "white";
		this.ctx.font = "16px sans-serif";
		this.ctx.fillText(`Level: ${this.levelNumber}`, 10, 20);
		this.ctx.fillText(`Health: ${this.player.health}`, 10, 40);
		this.ctx.fillText(`Coins: ${this.player.coins}`, 10, 60);
		this.ctx.fillText(`Gen: ${generationMethodName}`, 10, 80);
	}

	private updateCamera(): void {
		const cx = this.player.position.x + this.player.width / 2;
		const cy = this.player.position.y + this.player.height / 2;
		this.cameraX = cx - this.cameraWidth / 2;
		this.cameraY = cy - this.cameraHeight / 2;
		const maxX = MAP_WIDTH * TILE_SIZE - this.cameraWidth;
		const maxY = MAP_HEIGHT * TILE_SIZE - this.cameraHeight;
		if (this.cameraX < 0) this.cameraX = 0;
		if (this.cameraY < 0) this.cameraY = 0;
		if (this.cameraX > maxX) this.cameraX = maxX;
		if (this.cameraY > maxY) this.cameraY = maxY;
	}

	private checkItems(): void {
		const tx = Math.floor((this.player.position.x + this.player.width / 2) / TILE_SIZE);
		const ty = Math.floor((this.player.position.y + this.player.height / 2) / TILE_SIZE);
		if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
			if (LEVEL_MAP[ty][tx] === EXIT_TILE) {
				this.levelNumber++;
				this.resetLevel();
			}
			if (LEVEL_MAP[ty][tx] === COINS_TILE) {
				this.player.coins++;
				LEVEL_MAP[ty][tx] = EMPTY_TILE;
			}
		}
	}

	private checkCollision(obj: {
		position: { x: number; y: number };
		width: number;
		height: number;
	}): boolean {
		const left = Math.floor(obj.position.x / TILE_SIZE);
		const right = Math.floor((obj.position.x + obj.width) / TILE_SIZE);
		const top = Math.floor(obj.position.y / TILE_SIZE);
		const bottom = Math.floor((obj.position.y + obj.height) / TILE_SIZE);
		for (let ty = top; ty <= bottom; ty++) {
			for (let tx = left; tx <= right; tx++) {
				if (this.isWall(tx, ty)) return true;
			}
		}
		return false;
	}

	private isWall(x: number, y: number): boolean {
		if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return true;
		return LEVEL_MAP[y][x] === WALL_TILE;
	}

	private outOfMap(p: Projectile): boolean {
		return (
			p.position.x < 0 ||
			p.position.y < 0 ||
			p.position.x >= MAP_WIDTH * TILE_SIZE ||
			p.position.y >= MAP_HEIGHT * TILE_SIZE
		);
	}

	private hitWall(p: Projectile): boolean {
		const tx = Math.floor(p.position.x / TILE_SIZE);
		const ty = Math.floor(p.position.y / TILE_SIZE);
		if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
		return LEVEL_MAP[ty][tx] === WALL_TILE;
	}

	private circleRect(
		p: Projectile,
		r: { position: { x: number; y: number }; width: number; height: number },
	): boolean {
		const distX = Math.abs(p.position.x - (r.position.x + r.width / 2));
		const distY = Math.abs(p.position.y - (r.position.y + r.height / 2));
		if (distX > r.width / 2 + p.radius) return false;
		if (distY > r.height / 2 + p.radius) return false;
		if (distX <= r.width / 2) return true;
		if (distY <= r.height / 2) return true;
		const xx = distX - r.width / 2;
		const yy = distY - r.height / 2;
		return xx * xx + yy * yy <= p.radius * p.radius;
	}
}
