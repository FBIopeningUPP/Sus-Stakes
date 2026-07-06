export class PlayerController {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 32;
        this.h = 32;
        this.speed = 0.2; // pixels per ms
        this.facing = 'down';
    }

    getRect() {
        return {
            left: this.x,
            right: this.x + this.w,
            top: this.y,
            bottom: this.y + this.h
        };
    }

    update(dt, keys, colliders) {
        let dx = 0;
        let dy = 0;

        if (keys.ArrowLeft || keys.a) dx -= this.speed * dt;
        if (keys.ArrowRight || keys.d) dx += this.speed * dt;
        if (keys.ArrowUp || keys.w) dy -= this.speed * dt;
        if (keys.ArrowDown || keys.s) dy += this.speed * dt;

        if (dx < 0) this.facing = 'left';
        else if (dx > 0) this.facing = 'right';
        if (dy < 0) this.facing = 'up';
        else if (dy > 0) this.facing = 'down';

        this.x += dx;
        if (this.checkCollisions(colliders)) this.x -= dx; // 1st check

        this.y += dy;
        if (this.checkCollisions(colliders)) this.y -= dy; // 2nd check!
    }

    checkCollisions(colliders) {
        const p = this.getRect();
        for (let c of colliders) {
            if (p.left < c.x + c.w && p.right > c.x &&
                p.top < c.y + c.h && p.bottom > c.y) {
                return true;
            }
        }
        return false;
    }

    render(ctx, img) {
        if (img && img.complete) {
            ctx.drawImage(img, this.x - 16, this.y - 32, 64, 64);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x, this.y, 32, 32);
        }
    }
}