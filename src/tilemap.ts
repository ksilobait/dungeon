export const TILE_SIZE = 32;
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 25;
export const EMPTY_TILE = 0;
export const WALL_TILE = 1;
export const EXIT_TILE = 2;
export const COINS_TILE = 3;

export let LEVEL_MAP: number[][] = [];
export let generationMethodName = "";

export function generateDungeon(): void {
	LEVEL_MAP = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(WALL_TILE));
	const methods = [
		{ name: "Random Rooms", func: generateRandomRooms },
		{ name: "Cellular Automata", func: generateCellular },
		{ name: "Drunkard's Walk", func: generateDrunkard },
		{ name: "Maze (DFS)", func: generateMaze },
	];
	const choice = methods[Math.floor(Math.random() * methods.length)];
	generationMethodName = choice.name;
	choice.func();
	makeSingleConnected();
	placeExit();
	placeCoins(3);
}

export function generateShopDungeon(): void {
	LEVEL_MAP = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(WALL_TILE));
	const subW = 20;
	const subH = 15;
	const offX = Math.floor((MAP_WIDTH - subW) / 2);
	const offY = Math.floor((MAP_HEIGHT - subH) / 2);
	for (let y = offY; y < offY + subH; y++) {
		for (let x = offX; x < offX + subW; x++) {
			LEVEL_MAP[y][x] = EMPTY_TILE;
		}
	}
	placeExit();
	generationMethodName = "Shop Floor";
}
function generateRandomRooms(): void {
	fillAllWalls();
	const roomCount = 6;
	const minSize = 4;
	const maxSize = 7;
	const rooms: { x: number; y: number; w: number; h: number }[] = [];
	for (let i = 0; i < roomCount; i++) {
		const w = randRange(minSize, maxSize);
		const h = randRange(minSize, maxSize);
		const x = randRange(1, MAP_WIDTH - w - 1);
		const y = randRange(1, MAP_HEIGHT - h - 1);
		let overlap = false;
		for (const r of rooms) {
			if (x <= r.x + r.w && x + w >= r.x && y <= r.y + r.h && y + h >= r.y) {
				overlap = true;
				break;
			}
		}
		if (!overlap) {
			rooms.push({ x, y, w, h });
			carveRoom(x, y, w, h);
		}
	}
	rooms.sort((a, b) => a.x - b.x);
	for (let i = 0; i < rooms.length - 1; i++) {
		const a = {
			x: Math.floor(rooms[i].x + rooms[i].w / 2),
			y: Math.floor(rooms[i].y + rooms[i].h / 2),
		};
		const b = {
			x: Math.floor(rooms[i + 1].x + rooms[i + 1].w / 2),
			y: Math.floor(rooms[i + 1].y + rooms[i + 1].h / 2),
		};
		carveTunnel(a, b);
	}
}

function generateCellular(): void {
	fillAllWalls();
	for (let y = 0; y < MAP_HEIGHT; y++) {
		for (let x = 0; x < MAP_WIDTH; x++) {
			if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
				LEVEL_MAP[y][x] = WALL_TILE;
			} else {
				LEVEL_MAP[y][x] = Math.random() < 0.45 ? WALL_TILE : EMPTY_TILE;
			}
		}
	}
	for (let i = 0; i < 4; i++) {
		smooth();
	}
	function smooth(): void {
		for (let yy = 1; yy < MAP_HEIGHT - 1; yy++) {
			for (let xx = 1; xx < MAP_WIDTH - 1; xx++) {
				let wallCount = 0;
				for (const [dx, dy] of [
					[0, 1],
					[0, -1],
					[1, 0],
					[-1, 0],
					[1, 1],
					[1, -1],
					[-1, 1],
					[-1, -1],
				]) {
					if (LEVEL_MAP[yy + dy][xx + dx] === WALL_TILE) wallCount++;
				}
				if (wallCount > 4) LEVEL_MAP[yy][xx] = WALL_TILE;
				else LEVEL_MAP[yy][xx] = EMPTY_TILE;
			}
		}
	}
}

function generateDrunkard(): void {
	fillAllWalls();
	let x = Math.floor(MAP_WIDTH / 2);
	let y = Math.floor(MAP_HEIGHT / 2);
	LEVEL_MAP[y][x] = EMPTY_TILE;
	const target = Math.floor(MAP_WIDTH * MAP_HEIGHT * 0.4);
	let carved = 1;
	while (carved < target) {
		const d = Math.floor(Math.random() * 4);
		if (d === 0) y--;
		else if (d === 1) y++;
		else if (d === 2) x--;
		else x++;
		if (x < 1) x = 1;
		if (x > MAP_WIDTH - 2) x = MAP_WIDTH - 2;
		if (y < 1) y = 1;
		if (y > MAP_HEIGHT - 2) y = MAP_HEIGHT - 2;
		if (LEVEL_MAP[y][x] === WALL_TILE) {
			LEVEL_MAP[y][x] = EMPTY_TILE;
			carved++;
		}
	}
}

