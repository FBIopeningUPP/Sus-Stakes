import { LobbyScene } from '../scenes/lobby-scene.js';

export class SlotsGame {
    constructor(sceneManager, session, gameId, returnPosition) {
        this.sm = sceneManager;
        this.session = session;
        this.gameId = gameId;
        this.returnPosition = returnPosition;

        this.symbols = ['CHERRY', 'BELL', 'BAR', 'SEVEN'];
        this.payouts = {
            'CHERRY': 2,
            'BELL': 5,
            'BAR': 10,
            'SEVEN': 50
        };

        this.state = 'IDLE';
        this.currentBet = Math.max(10, Math.min(10, this.session.bankroll));
        if (this.currentBet === 0) this.currentBet = 10;

        this.reels = ['SEVEN', 'SEVEN', 'SEVEN'];

        this.spinTime = 0;
        this.reelStops = [0, 0, 0];
        this.lastWin = 0;

        this.onKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.sm.changeScene(new LobbyScene(this.sm, this.session, this.returnPosition));
            }
        };

        this.symbolImages = {};
        const imageMap = {
            'BAR': 'slot-symbol1',
            'SEVEN': 'slot-symbol2',
            'CHERRY': 'slot-symbol3',
            'BELL': 'slot-symbol4'
        };

        for (let sym of this.symbols) {
            if (imageMap[sym]) {
                let img = new Image();
                img.src = `assets/slots/${imageMap[sym]}.png`;
                this.symbolImages[sym] = img;
            }
        }

        this.machineBase = new Image();
        this.machineBase.src = 'assets/slots/slot-machine1.png';
        
        this.leverMid = new Image();
        this.leverMid.src = 'assets/slots/slot-machine2.png';

        this.leverDown = new Image();
        this.leverDown.src = 'assets/slots/slot-machine3.png';
    }

    init() {
        window.addEventListener('keydown', this.onKeyDown);
    }

    cleanup() {
        window.removeEventListener('keydown', this.onKeyDown);
    }

    getRandomSymbol() {
        const idx = Math.floor(Math.random() * this.symbols.length);
        return this.symbols[idx];
    }

    startSpin() {
        if (this.currentBet > this.session.bankroll && this.session.bankroll >= 10) {
            this.currentBet = this.session.bankroll;
        }

        if (this.currentBet > this.session.bankroll) return;

        this.state = 'SPINNING';
        this.spinTime = 0;
        this.reelStops = [1.0, 1.5, 2.0];

        this.reels = [
            this.getRandomSymbol(),
            this.getRandomSymbol(),
            this.getRandomSymbol()
        ];

        if (Math.random() < 0.10) {
            const winSym = this.getRandomSymbol();
            this.reels = [winSym, winSym, winSym];
        }

        this.lastWin = 0;
    }

    resolveSpin() {
        let payout = 0;

        if  (this.reels[0] === this.reels[1] && this.reels[1] === this.reels[2]) {
            payout = this.currentBet * this.payouts[this.reels[0]];

            this.sm.shake(500, 15);
            this.sm.spawnConfetti(this.sm.canvas.width / 2, this.sm.canvas.height / 2 - 100, 200);
            this.sm.spawnFloatingText(`+$${payout}!`, this.sm.canvas.width / 2, this.sm.canvas.height / 2 - 150, '#2ecc71');
        }
        this.lastWin = payout;
        this.session.addTransaction(this.gameId, this.currentBet, payout);
        this.state = 'RESULT';
    }

    update(dt) {
        if (this.state === 'SPINNING') {
            this.spinTime += dt / 1000;
            if (this.spinTime >= 2.5) {
                this.resolveSpin();
            }
        }
    }

    drawButton(ctx, x, y, w, h, text, color) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#fff';
        ctx.font = '16px Kenney';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w/2, y + h/2 + 6);
    }

    handleClick(x, y) {
        if (this.sm.isTransitioning) return;
        const W = this.sm.canvas.width;
        const H = this.sm.canvas.height;
        const hit = (bx, by, bw, bh) => x >= bx && x <= bx + bw && y >= by && y <= by + bh;

        if (this.state === 'IDLE' || this.state === 'RESULT') {
            if (hit(W/2 - 120, H - 100, 40, 40)) {
                this.currentBet = Math.max(10, this.currentBet - 10);
            }
            if (hit(W/2 + 80, H - 100, 40, 40)) {
                this.currentBet = Math.min(this.session.bankroll, this.currentBet + 10);
            }
            if (hit(W/2 - 50, H - 50, 100, 40)) {
                if (this.session.bankroll >= this.currentBet) {
                    this.startSpin();
                }
            }
        }
    }

    drawSymbol(ctx, sym, x, y) {
        let img = this.symbolImages[sym];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x - 32, y - 32, 64, 64); 
        } else {
            ctx.font = '24px Kenney';
            ctx.fillText(sym, x, y + 8);
        }
    }

    render(ctx) {
            const W = this.sm.canvas.width;
            const H = this.sm.canvas.height;

            const grad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W);
            grad.addColorStop(0, '#2c3e50');
            grad.addColorStop(1, '#111820');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            const mx = W/2 - 200;
            const my = H/2 - 175;

            const drawX = mx - 100;
            const drawY = my - 100;
            const drawW = 600;
            const drawH = 500;

            if (this.machineBase && this.machineBase.complete && this.machineBase.naturalWidth > 0) {
                ctx.drawImage(this.machineBase, drawX, drawY, drawW, drawH);
            }

            const symbolStartX = mx + 105;
            const symbolSpacing = 100;
            const symbolY = my + 170;

            ctx.textAlign = 'center';

            for (let i = 0; i < 3; i++) {
            const cx = symbolStartX + (i * symbolSpacing);

            ctx.fillStyle = '#000';
            ctx.font = '18px Kenney';

            let displaySym = this.reels[i];

            if (this.state === 'SPINNING') {
                if (this.spinTime < this.reelStops[i]) {
                    displaySym = this.getRandomSymbol();
                    ctx.fillStyle = '#ccc';
                    this.drawSymbol(ctx, this.getRandomSymbol(), cx, symbolY - 40);
                    this.drawSymbol(ctx, this.getRandomSymbol(), cx, symbolY + 60);
                    ctx.fillStyle = '#000';
                }
            }
            this.drawSymbol(ctx, displaySym, cx, symbolY);
        }

        let lever = (this.state === 'SPINNING') ? this.leverDown : this.leverMid;
        if (lever && lever.complete && lever.naturalWidth > 0) {
            ctx.drawImage(lever, drawX, drawY, drawW, drawH);
        }

        const textY = my - 130;

        if (this.state === 'RESULT') {
            if (this.lastWin > 0) {
                ctx.font = '60px Kenney';
                ctx.shadowColor = '#2ecc71';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#2ecc71';
                ctx.fillText(`WINNER! +$${this.lastWin}!`, W/2, textY);
                ctx.shadowColor = 'transparent';
            } else {
                ctx.font = '60px Kenney';
                ctx.fillStyle = '#e74c3c';
                ctx.fillText(`NO WIN`, W/2, textY);
            }
        } else {
            ctx.font = '50px Kenney';
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`MATCH 3 TO WIN`, W/2, textY);
        }

        if (this.state === 'IDLE' || this.state === 'RESULT') {
            this.sm.drawButton(ctx, W/2 - 120, H - 100, 40, 40, '-', '#34495e');
            ctx.fillStyle = '#fff';
            ctx.font = '30px Kenney';
            ctx.fillText(`Bet: ${this.currentBet}`, W/2, H - 72);
            this.sm.drawButton(ctx, W/2 + 80, H - 100, 40, 40, '+', '#34495e');

            const canSpin = this.session.bankroll >= this.currentBet;
            this.sm.drawButton(ctx, W/2 - 50, H - 50, 100, 40, 'SPIN', canSpin ? '#e67e22' : '#7f8c8d');
        }

        this.sm.drawHUD(ctx, this.session);
    }
}