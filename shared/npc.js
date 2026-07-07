export class NPC {
    constructor(x, y, color, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speed = speed;
        this.w = 32;
        this.h = 32;

        this.state = 'IDLE';
        this.timer = Math.random() * 2000;
        this.targetX = x;
        this.targetY = y;
    }

    update(dt, colliders) {
        this.timer -= dt;

        if(this.state === 'IDLE' && this.timer <= 0) {
            this.targetX = this.x + (Math.random() - 0.5) * 400;
            this.targetY = this.y + (Math.random() - 0.5) * 400;
            this.state = 'WANDERING';
            this.timer = 5000;  
        }

        if (this.state === 'WANDERING') {
            let dx = this.targetX - this.x;
            let dy = this.targetY - this.y;
            let dist = Math.hypot(dx, dy);

            if (dist < 5 || this.timer <= 0) {
                this.state = 'IDLE';
                this.timer = 1000 + Math.random() * 3000;
                return;
            }

            let moveX = (dx / dist) * this.speed * (dt / 1000);
            let moveY = (dy / dist) * this.speed * (dt / 1000);

            let oldX = this.x;
            let oldY = this.y;

            this.x += moveX;
            if (this.checkCollision(colliders)) {
                this.x = oldX;
                this.targetX = this.x;
            }

            this.y += moveY;
            if (this.checkCollision(colliders)) {
                this.y = oldY;
                this.targetY = this.y;
            }
        }
    }

    getRect() {
        return {
            left: this.x,
            right: this.x + this.w,
            top: this.y,
            bottom: this.y + this.h
        };
    }

    checkCollision(colliders) {
        const p = this.getRect();
        for (let c of colliders) {
            if (p.left < c.x + c.w && p.right > c.x &&
                p.top < c.y + c.h && p.bottom > c.y) {
                return true;
            }
        }
    }

    render(ctx, cx, cy) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x - cx + 16, this.y - cy + 30, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - cx, this.y - cy, this.w, this.h);

        ctx.fillStyle = 'black';
        if (this.targetX > this.x) {
            ctx.fillRect(this.x - cx + 20, this.y - cy + 8, 4, 4);
            ctx.fillRect(this.x - cx + 20, this.y - cy + 20, 4, 4);
        } else {
            ctx.fillRect(this.x - cx + 8, this.y - cy + 8, 4, 4);
            ctx.fillRect(this.x - cx + 8, this.y - cy + 20, 4, 4);
        }
    }
}