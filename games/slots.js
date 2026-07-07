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

        this.layerReels = new Image();
        this.layerReels.src = 'assets/slots/slot-machine5.png';
        this.layerReels = new Image();
        this.layerReels.src = 'assets/slots/slot-machine4.png';
        this.layerReels = new Image();
        this.layerReels.src = 'assets/slots/slot-machine2.png';
        this.layerReels = new Image();
        this.layerReels.src = 'assets/slots/slot-machine3.png';
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

    render(ctx) {
        const W = this.sm.canvas.width;
        const H = this.sm.canvas.height;

        const grad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W);
        grad.addColorStop(0, '#2c3e50');
        grad.addColorStop(1, '#111820');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Kenney';
        ctx.textAlign = 'left';
        ctx.fillText(`Bankroll: $${this.session.bankroll}`, 20, 30);

        const mx = W/2 - 200;
        const my = H/2 - 175;

        const drawX = mx - 100;
        const drawY = my - 150;
        const drawW = 600;
        const drawH = 500;

        if (this.layerReels.complete && this.layerReels.naturalWidth > 0) {
            ctx.drawImage(this.layerReels, drawX, drawY, drawW, drawH);
        }

        const rWidth = 100;
        const rHeight = 150;
        const ry = my + 50;

        ctx.textAlign = 'center';
        
        for (let i = 0; i < 3; i++) {
            const cx = mx + 30 + (i * 120);

            ctx.fillStyle = '#fff';
            ctx.fillRect(cx, ry, rWidth, rHeight);

            ctx.fillStyle = '#000';
            ctx.font = '18px Kenney';

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

            if (this.layerCover.complete && this.layerCover.naturalWidth > 0) {
                ctx.drawImage(this.layerCover, drawX, drawY, drawW, drawH);
            }

            let lever = (this.state === 'SPINNING') ? this.leverDown : this.leverUp;
            if (lever.complete && lever.naturalWidth > 0) {
                ctx.drawImage(lever, drawX, drawY, drawW, drawH);
            }
        }

        ctx.fillStyle = '#fff';
        ctx.font = '24px Kenney';
        if (this.state === 'RESULT') {
            if (this.lastWin > 0) {
                ctx.shadowColor = '#2ecc71';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#2ecc71';
                ctx.fillText(`WINNER! +$${this.lastWin}!`, W/2, my - 30);
                ctx.shadowColor = 'transparent'; 
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
            ctx.font = '30px Kenney';
            ctx.fillText(`Bet: ${this.currentBet}`, W/2, H - 72);
            this.drawButton(ctx, W/2 + 80, H - 100, 40, 40, '+', '#34495e');

            const canSpin = this.session.bankroll >= this.currentBet;
            this.drawButton(ctx, W/2 - 50, H - 50, 100, 40, 'SPIN', canSpin ? '#e67e22' : '#7f8c8d');
        }
    }
}