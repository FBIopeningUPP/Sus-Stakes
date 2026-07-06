import { PlayerController } from '../shared/player-controller.js';
import { StubGame } from '../games/stub-games.js';

export class LobbyScene {
    constructor(sceneManager, session, spawnPosition) {
        this.sm = sceneManager;

        this.canvas = sceneManager.canvas || document.createElementById('game-canvas');
        this.session = session;

        this.keys = {};
        
        this.onKeyDown = (e) => {
            if (e.repeat) return;
            this.keys[e.code] = true;
        };

        this.onKeyUp = (e) => {
            this.keys[e.code] = false;
        };

        const startX = spawnPosition ? spawnPosition.x : this.canvas.width / 2 - 16;
        const startY = spawnPosition ? spawnPosition.y : this.canvas.height - 80;

        this.player = new PlayerController(startX, startY);
        if (spawnPosition) this.player.facing = spawnPosition.facing;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const thick = 40;

        this.walls = [
            { x: 0, y: 0, w: w, h: thick },
            { x: 0, y: h - thick, w: w, h: thick },
            { x: 0, y: 0, w: thick, h: h },
            { x: w - thick, y: 0, w: thick, h: h }
        ];

        this.cabinets = [
            { id: 'blackjack', label: 'BLACKJACK', x: 200, y: 100, w: 64, h: 64 },
            { id: 'slots', label: 'SLOTS', x: 400, y: 100, w: 64, h: 64 },
        ];

        this.reach = 20;
        this.activeCabinet = null;
    }

    init() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    cleanup() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }

    update(dt) {
        const colliders = [...this.walls, ...this.cabinets];
        this.player.update(dt, this.keys, colliders);
        
        const p = this.player.getRect();
        this.activeCabinet = null;

        for (let cab of this.cabinets) {
            if (p.left < cab.x + cab.w + this.reach &&
                p.right > cab.x - this.reach &&
                p.top < cab.y + cab.h + this.reach &&
                p.bottom > cab.y - this.reach) {
                this.activeCabinet = cab;
                break;
            }
        }

        if (this.activeCabinet && (this.keys['e'] || this.keys['E'])) {
            this.keys['e'] = false;
            this.keys['E'] = false;

            const returnPos = {
                x: this.player.x,
                y: this.player.y,
                facing: this.player.facing
            };

            this.sm.changeScene(new StubGame(this.sm, this.session, this.activeCabinet.id, returnPos));
        }
    }

    render(ctx) {
        ctx.fillStyle = '#2f3640';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#353b48';
        for (let w of this.walls) ctx.fillRect(w.x, w.y, w.w, w.h);

        for (let cab of this.cabinets) {
            ctx.fillStyle = '#fbc531';
            ctx.fillRect(cab.x, cab.y, cab.w, cab.h);

            ctx.fillStyle = '#fff'
            ctx.font = '14px monospace';
            ctx.fillText(cab.label, cab.x, cab.y - 10);
        }

        this.player.render(ctx);

        if (this.activeCabinet) {
            ctx.fillStyle = '#05c46b';
            ctx.font = '16px monospace';
            ctx.fillText("press E to play", this.activeCabinet.x, this.activeCabinet.y - 30);
        }
    }

    handleClick(x, y) {}
}