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

    render(ctx) {
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.fillStyle = '#000';
        let ex = this.x + 14, ey = this.y + 14;
        if (this.facing === 'left') ex = this.x + 4;
        if (this.facing === 'right') ex = this.x + 24;
        if (this.facing === 'up') ey = this.y + 4;
        if (this.facing === 'down') ey = this.y + 24;

        ctx.fillRect(ex, ey, 4, 4);
    }
}