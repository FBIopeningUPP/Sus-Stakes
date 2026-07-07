import { PlayerController } from '../shared/player-controller.js';
import { StubGame } from '../games/stub-games.js';
import { BlackjackGame } from '../games/blackjack.js';
import { SlotsGame } from '../games/slots.js';
import { LedgerTerminal } from '../games/ledger.js';
import { PokerGame } from '../games/poker.js';

import { Camera } from '../shared/camera.js';
import { NPC } from '../shared/npc.js';

import { RouletteGame } from '../games/roulette.js';

export class LobbyScene {
    constructor(sceneManager, session, spawnPosition) {
        this.sm = sceneManager;
        this.canvas = sceneManager.canvas || document.getElementById('gameCanvas');
        this.session = session;
        this.keys = {};

        this.mapW = 1200;
        this.mapH = 800;

        this.camera = new Camera(this.canvas.width, this.canvas.height, this.mapW, this.mapH);
        
        this.onKeyDown = (e) => {
            if (e.repeat) return;
            this.keys[e.key] = true;
            if (e.key.toLowerCase() === 'r') {
                if (confirm('Wipe Save?')) this.session.hardReset();
            }
        };

        this.onKeyUp = (e) => {this.keys[e.key] = false;};

        const startX = spawnPosition ? spawnPosition.x : this.mapW / 2;
        const startY = spawnPosition ? spawnPosition.y : this.mapH - 200;

        this.player = new PlayerController(startX, startY);
        if (spawnPosition) this.player.facing = spawnPosition.facing;

        const thick = 40;

        this.walls = [
            { x: 0, y: 0, w: this.mapW, h: thick },
            { x: 0, y: this.mapH - thick, w: this.mapW, h: thick },
            { x: 0, y: 0, w: thick, h: this.mapH },
            { x: this.mapW - thick, y: 0, w: thick, h: this.mapH },
            { x: this.mapW - 600, y: 0, w: thick, h: 400 },
            { x: this.mapW - 600, y: 400, w: 600, h: thick },
            { x: this.mapW - 600, y: 400, w: 200, h: thick },
            { x: 800, y: 0, w: thick, h: 440 },
            { x: 800, y: 440, w: 400, h: thick },
        ];

        this.cabinets = [
            { id: 'slots', label: 'SLOTS', x: 200, y: 150, w: 96, h: 96 },
            { id: 'blackjack', label: 'BLACKJACK', x: 400, y: 150, w: 96, h: 96 },
            { id: 'roulette', label: 'ROULETTE', x: 600, y: 150, w: 96, h: 96 },

            { id: 'poker', label: 'POKER', x: 300, y: 450, w: 96, h: 96 },
            { id: 'ledger', label: 'LEDGER', x: 500, y: 450, w: 96, h: 96 },

            { id: 'shark', label: 'LOAN SHARK', x: 950, y: 100, w: 96, h: 96 },
            { id: 'poker', label: 'VIP POKER', x: 950, y: 250, w: 96, h: 96 }
        ];

        this.npcs = [];
        const colors = ['#e74c3c', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c'];

        for(let i = 0; i<15; i++) {
            let nx = 100 + Math.random() * (this.mapW - 800);
            let ny = 100 + Math.random() * (this.mapH - 200);
            let c = colors[Math.floor(Math.random() * colors.length)];
            this.npcs.push(new NPC(nx, ny, c, 80 + Math.random() * 50));
        }

        this.bouncer = new NPC(this.mapW - 320, 400, '#000', 0);
        this.bouncer.state = 'IDLE';
        this.bouncer.timer = 0;
        this.bouncer.w = 40;
        this.bouncer.h = 40;
        this.npcs.push(this.bouncer);

        this.images = {};
        const assetNames = ['player', 'blackjack', 'slots', 'shark', 'ledger'];
        for (let name of assetNames) {
            let img = new Image();
            img.src = `assets/${name}.png`;
            this.images[name] = img;
        }

        this.reach = 30;
        this.activeCabinet = null;
        this.isNearBouncer = false;
    }

    init() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);

