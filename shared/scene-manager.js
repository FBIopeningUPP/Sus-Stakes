export class SceneManager {
        constructor(canvas, ctx) {
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
            this.transitionState = 'fade-out';
            this.transitionTime = 0;
        }

        update(dt) {
            if (this.isTransitioning) {
                this.transitionTime += dt;

                if (this.transitionState === 'fade-out' && this.transitionTime >= this.transitionDuration) {
                    if (this.currentScene && this.currentScene.cleanup) {
                        this.currentScene.cleanup();
                    }

                    this.currentScene = this.nextScene;
                    this.nextScene = null;

                    if (this.currentScene && this.currentScene.init) {
                        this.currentScene.init();
                    }

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
        }

        render(ctx) {
            // Fallback: If this.canvas is missing, try to use ctx.canvas safely
            const canvasWidth = (this.canvas && this.canvas.width) || ctx.canvas.width;
            const canvasHeight = (this.canvas && this.canvas.height) || ctx.canvas.height;

            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            if (this.currentScene && this.currentScene.render) {
                this.currentScene.render(ctx);
            }

            if (this.isTransitioning) {
                let alpha = 0;

                if (this.transitionState === 'fade-out') {
                    alpha = this.transitionTime / this.transitionDuration;
                } else if (this.transitionState === 'fade-in') {
                    alpha = 1 - (this.transitionTime / this.transitionDuration);
                }

                alpha = Math.max(0, Math.min(1, alpha));

                // Fixed standard string concatenation!
                ctx.fillStyle = 'rgba(0, 0, 0, ' + alpha + ')';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
        }
    }