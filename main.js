import { SceneManager } from './shared/scene-manager.js';
import { ExteriorScene } from './scenes/exterior-scene.js';
import { CasinoSession } from './shared/casino-session.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const session = new CasinoSession();
session.load();

const sceneManager = new SceneManager(ctx, session);
const mouse = { x: 0, y: 0 };

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x  = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    if (sceneManager.currentScene && sceneManager.currentScene.handleHover){
        sceneManager.currentScene.handleHover(mouse.x, mouse.y);
    }
});

canvas.addEventListener('click', (e) => {
    if (sceneManager.currentScene && sceneManger.currentScene.handleClick){
        sceneManager.currentScene.handleClick(mouse.x, mouse.y);
    }
});

const exteriorScene = new ExteriorScene(sceneManager, session);
sceneManager.currentScene = exteriorScene;
if (exteriorScene.init) exteriorScene.init();

let lastTime = performance.now();
const timeStep = 1000 / 60;
let accumulatedTime = 0;

function gameLoop(currentTime){
    requestAnimationFrame(gameLoop);

    let deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    if (deltaTime > 250) {
        deltaTime = 250;
    }

    accumulatedTime += deltaTime;

    try {
        while (accumulatedTime >= timeStep) {
            sceneManager.update(timeStep);
            accumulatedTime -= timeStep;
        }
        sceneManager.render();
    }   catch (error) {
        alert("GAME CRASHED!\nError: " + err.message + "\n\nStack:\n" + err.stack);
        throw err;
    }
}

requestAnimationFrame(gameLoop);