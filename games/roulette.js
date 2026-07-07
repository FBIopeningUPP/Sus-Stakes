import { LobbyScene } from '../scenes/lobby-scene.js';

export class RouletteGame {
    constructor(sceneManager, session, gameId, returnPosition) {
        this.sm = sceneManager;
        this.session = session;
        this.gameId = gameId;
        this.returnPosition = returnPosition;

        this.wheelNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26];
            
        this.state = 'BETTING';
        this.wheelAngle = 0;
        this.wheelVelocity = 0;

        this.ballAngle = 0;
        this.ballRadius = 0;
        this.ballVelocity = 0;

        this.winningNumber = null;

        this.bets = [];
        this.currentChipValue = 10;
        this.message = 'Place your bets!';

        this.onKeyDown = (e) => {
            if (e.key === 'Escape' && this.state !== 'SPINNING') {
                this.sm.changeScene(new LobbyScene(this.sm, this.session, this.returnPosition));
            } 
        };
    }

    init() { window.addEventListener('keydown', this.onKeyDown); }
    cleanup() { window.removeEventListener('keydown', this.onKeyDown); }

    spin() {
        if (this.bets.length === 0) {
            this.message = "Place a bet first!";
            return;
            }
        this.state = 'SPINNING';
        this.message = "No more bets!";

        this.wheelVelocity = 0.05 + Math.random() * 0.02;
        this.ballVelocity = -(0.1 + Math.random() * 0.05);
        this.ballRadius = 220; 

        this.sm.audio.playCoin();
    }

    update(dt) {
        if (this.state === 'SPINNING') {
            this.wheelVelocity *= 0.995;
            this.ballVelocity *= 0.99;

            this.wheelAngle += this.wheelVelocity;
            this.ballAngle += this.ballVelocity;

            if (Math.abs(this.ballVelocity) < 0.05) {
                this.ballRadius -= 1.0;
                if (Math.random() < 0.2) this.sm.audio.playTick();
            }

            if (this.ballRadius <= 150) {
                this.ballRadius = 150;
                this.ballVelocity = this.wheelVelocity; 

                if (this.wheelVelocity < 0.001) {
                    this.resolveSpin();
                }
            }
        }
    }

    resolveSpin() {
        this.wheelVelocity = 0;
        this.state = 'RESULT';

        let normalizedBall = this.ballAngle % (Math.PI * 2);
        if (normalizedBall < 0) normalizedBall += Math.PI * 2;

        let normalizedWheel = this.wheelAngle % (Math.PI * 2);
        if (normalizedWheel < 0) normalizedWheel += Math.PI * 2;

        let relativeAngle = (normalizedBall - normalizedWheel + Math.PI * 2) % (Math.PI * 2);

        let segment = (Math.PI * 2) / 37;

        let index = Math.floor(relativeAngle / segment);
        index = (index + 37) % 37;

        this.winningNumber = this.wheelNumbers[index];
        this.message = `Ball landed in pocket ${this.winningNumber}!`;

        this.calculatePayouts(); // We will write this in Part 2!
    }

    isRed(num) {
        const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        return reds.includes(num);
    }
    
    calculatePayouts() {
        let totalWin = 0;
        let wonBets = [];

        for (let bet of this.bets) {
            let win = false;
            let payoutMult = 0;
            
            if (bet.type === 'RED' && this.winningNumber !== 0 && this.isRed(this.winningNumber)) { win = true; payoutMult = 2; }
            if (bet.type === 'BLACK' && this.winningNumber !== 0 && !this.isRed(this.winningNumber)) { win = true; payoutMult = 2; }
            if (bet.type === 'EVEN' && this.winningNumber !== 0 && this.winningNumber % 2 === 0) { win = true; payoutMult = 2; }
            if (bet.type === 'ODD' && this.winningNumber !== 0 && this.winningNumber % 2 === 1) { win = true; payoutMult = 2; }
            if (bet.type === '1-18' && this.winningNumber >= 1 && this.winningNumber <= 18) { win = true; payoutMult = 2; }
            if (bet.type === '19-36' && this.winningNumber >= 19 && this.winningNumber <= 36) { win = true; payoutMult = 2; }
            if (bet.type === 'ZERO' && this.winningNumber === 0) { win = true; payoutMult = 36; }
            
            if (win) {
                let amountWon = bet.amount * payoutMult;
                totalWin += amountWon;
                wonBets.push(bet.type);
            }
        }

        if (totalWin > 0) {
            this.session.bankroll += totalWin;
            this.sm.shake(500, 15);
            this.sm.spawnConfetti(this.sm.canvas.width / 2, this.sm.canvas.height / 2, 100);
            this.sm.spawnFloatingText(`+$${totalWin}!`, this.sm.canvas.width/2, this.sm.canvas.height/2, '#2ecc71');
            this.message = `WON $${totalWin} ON: ${wonBets.join(', ')}!`;
            this.sm.audio.playWin();
        } else {
            this.message = `Ball landed on ${this.winningNumber}. You lose.`;
            this.sm.audio.playLose();
        }

        this.session.addTransaction(this.gameId, 0, totalWin);
    }

    handleClick(x, y) {
        if (this.state === 'RESULT') {
            this.state = 'BETTING';
            this.bets = [];
            this.message = 'Place your bets!';
            return;
        }

        if (this.state !== 'BETTING') return;

        const W = this.sm.canvas.width;
        const H = this.sm.canvas.height;
        const btnY = H - 100;

        const buttons = [
            { type: 'RED', x: 100, y: btnY, w: 100, h: 40 },
            { type: 'BLACK', x: 220, y: btnY, w: 100, h: 40 },
            { type: 'EVEN', x: 340, y: btnY, w: 100, h: 40 },
            { type: 'ODD', x: 460, y: btnY, w: 100, h: 40 },
            { type: '1-18', x: 580, y: btnY, w: 100, h: 40 },
            { type: '19-36', x: 700, y: btnY, w: 100, h: 40 },
            { type: 'ZERO', x: 820, y: btnY, w: 100, h: 40 }
        ];

        for (let b of buttons) {
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                if (this.session.bankroll >= this.currentChipValue) {
                    this.session.bankroll -= this.currentChipValue;
                    this.bets.push({ type: b.type, amount: this.currentChipValue });
                    this.sm.audio.playTick();
                }
            }
        }

        if (x >= W - 150 && x <= W - 50 && y >= H - 100 && y <= H - 60) {
            this.spin();
        }
    }

    render(ctx) {
        const W = this.sm.canvas.width;
        const H = this.sm.canvas.height;
        const centerX = W / 2;
        const centerY = H / 2 - 50;

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.wheelAngle);

        const slices = this.wheelNumbers.length;
        const arc = (Math.PI * 2) / slices;

        for (let i = 0; i < slices; i++) {
            let num = this.wheelNumbers[i];

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 200, i * arc, (i + 1) * arc);
            ctx.lineTo(0, 0);

            if (num === 0) ctx.fillStyle = '#2ecc71';
            else if (this.isRed(num)) ctx.fillStyle = '#e74c3c';
            else ctx.fillStyle = '#2c3e50';

            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.rotate(i * arc + arc / 2);
            ctx.translate(170, 0);
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Kenney';
            ctx.textAlign = 'center';
            ctx.fillText(num, 0, 0);
            ctx.restore();
        }

        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (this.state !== 'BETTING') {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(this.ballAngle);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.ballRadius, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = '#fff';
        ctx.font = '30px Kenney';
        ctx.textAlign = 'center';
        ctx.fillText(this.message, W / 2, 80);

        let totalBetAmount = this.bets.reduce((sum, bet) => sum + bet.amount, 0);
        ctx.fillText(`Total Bets: $${totalBetAmount}`, W/2, 120);

        const btnY = H - 100;
        this.sm.drawButton(ctx, 100, btnY, 100, 40, 'RED', '#e74c3c');
        this.sm.drawButton(ctx, 220, btnY, 100, 40, 'BLACK', '#2c3e50');
        this.sm.drawButton(ctx, 340, btnY, 100, 40, 'EVEN', '#8e44ad');
        this.sm.drawButton(ctx, 460, btnY, 100, 40, 'ODD', '#8e44ad');
        this.sm.drawButton(ctx, 580, btnY, 100, 40, '1-18', '#3498db');
        this.sm.drawButton(ctx, 700, btnY, 100, 40, '19-36', '#3498db');
        this.sm.drawButton(ctx, 820, btnY, 100, 40, 'ZERO!', '#2ecc71');

        if (this.state === 'BETTING') {
            this.sm.drawButton(ctx, W - 150, H - 100, 100, 40, 'SPIN', '#f1c40f');
        } else if (this.state === 'RESULT') {
            this.sm.drawButton(ctx, W - 150, btnY, 100, 40, 'AGAIN', '#e67e22');
        }
        this.sm.drawHUD(ctx, this.session);
    }
}