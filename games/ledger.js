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

        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('== SUS STAKES LEDGER ==', w/2, 40);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Press ESC to exit terminal', w/2, 65);

        let pad = 80;
        let cw = w - pad*2;
        let ch = h - pad*2;
        let cy = h - pad;

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(pad, cy, cw, ch);

        let txs = this.session.transactions || [];
        if (txs.length === 0) {
            ctx.fillStyle = '#00ff00';
            ctx.fillText('NO DATA. GO GAMBLE.', w/2, h/2);
            return;
        }

        if(txs.length > 50) txs = txs.slice(-50);

        let curr = this.session.bankroll;
        let hist = [curr];

        for (let i = txs.length - 1; i >= 0; i--) {
            let t = txs[i];
            curr -= (t.payout - t.wager);
            hist.push(curr);
        }
        hist.reverse();

        let maxVal = Math.max(...hist, 1500);
        let minVal = Math.min(...hist, 0);

        ctx.beginPath();
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;

        for (let i = 0; i < hist.length; i++) {
            let px = pad + (i / Math.max(1, hist.length - 1)) * cw;
            let py = cy - ((hist[i] - minVal) / (maxVal - minVal)) * ch;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }

        ctx.stroke();

        let lastVal = hist[hist.length - 1];
        let lastY = cy - ((lastVal - minVal) / (maxVal - minVal)) * ch;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(pad + cw, lastY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillText(`$${lastVal}`, pad + cw + 10, lastY + 5);
    }
}