function generateMaze(): void {
	fillAllWalls();
	const subW = 20;
	const subH = 15;
	const offX = Math.floor((MAP_WIDTH - subW) / 2);
	const offY = Math.floor((MAP_HEIGHT - subH) / 2);
	carveCell(offX + 1, offY + 1);
	function carveCell(cx: number, cy: number): void {
		if (cx < offX + 1 || cx >= offX + subW - 1 || cy < offY + 1 || cy >= offY + subH - 1) return;
		LEVEL_MAP[cy][cx] = EMPTY_TILE;
		const dirs = shuffle([
			[0, -1],
			[0, 1],
			[-1, 0],
			[1, 0],
		]);
		for (const [dx, dy] of dirs) {
			const nx = cx + dx * 2;
			const ny = cy + dy * 2;
			if (
				nx >= offX + 1 &&
				nx < offX + subW - 1 &&
				ny >= offY + 1 &&
				ny < offY + subH - 1 &&
				LEVEL_MAP[ny][nx] === WALL_TILE
			) {
				LEVEL_MAP[cy + dy][cx + dx] = EMPTY_TILE;
				carveCell(nx, ny);
			}
		}
	}
}

function makeSingleConnected(): void {
	const visited = new Set<string>();
	const islands = [];
	for (let y = 0; y < MAP_HEIGHT; y++) {
		for (let x = 0; x < MAP_WIDTH; x++) {
			if (LEVEL_MAP[y][x] === EMPTY_TILE) {
				const key = `${x},${y}`;
				if (!visited.has(key)) {
					const comp = bfs(x, y, visited);
					islands.push({
						cells: comp,
						center: comp[Math.floor(comp.length / 2)],
					});
				}
			}
		}
	}
	if (islands.length < 2) return;
	for (let i = 1; i < islands.length; i++) {
		carveTunnel(islands[0].center, islands[i].center);
	}
}

function bfs(sx: number, sy: number, visited: Set<string>): { x: number; y: number }[] {
	const res = [];
	const q = [{ x: sx, y: sy }];
	visited.add(`${sx},${sy}`);
	while (q.length) {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const { x, y } = q.shift()!;
		res.push({ x, y });
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const nx = x + dx;
			const ny = y + dy;
			if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
			if (LEVEL_MAP[ny][nx] !== EMPTY_TILE) continue;
			const k = `${nx},${ny}`;
			if (!visited.has(k)) {
				visited.add(k);
				q.push({ x: nx, y: ny });
			}
		}
	}
	return res;
}

function placeExit(): void {
	while (true) {
		const rx = randRange(1, MAP_WIDTH - 2);
		const ry = randRange(1, MAP_HEIGHT - 2);
		if (LEVEL_MAP[ry][rx] === EMPTY_TILE) {
			LEVEL_MAP[ry][rx] = EXIT_TILE;
			break;
		}
	}
}

function placeCoins(n: number): void {
	let leftCoins = n;
	while (leftCoins > 0) {
		const rx = randRange(1, MAP_WIDTH - 2);
		const ry = randRange(1, MAP_HEIGHT - 2);
		if (LEVEL_MAP[ry][rx] === EMPTY_TILE) {
			LEVEL_MAP[ry][rx] = COINS_TILE;
			leftCoins -= 1;
		}
	}
}

function carveRoom(x: number, y: number, w: number, h: number): void {
	for (let row = y; row < y + h; row++) {
		for (let col = x; col < x + w; col++) {
			LEVEL_MAP[row][col] = EMPTY_TILE;
		}
	}
}

function carveTunnel(a: { x: number; y: number }, b: { x: number; y: number }): void {
	if (a.x < b.x) {
		for (let xx = a.x; xx <= b.x; xx++) LEVEL_MAP[a.y][xx] = EMPTY_TILE;
	} else {
		for (let xx = a.x; xx >= b.x; xx--) LEVEL_MAP[a.y][xx] = EMPTY_TILE;
	}
	if (a.y < b.y) {
		for (let yy = a.y; yy <= b.y; yy++) LEVEL_MAP[yy][b.x] = EMPTY_TILE;
	} else {
		for (let yy = a.y; yy >= b.y; yy--) LEVEL_MAP[yy][b.x] = EMPTY_TILE;
	}
}

function fillAllWalls(): void {
	for (let y = 0; y < MAP_HEIGHT; y++) {
		for (let x = 0; x < MAP_WIDTH; x++) {
			LEVEL_MAP[y][x] = WALL_TILE;
		}
	}
}

function randRange(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}
