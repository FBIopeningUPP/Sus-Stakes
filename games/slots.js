import { LobbyScene } from '../scenes/lobby-scene.js';

export class SlotsGame {
    constructor(sceneManager, session, gameId, returnPosition) {
        this.sm = sceneManager;
        this.session = session;
        this.gameId = gameId;
        this.returnPosition = returnPosition;

        this.symbols = ['CHERRY', 'LEMON', 'ORANGE', 'PLUM', 'BELL', 'BAR', 'SEVEN'];
        this.payouts = {
            'CHERRY': 2,
            'LEMON': 3,
            'ORANGE': 5,
            'GRAPE': 10,
            'BELL': 20,
            'DIAMOND': 50,
            'SEVEN': 100
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
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
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
            if (hit(W/2 - 60, H - 100, 40, 40)) {
                this.currentBet = Math.min(this.session.bankroll, this.currentBet + 10);
            }
            if (hit(W/2 + 20, H - 100, 80, 40)) {
                if (this.session.bankroll >= this.currentBet) {
                    this.startSpin();
                }
            }
        }
    }

    render(ctx) {
        const W = this.sm.canvas.width;
        const H = this.sm.canvas.height;

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Bankroll: $${this.session.bankroll}`, 20, 30);

        const mx = W/2 - 200;
        const my = H/2 - 175;

        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(mx - 10, my - 10, 420, 270);
        ctx.fillStyle = '#000';
        ctx.fillRect(mx, my, 400, 250);

        const rWidth = 100;
        const rHeight = 150;
        const ry = my + 50;

        ctx.textAlign = 'center';
        
        for (let i = 0; i < 3; i++) {
            const cx = mx + 30 + (i * 120);

            ctx.fillStyle = '#fff';
            ctx.fillRect(cx, ry, rWidth, rHeight);

            ctx.fillStyle = '#000';
            ctx.font = '18px monospace';

            let displaySym = this.reels[i];

            if (this.state === 'SPINNING') {
                if (this.spinTime < this.reelStops[i]) {
                    displaySym = this.getRandomSymbol();

                    ctx.fillStyle = '#ccc';
                    ctx.fillText(this.getRandomSymbol(), cx + rWidth/2, ry + 30);
                    ctx.fillText(this.getRandomSymbol(), cx + rWidth/2, ry + 130);
                    ctx.fillStyle = '#000';
                }
            }

            ctx.fillText(displaySym, cx + rWidth/2, ry + rHeight/2 + 6);
        }

        ctx.fillStyle = '#fff';
        ctx.font = '24px monospace';
        if (this.state === 'RESULT') {
            if (this.lastWin > 0) {
                ctx.fillStyle = '#2ecc71';
                ctx.fillText(`WINNER! +$${this.lastWin}!`, W/2, my - 30);
            } else {
                ctx.fillStyle = '#e74c3c';
                ctx.fillText(`NO WIN`, W/2, my - 30);
            }
        } else {
            ctx.fillText(`MATCH 3 TO WIN!`, W/2, my - 30);
        }

        if (this.state === 'IDLE' || this.state === 'RESULT') {
            this.drawButton(ctx, W/2 - 120, H - 100, 40, 40, '-', '#34495e');
            ctx.fillStyle = '#fff';
            ctx.font = '30px monospace';
            ctx.fillText(`Bet: ${this.currentBet}`, W/2, H - 72);
            this.drawButton(ctx, W/2 + 80, H - 100, 40, 40, '+', '#34495e');

            const canSpin = this.session.bankroll >= this.currentBet;
            this.drawButton(ctx, W/2 - 50, H - 50, 100, 40, 'SPIN', canSpin ? '#e67e22' : '#7f8c8d');
        }
    }
}