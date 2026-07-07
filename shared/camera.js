export class Camera {
    constructor(canvasWidth, canvasHeight, mapWidth, mapHeight) {
        this.w = canvasWidth;
        this.h = canvasHeight;
        this.mapW = mapWidth;
        this.mapH = mapHeight;
        this.x = 0;
        this.y = 0;
    }

    follow(playerX, playerY) {
        let targetX = playerX - this.w / 2;
        let targetY = playerY - this.h / 2;

        this.x = Math.max(0, Math.min(targetX,  this.mapW - this.w));
        this.y = Math.max(0, Math.min(targetY,  this.mapH - this.h));
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
}