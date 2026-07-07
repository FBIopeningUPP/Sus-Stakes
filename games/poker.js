import { LobbyScene } from '../scenes/lobby-scene.js';

export class PokerGame {
    constructor(sceneManager, session, gameId, returnPosition) {
        this.sm = sceneManager;
        this.session = session;
        this.gameId = gameId;
        this.returnPosition = returnPosition;

        this.cardImages = {};

        this.deck = [];
        this.communityCards = [];
        this.state = 'IDLE';

        this.loadCards();

        this.onKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.sm.changeScene(new LobbyScene(this.sm, this.session, this.returnPosition));
            }
        };
    }

    init() {
        window.addEventListener('keydown', this.onKeyDown);
        this.sm.spawnFloatingText("TEXAS HOLD'EM", this.sm.canvas.width/2, 100, '#f1c40f');
    }

    cleanup() {
        window.removeEventListener('keydown', this.onKeyDown);
    }

    loadCards() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['02', '03', '04', '05', '06', '07', '08', '09', '10', 'J', 'Q', 'K', 'A'];
        for (let s of suits) {
            for (let r of ranks) {
                let img = new Image();
                img.src = `assets/cards/card_${s}_${r}.png`;
                this.cardImages[`${s}_${r}`] = img;
            }
        }

        this.cardBack = new Image();
        this.cardBack.src = 'assets/cards/card_back.png';
    }

    // DACK
    createDeck() {
        this.deck = [];
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        for (let s of suits) {
            for (let i = 0; i  < ranks.length; i++) {
                this.deck.push({
                    suit: s,
                    rankStr: ranks[i],
                    value: i + 2
                })
            }
        }

        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        return this.deck.pop();
    }

    evaluateHand(holeCards) {
        if (this.communityCards.length === 0) return { score: 0, name: "High Card" };

        let all = [...holeCards, ...this.communityCards];
        all.sort((a,b) => b.value - a.value);

        let suits = {};
        let ranks = {};
        all.forEach(c => {
            suits[c.suit] = (suits[c.suit] || 0) + 1;
            ranks[c.value] = (ranks[c.value] || 0) + 1;
        });

        let flushSuit = Object.keys(suits).find(s => suits[s] >= 5);
        let flushCards = flushSuit ? all.filter(c => c.suit === flushSuit) : null;

        const getStraight = (cardArray) => {
            let unique = [...new Set(cardArray.map(c => c.value))];
            if (unique.includes(14)) unique.push(1);
            let streak = 1;
            for(let i = 0; i < unique.length - 1; i++) {
                if (unique[i] - 1 === unique[i+1]) {
                    streak++;
                    if (streak >= 5) return unique[i+1 - 5 + 1] + 4; 
                } else if (unique[i] !== unique[i+1]) {
                    streak = 1;
                }
            }
            return null;
        }

        let straightFlush = flushCards ? getStraight(flushCards) : null;
        if (straightFlush) return { score: 800 + straightFlush, name: "Straight Flush" };

        let counts = Object.entries(ranks).map(([r, c]) => ({ value: parseInt(r), count }));
        counts.sort((a,b) => b.count - a.count || b.value - a.value);

        if (counts[0].count === 4) return { score: 700 + counts[0].value, name: "Four of a Kind" };
        if (counts[0].count === 3 && counts[1] && counts[1].count >= 2) return { score: 600 + counts[0].value, name: "Full House" };
        if (flushCards) return { score: 500 + flushCards[0].value, name: "Flush" };

        let straight = getStraight(all);
        if (straight) return { score: 400 + straight, name: "Straight" };

        if (counts[0].count === 3) return { score: 300 + counts[0].value, name: "Three of a Kind" };
        if (counts[0].count === 2 && counts[1] && counts[1].count === 2) return { score: 200 + Math.max(counts[0].value, counts[1].value), name: "Two Pair" };
        if (counts[0].count === 2) return { score: 100 + counts[0].value, name: "One Pair" };

        return { score: 0, name: "High Card" };
    }

    startGame() {
        if (this.session.bankroll < 50) return;
            this.session.bankroll -= 50;
            this.pot = 100;

            this.createDeck();
            this.playerHand = [this.drawCard(), this.drawCard()];
            this.botHand = [this.drawCard(), this.drawCard()];
            this.communityCards = [];

            this.state = 'PREFLOP';
            this.message = "Your move. Bet $50 or fold.";

            this.sm.audio.playCoin();
            setTimeout(() => this.sm.audio.playTick(), 200);
    }

    nextPhase() {
        if (this.session.bankroll < 50) return;

        this.session.bankroll -= 50;
        this.pot += 50;
        this.sm.audio.playCoin();

        let botEval = this.evaluateHand(this.botHand);
        let foldChance = 0;

        if (this.state === 'PREFLOP') foldChance = 0.05;
        else if (this.state === 'FLOP') foldChance = botEval.score < 100 ? 0.4 : 0;
        else if (this.state === 'TURN' || this.state === 'RIVER') foldChance = botEval.score < 100 ? 0.6 : 0;

        if (Math.random() < foldChance) {
            this.state = 'SHOWDOWN';
            this.message = "Bot folds. You win the pot!";
            this.session.bankroll += this.pot;
            this.sm.spawnFloatingText(`+$${this.pot}!`, this.sm.canvas.width/2, this.sm.canvas.height/2, '#2ecc71');
            return;
        }

        this.pot += 50;
        setTimeout(() => this.sm.audio.playTick(), 300);

        if (this.state === 'PREFLOP') {
            this.communityCards.push(this.drawCard(), this.drawCard(), this.drawCard());
            this.state = 'FLOP';
        } else if (this.state === 'FLOP') {
            this.communityCards.push(this.drawCard());
            this.state = 'TURN';
        } else if (this.state === 'TURN') {
            this.communityCards.push(this.drawCard());
            this.state = 'RIVER';
        } else if (this.state === 'RIVER') {
            this.resolveShowdown();
        }
    }

    resolveShowdown() {
        this.state = 'SHOWDOWN';
        let pEval = this.evaluateHand(this.playerHand);
        let bEval = this.evaluateHand(this.botHand);

        if (pEval.score > bEval.score) {
            this.message = `You win with ${pEval.name}!`;
            this.session.bankroll += this.pot;
            this.sm.shake(500, 10);
            this.sm.spawnConfetti(this.sm.canvas.width/2, this.sm.canvas.height/2, 100);
            this.sm.spawnFloatingText(`+$${this.pot}!`, this.sm.canvas.width/2, this.sm.canvas.height/2, '#2ecc71');
            this.sm.audio.playWin();
        } else if (bEval.score > pEval.score) {
            this.message = `Bot WINS with ${bEval.name}...`;
            this.sm.shake(300, 5);
            this.sm.audio.playLose();
        } else {
            this.message = `CHOP! It's a TIE (${pEval.name})`;
            this.session.bankroll += this.pot / 2;
            this.sm.audio.playCoin();
        }
    }

    fold() {
        this.state = 'SHOWDOWN';
        this.message = "You fold. Bot wins the pot.";
        this.sm.audio.playLose();
    }

    update(dt) {}

    drawCardGraphic(ctx, card, x, y) {
        if (!card) return;
        let img = this.cardImages[`${card.suit}_${card.rankStr}`];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x, y, 80, 120);
        }
    }

    drawButton(ctx, x, y, w, h, text, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Kenney';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w/2, y + h/2 + 6);
    }

    handleClick(x, y) {
        if (this.sm.isTransitioning) return;
        const W = this.sm.canvas.width;
        const H = this.sm.canvas.height;
        const hit = (bx, by, bw, bh) => x >= bx && x <= bx + bw && y >= by && y <= by + bh;

        if (this.state === 'IDLE' || this.state === 'SHOWDOWN') {
             if (hit(W/2 - 50, H - 100, 100, 40)) this.startGame();
        } else {
            if (hit(W/2 + 20, H - 100, 100, 40)) this.nextPhase();
            if (hit(W/2 - 120, H - 100, 100, 40)) this.fold();
        }
    }

    render(ctx) {
            const W = this.sm.canvas.width;
            const H = this.sm.canvas.height;

            ctx.fillStyle = '#27ae60';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(W/2, H/2 + 50,W/2 - 100,H/2 - 100, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw Pot beautifully in the center of the table
            ctx.fillStyle = '#f1c40f';
            ctx.font = '24px Kenney';
            ctx.textAlign = 'center';
            ctx.fillText(`Pot: $${this.pot}`, W/2, H/2 - 100);

            ctx.font = '24px Kenney';
            ctx.fillStyle = '#fff';
            ctx.fillText(this.message || "Welcome to Texas Hold'em!", W/2, 100);

            if (this.state === 'IDLE') {
                this.sm.drawButton(ctx, W/2 - 50, H - 100, 100, 40, 'DEAL $50', '#e67e22');
            } else {
                for (let i = 0; i < this.communityCards.length; i++) {
                    this.drawCardGraphic(ctx, this.communityCards[i], W/2 - 190 + (i * 80), H/2 - 48);
                }

                this.drawCardGraphic(ctx, this.playerHand[0], W/2 -80, H - 220);
                this.drawCardGraphic(ctx, this.playerHand[1], W/2 + 10, H - 220);

                if (this.state === 'SHOWDOWN' && !this.message.includes('FOLDS')) {
                    this.drawCardGraphic(ctx, this.botHand[0], W/2 -80, 120);
                    this.drawCardGraphic(ctx, this.botHand[1], W/2 + 10, 120);
                } else {
                    if (this.cardBack && this.cardBack.complete) {
                        ctx.drawImage(this.cardBack, W/2 - 80, 120, 71, 96);
                        ctx.drawImage(this.cardBack, W/2 + 10, 120, 71, 96);
                    }
                }

                if (this.state === 'SHOWDOWN'){
                    this.sm.drawButton(ctx, W/2 - 50, H - 100, 100, 40, 'AGAIN', '#e67e22');
                } else {
                    this.sm.drawButton(ctx, W/2 - 120, H - 100, 100, 40, 'FOLD', '#e74c3c');
                    this.sm.drawButton(ctx, W/2 + 20, H - 100, 100, 40, 'BET $50', '#3498db')
                }
            }

            // --- GLOBAL HUD ON TOP ---
            this.sm.drawHUD(ctx, this.session);
        }
}