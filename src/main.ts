import { Game } from "./game";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement | null;
if (!canvas) {
	throw new Error("Cannot find <canvas id='gameCanvas'>");
}

const game = new Game(canvas);

const keysDown = {
	w: false,
	a: false,
	s: false,
	d: false,
	arrowUp: false,
	arrowDown: false,
	arrowLeft: false,
	arrowRight: false,
};

function handleKeyDown(e: KeyboardEvent) {
	switch (e.key) {
		case "w":
			keysDown.w = true;
			break;
		case "a":
			keysDown.a = true;
			break;
		case "s":
			keysDown.s = true;
			break;
		case "d":
			keysDown.d = true;
			break;
		case "ArrowUp":
			keysDown.arrowUp = true;
			break;
		case "ArrowDown":
			keysDown.arrowDown = true;
			break;
		case "ArrowLeft":
			keysDown.arrowLeft = true;
			break;
		case "ArrowRight":
			keysDown.arrowRight = true;
			break;
	}
}

function handleKeyUp(e: KeyboardEvent) {
	switch (e.key) {
		case "w":
			keysDown.w = false;
			break;
		case "a":
			keysDown.a = false;
			break;
		case "s":
			keysDown.s = false;
			break;
		case "d":
			keysDown.d = false;
			break;
		case "ArrowUp":
			keysDown.arrowUp = false;
			break;
		case "ArrowDown":
			keysDown.arrowDown = false;
			break;
		case "ArrowLeft":
			keysDown.arrowLeft = false;
			break;
		case "ArrowRight":
			keysDown.arrowRight = false;
			break;
	}
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

function gameLoop() {
	game.input = {
		up: keysDown.w,
		down: keysDown.s,
		left: keysDown.a,
		right: keysDown.d,
		shootUp: keysDown.arrowUp,
		shootDown: keysDown.arrowDown,
		shootLeft: keysDown.arrowLeft,
		shootRight: keysDown.arrowRight,
	};

	game.update();
	game.draw();

	requestAnimationFrame(gameLoop);
}

gameLoop();
