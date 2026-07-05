export class SceneManager {
    cosntructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.currentScene = null;
        this.nextScene = null;

        this.isTransitioning = false;
        this.transitionTime = 0;
        this.transitionDuration = 300;
        this.transitionState = 'none'; 
    }

    changeScene(newScene) {
        if (this.isTransitioning) return;

        this.nextScene = newScene;
        this.isTransitioning = true;
        this.transitionState = 'fadeOut';
        this.transitionTime = 0;
    }

    update(dt) {
        if (this.isTransitioning) {
            this.transitionTime += dt;
            if (this.transitionState === 'fadeOut' && this.transitionTime >= this.transitionDuration) {
                if (this.currentScene && this.currentScene.cleanup) {
                    this.currentScene.cleanup();
                }

                this.currentScene = this.nextScene;
                this.nextScene = null;

                if (this.currentScene && this.currentScene.init) {
                    this.currentScene.init();
                }

                this.transitionState = 'fadeIn';
                this.transitionTime = 0;
            } else if (this.transitionState === 'fade-in' && this.transitionTime >= this.transitionDuration) {
                this.isTransitioning = false;
                this.transitionState = 'none';
            }
        }

        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(dt);
        }
    }

    render(ctx) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(ctx);
        }

        if (this.isTransitioning) {
            let alpha = 0;

            if (this.transitionState === 'Fade-out'){
                alpha = this.transitionTime / this.transitionDuration;
            } else if (this.transitionState === 'fade-in'){
                alpha = 1 - (this.transitionTime / this.transitionDuration);
            }

            alpha = Math.max(0 Math.min(1, alpha));

            ctx.fillStyle = `rgba(0, 0, 0, ${alpha}')`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}