export class SceneManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.currentScene = null;
        this.nextScene = null;

        this.isTransitioning = false;
        this.transitionTime = 0;
        this.transitionDuration = 300;
        this.transitionState = 0;

        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.particles = [];
        this.floatingTexts = [];
    }

    shake(durationMs, intensity) {
        this.shakeTime = durationMs;
        this.shakeIntensity = intensity;
    }

    spawnConfetti(x, y, count) {
        const colors = ['#e74c3c', '#2ecc71', '#f1c40f', '#3498db', '#9b59b6'];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 1.0,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 6,
                rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.8
            })
        }
    }

    spawnFloatingText(text, x, y, color){
        this.floatingTexts.push({
            text: text,
            x: x,
            life: 1.0,
            color: color,
        });
    }

    changeScene(newScene) {
        if (this.isTransitioning) return;
        this.nextScene = newScene;
        this.isTransitioning = true;
        this.transitionState = 'fade-out';
        this.transitionTime = 0;
    }

    update(dt) {
        if (this.isTransitioning) {
            this.transitionTime += dt;
            if (this.transitionState === 'fade-out' && this.transitionTime >= this.transitionDuration) {
                if (this.currentScene && this.currentScene.cleanup) this.currentScene.cleanup();
                this.currentScene = this.nextScene;
                this.nextScene = null;
                if (this.currentScene && this.currentScene.init) this.currentScene.init();
                this.transitionState = 'fade-in';
                this.transitionTime = 0;
            } else if (this.transitionState === 'fade-in' && this.transitionTime >= this.transitionDuration) {
                this.isTransitioning = false;
                this.transitionState = 'none';
            }
        }

        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(dt);
        }

        if (this.shakeTime > 0) this.shakeTime -= dt;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles [i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5;
            p.rot += p.rotSpeed;
            p.life -= dt / 2000;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            let ft = this.floatingTexts[i];
            ft.y -= 1.5;
            ft.life -= dt / 1500;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    drawButton(ctx, x, y, w, h, text, color) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x + 4, y + 4, w, h);

        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, w, h - 5);
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, 5);

        ctx.fillStyle = '#000';
        ctx.font = '20px Kenney';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w/2, y + h/2 + 6);
    }

    drawHUD(ctx, session) {
        const W = (this.canvas && this.canvas.width) || ctx.canvas.width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, W, 50);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(0, 0, W, 5);

        ctx.textAlign = 'left';
        ctx.font = '24px Kenney';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`CASH: $${session.bankroll.toLocaleString()}`, 20, 36);

        if (session.debt > 0) {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(`DEBT: $${session.debt.toLocaleString()}`, W - 20, 36);
        }
    }

    render(ctx) {
        const W = (this.canvas && this.canvas.width) || ctx.canvas.width;
        const H = (this.canvas && this.canvas.height) || ctx.canvas.height;

        ctx.save();
        if (this.shakeTime > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(dx, dy);
        }

        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(ctx);
        }

        for (let p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }

        ctx.textAlign = 'center';
        for (let ft of this.floatingTexts) {
            ctx.font = '30px Kenney';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 10;
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = Math.max(0, ft.life);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.shadowColor = 'transparent';
        }
        ctx.globalAlpha = 1.0;
        ctx.restore();

        if (this.isTransitioning) {
            let alpha = (this.transitionState === 'fade-out')
                ? this.transitionTime / this.transitionDuration
                : 1 - (this.transitionTime / this.transitionDuration);
            ctx.fillStyle = 'rgba(0, 0, 0, ' + Math.max(0, Math.min(1, alpha)) + ')';
            ctx.fillRect(0, 0, W, H);
        }
    }
}