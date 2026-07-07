import { LobbyScene } from '../scenes/lobby-scene.js';

export class LedgerTerminal {
    constructor(sm, session, gameId, returnPos){
        this.sm = sm;
        this.session = session;
        this.returnPos = returnPos;

        this.onKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.sm.changeScene(new LobbyScene(this.sm, this.session, this.returnPos));
            }
        };   
    }

    init() { window.addEventListener('keydown', this.onKeyDown); }
    cleanup() { window.removeEventListener('keydown', this.onKeyDown);}
    update(dt) {}
    handleClick(x, y) {}

    render(ctx) {
        let w = this.sm.canvas.width;
        let h = this.sm.canvas.height;

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        ctx.font = 'bold 24px Kenney';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.fillText('SUS STAKES PORTFOLIO', 40, 40);
        ctx.font = '14px Kenney';
        ctx.fillStyle = '#666';
        ctx.fillText('Press ESC to exit', 40, 60);

        let pad = 60;
        let cw = w - pad * 2;
        let ch = h - pad * 2;
        let cy = h - pad;

        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<=4; i++) {
            let y = pad + (i/4)*ch;
            ctx.moveTo(pad, y);
            ctx.lineTo(pad + cw, y);
        }

        ctx.stroke();

        let txs = this.session.transactions || [];
        if (txs.length === 0) {
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('AWAITING TRADES...', w/2, h/2);
            return;
        }

        if(txs.length > 50) txs = txs.slice(-50);

        let curr = this.session.bankroll;
        let hist = [curr];
        for (let i = txs.length - 1; i >= 0; i--) {
            curr -= (txs[i].payout - txs[i].wager);
            hist.push(curr);
        }
        hist.reverse();

        let maxVal = Math.max(...hist, 1500);
        let minVal = Math.min(...hist, 0);

        let isUp = hist[hist.length - 1] >= hist[0];
        let themeColor = isUp ? '#00ff55' : '#ff2255';

        ctx.beginPath();
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 3;

        let pts = [];

        for (let i = 0; i < hist.length; i++) {
            let px = pad + (i / Math.max(1, hist.length - 1)) * cw;
            let py = cy - ((hist[i] - minVal) / (maxVal - minVal)) * ch;
            pts.push({x: px, y: py});

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }

        ctx.stroke();

        let grad = ctx.createLinearGradient(0, pad, 0, cy);
        grad.addColorStop(0, isUp ? 'rgba(0, 255, 85, 0.4)' : 'rgba(255, 34, 85, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.lineTo(pts[pts.length - 1].x, cy);
        ctx.lineTo(pts[0].x, cy);
        ctx.fillStyle = grad;
        ctx.fill();

        let lastPt = pts[pts.length - 1];
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = themeColor;
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Kenney';
        ctx.textAlign = 'right';
        ctx.fillText(`$${hist[hist.length-1]}`, w - 40, 50);

        let diff = hist[hist.length-1] - hist[0];
        ctx.font = '18px Kenney';
        ctx.fillStyle = themeColor;
        let sign = diff >= 0 ? '+' : '';
        ctx.fillText(`${sign}$${diff}`, w - 40, 80);
    }
}