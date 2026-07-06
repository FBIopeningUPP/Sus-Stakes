import { PlayerController } from '../shared/player-controller.js';
import { StubGame } from '../games/stub-games.js';
import { BlackjackGame } from '../games/blackjack.js';
import { SlotsGame } from '../games/slots.js';
import { LedgerTerminal } from '../games/ledger.js';

export class LobbyScene {
    constructor(sceneManager, session, spawnPosition) {
        this.sm = sceneManager;
        this.canvas = sceneManager.canvas || document.getElementById('gameCanvas');
        this.session = session;

        this.keys = {};

        this.onKeyDown = (e) => {
            if (e.repeat) return;
            this.keys[e.key] = true;

            if (e.key.toLowerCase() === 'r') {
                if (confirm("Are you sure you want to completely wipe your save? This resets bankroll, clears your debt, and deletes your history."))
{
                    this.session.hardReset();
                }
            }
        };
        this.onKeyUp = (e) => {
            this.keys[e.key] = false;
        };

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const startX = spawnPosition ? spawnPosition.x : centerX - 16;
        const startY = spawnPosition ? spawnPosition.y : centerY + 50;

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
            { id: 'blackjack', label: 'BLACKJACK', x: centerX - 120, y: centerY - 50, w: 96, h: 96 },
            { id: 'slots', label: 'SLOTS', x: centerX + 50, y: centerY - 50, w: 96, h: 96 },
            { id: 'shark', label: 'LOAN SHARK', x: 60 , y: 60, w: 96, h: 96 },
            { id: 'ledger', label: 'LEDGER', x: centerX - 32, y: 60, w: 96, h: 96 }
        ];

        this.images = {};
        const assetNames = ['player', 'blackjack', 'slots', 'shark', 'ledger'];
        for (let name of assetNames) {
            let img = new Image();
            img.src = `assets/${name}.png`;
            this.images[name] = img;
        }

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

            const returnPos = { x: this.player.x, y: this.player.y, facing: this.player.facing };

            if (this.activeCabinet.id === 'blackjack') {
                this.sm.changeScene(new BlackjackGame(this.sm, this.session, this.activeCabinet.id, returnPos));
            } else if (this.activeCabinet.id === 'slots') {
                this.sm.changeScene(new SlotsGame(this.sm, this.session, this.activeCabinet.id, returnPos));
            } else if (this.activeCabinet.id === 'ledger') {
                this.sm.changeScene(new LedgerTerminal(this.sm, this.session, this.activeCabinet.id, returnPos));
            } else if (this.activeCabinet.id === 'shark') {
                if (this.session.bankroll < 50) {
                    alert("SHARK: BOI HERE's YO 1000 dolla dolla, now you owe me 1500 dolla dolla, i will be grabbing all yo 20% form yo win");
                } else {
                    alert("SHARK: You still got chips. Come back when you're actually broke, kid.");
                }
            } else {
                this.sm.changeScene(new StubGame(this.sm, this.session, this.activeCabinet.id, returnPos));
            }
        }
    }

    render(ctx) {
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#95a5a6';
        for (let w of this.walls) ctx.fillRect(w.x, w.y, w.w, w.h);

        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Bankroll: $${this.session.bankroll}`, 20, 30);

        if (this.session.debt > 0) {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(`Debt: $${this.session.debt}`, 20, 60);
        }

        for (let cab of this.cabinets) {
            if (this.images[cab.id] && this.images[cab.id].complete && this.images[cab.id].naturalWidth > 0) {
                ctx.drawImage(this.images[cab.id], cab.x, cab.y, cab.w, cab.h);
            } else {
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(cab.x, cab.y, cab.w, cab.h);
            }

            ctx.fillStyle = '#fff';
            ctx.font = '14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(cab.label, cab.x, cab.y - 10);
        }

        this.player.render(ctx, this.images['player']);

        if (this.activeCabinet) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = '18px monospace';
            ctx.textAlign = 'left';

            ctx.fillText("Press E to interact", this.activeCabinet.x - 20, this.activeCabinet.y - 30);
        }
    }
    handleClick(x, y) {}
}