        this.sm.spawnFloatingText("WASD TO MOVE - E TO INTERACT", this.canvas.width/2, this.canvas.height - 100, '#f1c40f');
    }

    cleanup() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }

    update(dt) {
        const colliders = [...this.walls, ...this.cabinets];

        this.player.update(dt, this.keys, colliders);

        this.camera.follow(this.player.x + 16, this.player.y + 16);

        for(let n of this.npcs) {
            n.update(dt, colliders);
        }

        const p = this.player.getRect();  

        this.isNearBouncer = false;
        let bx = this.bouncer.x;
        let by = this.bouncer.y;

        if (Math.hypot((this.player.x)-bx, (this.player.y)-by) < 80) {
            this.isNearBouncer = true;
            if (this.keys['e'] || this.keys['E']) {
                this.keys['e'] = false;
                if (this.session.bankroll < 25000) {
                    alert("BOUNCER: VIPs only. Come back when you have $25,000, scrub.");
                    this.player.y += 60;
                    this.sm.audio.playLose();
                } else {
                    alert("BOUNCER: Right this way, boss.");
                    this.player.y -= 80;
                    this.sm.audio.playWin();
                }
            }
        }

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
            const returnPos = { x: this.player.x, y: this.player.y, facing: this.player.facing };

            if (this.activeCabinet.id === 'blackjack') {
                this.sm.changeScene(new BlackjackGame(this.sm, this.session, this.activeCabinet.id, returnPos));
            } else if (this.activeCabinet.id === 'slots') {
                this.sm.changeScene(new SlotsGame(this.sm, this.session, this.activeCabinet.id, returnPos));
            } else if (this.activeCabinet.id === 'ledger') {
                this.sm.changeScene(new LedgerTerminal(this.sm, this.session, this.activeCabinet.id, returnPos));
            } else if (this.activeCabinet.id === 'poker') {
                this.sm.changeScene(new PokerGame(this.sm, this.session, this.activeCabinet.id, returnPos));
            } else if (this.activeCabinet.id === 'roulette') {
                this.sm.changeScene(new RouletteGame(this.sm, this.session, this.activeCabinet.id, returnPos));
            } else if (this.activeCabinet.id === 'shark') {
                if (this.session.bankroll < 50) {
                    alert("SHARK: Take this $1000. Don't make me come looking for it.");
                    this.session.takeLoan();
                    this.sm.audio.playCoin();
                } else {
                    alert("SHARK: You still got chips. Scram.");
                }
            } else {
                this.sm.changeScene(new StubGame(this.sm, this.session, this.activeCabinet.id, returnPos));
            }
        }
    }

    render(ctx) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);

        ctx.fillStyle = '#c0392b';
        ctx.fillRect(0, 0, this.mapW, this.mapH);

        ctx.fillStyle = '#a93226';
        const tileSize = 50;
        for (let x = 0; x < this.mapW; x += tileSize) {
            for (let y = 0; y < this.mapH; y += tileSize) {
                if ((Math.floor(x/tileSize) + Math.floor(y/tileSize)) % 2 === 0) {
                    ctx.fillRect(x, y, tileSize, tileSize);
                }
            }
        }

        ctx.fillStyle = '#111';
        ctx.fillRect(800, 0, 400, 440);

        ctx.fillStyle = '#f1c40f';
        for (let x = 800; x < this.mapW; x += tileSize) {
            for (let y = 0; y < 440; y += tileSize) {
                if ((Math.floor(x/tileSize) + Math.floor(y/tileSize)) % 2 === 0) {
                    ctx.fillRect(x, y, tileSize, tileSize);
                }
            }
        }

        for (let w of this.walls) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(w.x + 15, w.y + 15, w.w, w.h);

            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(w.x + 5, w.y + 5, w.w, w.h /2);
        }

        for (let cab of this.cabinets) {
            if (this.images[cab.id] && this.images[cab.id].complete && this.images[cab.id].naturalWidth > 0) {
                ctx.drawImage(this.images[cab.id], cab.x, cab.y, cab.w, cab.h); 
            } else {
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(cab.x, cab.y, cab.w, cab.h);
            }
            ctx.fillStyle = 'black';
            ctx.font = '16px Kenney';
            ctx.textAlign = 'center';
            ctx.fillText(cab.label, cab.x + cab.w/2, cab.y + cab.h - 15);
        }

        for(let n of this.npcs) {
            n.render(ctx, 0, 0);
        }

        this.player.render(ctx, this.images['player']);

        if (this.activeCabinet) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = '20px Kenney';
            ctx.textAlign = 'center';
            ctx.fillText("Press E to interact", this.activeCabinet.x + this.activeCabinet.w/2, this.activeCabinet.y - 40);
        }

        if (this.isNearBouncer) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '20px Kenney';
            ctx.textAlign = 'center';
            ctx.fillText("Press E to Bribe Bouncer", this.bouncer.x + 20, this.bouncer.y - 20);
        }

        ctx.restore();

        this.sm.drawHUD(ctx, this.session);
    }
}