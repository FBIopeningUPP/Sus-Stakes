import { LobbyScene } from '../scenes/lobby-scene.js';

export class StubGame {
    constructor(sceneManager, session, gameId, returnPosition) {
        this.sm = sceneManager;
        this.session = session;
        this.gameId = gameId;
        this.returnPosition = returnPosition;

        this.onKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.sm.changeScene(new LobbyScene(this.sm, this.session, this.returnPosition));
            }
        };
    }

    init() {
        window.addEventListener('keydown', this.onKeyDown);
    }

    cleanup() {
        window.removeEventListener('keydown', this.onKeyDown);
    }

    update(dt) {
    }

    render(ctx) {
        const w = this.sm.canvas.width;
        const h = this.sm.canvas.height;

        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fff';
        ctx.font = '32px monospace';
        ctx.textAlign = 'center';

        ctx.fillText(`PLAYING: ${this.gameId.toUpperCase()}`, w / 2, h / 2 - 20);
        
        ctx.font = '20px monospace';
        ctx.fillText("Press ESC to ext", w / 2, h / 2 + 30);

        ctx.textAlign = 'left';
    }

    handleClick(x, y) {}
}
