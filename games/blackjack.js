import { LobbyScene } from '../scenes/lobby-scene.js';

export class BlackjackGame {
    constructor(sceneManager, session, gameId, returnPosition) {
        this.sm = sceneManager;
        this.session = session;
        this.gameId = gameId; 
        this.returnPosition = returnPosition;
        
        this.cardCache = {};
        this.cardBack = new Image();
        this.cardBack.src = 'assets/cards/card_back.png';
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['02', '03', '04', '05', '06', '07', '08', '09', '10', 'J', 'Q', 'K', 'A'];

        for (let s of suits) {
            for (let r of ranks) {
                let img = new Image();
                img.src = `assets/cards/card_${s}_${r}.png`;
                this.cardCache[`${s}_${r}`] = img;
            }
        }

        this.shoe = [];
        this.runningCount = 0;
        this.cardsDealt = 0;
        this.buildShoe();

        this.state = 'BETTING';
        this.currentBet = Math.max(10, Math.min(10, this.session.bankroll));
        if (this.currentBet === 0) this.currentBet = 10; // Let testing continue even if broke

        this.playerHands = [];
        this.dealerHand = { cards: [], holeRevealed: false };
        this.activeHandIndex = 0;

        this.trainerMode = false;
        this.trainerInput = '';

        this.onKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.sm.changeScene(new LobbyScene(this.sm, this.session, this.returnPosition));
                return;
            }

            if (e.key.toLowerCase() === 'c' && this.state !== 'TRAINER_PROMPT') {
                this.trainerMode = !this.trainerMode;
                return;
            }

            if (this.state === 'BETTING') {
                if (e.key >= '1' && e.key <= '9') {
                    const amt = parseInt(e.key) * 10;
                    this.currentBet = Math.min(amt, this.session.bankroll);
                }
            } else if (this.state === 'TRAINER_PROMPT') {
                if (e.key >= '0' && e.key <= '9') {
                    this.trainerInput += e.key;
                } else if (e.key === '-') {
                    if (this.trainerInput === '') this.trainerInput = '-';
                } else if (e.key === 'Backspace') {
                    this.trainerInput = this.trainerInput.slice(0, -1);
                } else if (e.key === 'Enter') {
                    this.resolvePayouts();
                }
            }
        };
    }

    init() {
        window.addEventListener('keydown', this.onKeyDown);
    }

    cleanup() {
        window.removeEventListener('keydown', this.onKeyDown);
    }

    buildShoe() {
        this.shoe = [];
        const suits = ['H', 'D', 'C', 'S'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        for (let i = 0; i < 6; i++) {
            for (let s of suits) {
                for (let r of ranks) {
                    this.shoe.push({ rank: r, suit: s });
                }
            }
        }

        for (let i = this.shoe.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shoe[i], this.shoe[j]] = [this.shoe[j], this.shoe[i]];
        }

        this.runningCount = 0;
        this.cardsDealt = 0;
    }

    updateCount(card) {
        if (['2', '3', '4', '5', '6'].includes(card.rank)) this.runningCount++;
        else if (['10', 'J', 'Q', 'K', 'A'].includes(card.rank)) this.runningCount--;
    }

    drawCard(faceDown = false) {
        if (this.shoe.length < 312 * 0.25) {
            this.buildShoe();
        }
        const card = this.shoe.pop();
        this.cardsDealt++;
        if (!faceDown) {
            this.updateCount(card);
        }
        return card;
    }

    getHandTotal(cards) {
        let total = 0;
        let aces = 0;

        for (let c of cards) {
            if (c.rank === 'A') {
                aces++;
                total += 11;
            } else if (['K', 'Q', 'J'].includes(c.rank)) {
                total += 10;
            } else {
                total += parseInt(c.rank);
            }
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return {total, isSoft: aces > 0};
    }

    startHand() {
        if (this.currentBet > this.session.bankroll && this.session.bankroll >= 10) {
            this.currentBet = this.session.bankroll;
        }   

        this.playerHands = [{
            cards: [],
            bet: this.currentBet,
            isStand: false,
            isBusted: false,
            isDouble: false,
            isSplit: false
        }];
        this.dealerHand = { cards: [], holeRevealed: false };
        this.activeHandIndex = 0;
        this.state = 'DEALING';

        this.playerHands[0].cards.push(this.drawCard());
        this.dealerHand.cards.push(this.drawCard());
        this.playerHands[0].cards.push(this.drawCard());
        this.dealerHand.cards.push(this.drawCard(true));

        const pTot = this.getHandTotal(this.playerHands[0].cards).total;
        const dTot = this.getHandTotal(this.dealerHand.cards).total;

        const pIsBJ = (pTot === 21);
        const dIsBJ = (dTot === 21);
        
        if (pIsBJ || dIsBJ) {
            if (dIsBJ) {
                this.updateCount(this.dealerHand.cards[1]);
                this.dealerHand.holeRevealed = true;
            }
            this.dealerTurnFinished();
        } else {
            this.state = 'PLAYER_TURN';
        }
    }

    advancePlayerHand() {
        this.activeHandIndex++;
        if (this.activeHandIndex >= this.playerHands.length) {
            this.state = 'DEALER_TURN';
        }
    }

    update(dt) {
        if (this.state === 'DEALER_TURN') {
            if (!this.dealerHand.holeRevealed) {
                this.updateCount(this.dealerHand.cards[1]);
                this.dealerHand.holeRevealed = true;
            }

            const anyNonBusted = this.playerHands.some(h => !h.isBusted);

            if (anyNonBusted) {
                let dTot = this.getHandTotal(this.dealerHand.cards);

                while (dTot.total < 17 || (dTot.total === 17 && dTot.isSoft)) {
                    this.dealerHand.cards.push(this.drawCard());
                    dTot = this.getHandTotal(this.dealerHand.cards);
                }
            }

            this.dealerTurnFinished();
        }
    }

    dealerTurnFinished() {
        if (this.trainerMode) {
            this.state = 'TRAINER_PROMPT';
            this.trainerInput = '';
        } else {
            this.resolvePayouts();
        }
    }

    resolvePayouts() {
        for (let hand of this.playerHands) {
            const pTotal = this.getHandTotal(hand.cards).total;
            const dTotal = this.getHandTotal(this.dealerHand.cards).total;

            const pIsBJ = hand.cards.length === 2 && pTotal === 21 && !hand.isSplit;
            const dIsBJ = (this.dealerHand.cards.length === 2 && dTotal === 21);

            let payout = 0;
            let result = '';

            if (pIsBJ) {
                if (dIsBJ) {
                    payout = hand.bet;
                    result = 'Push (Both BJ)';
                } else {
                    payout = hand.bet * 2.5;
                    result = 'Blackjack! (3:2)';
                }
            } else if (hand.isBusted) {
                payout = 0;
                result = 'Bust';
            } else if (dIsBJ) {
                payout = 0;
                result = 'Dealer BJ';
            } else if (dTotal > 21) {
                payout = hand.bet * 2;
                result = 'Win';
            } else if (pTotal > dTotal) {
                payout = hand.bet * 2;
                result = 'Win';
            } else if (pTotal < dTotal) {
                payout = 0;
                result = 'Lose';
            } else {
                payout = hand.bet;
                result = 'Push';
            }

            hand.result = result;
            hand.payout = payout;

            this.session.addTransaction(this.gameId, hand.bet, payout);
        }
        this.state = 'PAYOUT';
    }

    handleClick(x, y) {
        if (this.sm.isTransitioning) return;
        const W = this.sm.canvas.width;
        const H = this.sm.canvas.height;
        const hit = (bx, by, bw, bh) => x >= bx && x <= bx + bw && y >= by && y <= by + bh;

        if (this.state === 'BETTING') {
            if (hit(W/2 - 120, H - 100, 40, 40)) {
                this.currentBet = Math.max(10, this.currentBet - 10);
            }
            if (hit(W/2 + 80, H - 100, 40, 40)) {
                this.currentBet = Math.min(this.session.bankroll, this.currentBet + 10);
            }
            if (hit(W/2 - 50, H - 50, 100, 40)) {
                this.startHand();
            }
        } else if (this.state === 'PLAYER_TURN') {
            const hand = this.playerHands[this.activeHandIndex];
            const canSplit = hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank && this.playerHands.length < 4;
            const canDouble = hand.cards.length === 2;

            const pending = this.playerHands.reduce((s, h) => s + h.bet, 0);
            const hasMoney = this.session.bankroll - pending >= hand.bet;

            if (hit(W/2 - 190, H - 100, 80, 40)) { //hit
                hand.cards.push(this.drawCard());
                if (this.getHandTotal(hand.cards).total > 21) {
                    hand.isBusted = true;
                    this.advancePlayerHand();
                }
            }
            else if (hit(W/2 - 90, H - 100, 80, 40)) { //stand
                hand.isStand = true;
                this.advancePlayerHand();
            }
            else if (canDouble && hasMoney && hit(W/2 + 10, H - 100, 90, 40)) { //double
                hand.bet *= 2;
                hand.isDouble = true;
                hand.cards.push(this.drawCard());
                if (this.getHandTotal(hand.cards).total > 21)  hand.isBusted = true;
                hand.isStand = true;
                this.advancePlayerHand(); 
            }
            else if (canSplit && hasMoney && hit(W/2 + 110, H - 100, 80, 40)) { //split
                const splitCard = hand.cards.pop();
                const newHand = { cards: [splitCard], bet: hand.bet, isStand: false, isBusted: false, isDouble: false, isSplit: true };
                hand.isSplit = true;
                this.playerHands.splice(this.activeHandIndex + 1, 0, newHand);

                hand.cards.push(this.drawCard());
                newHand.cards.push(this.drawCard());
            }
        } else if (this.state === 'PAYOUT' || this.state === 'TRAINER_RESULT') {
            if (hit(W/2 - 75, H - 100, 150, 40)) {
                this.playerHands = [];
                this.dealerHand = { cards: [], holeRevealed: false };
                this.state = 'BETTING';
                if (this.currentBet > this.session.bankroll) {
                    this.currentBet = Math.max(10, this.session.bankroll);
                }
            }
        }
    }

    drawButton(ctx, x, y, w, h, text, color) {
        ctx.fillStyle = color;
        if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill();
        } else {
            ctx.fillRect(x, y, w, h);
        }
        ctx.fillStyle = '#fff';
        ctx.font = '16px Kenney';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w/2, y + h/2 + 6);
    }

    drawCardGraphic(ctx, card, x, y, faceDown = false) {
        if (faceDown) {
            if (this.cardBack && this.cardBack.complete && this.cardBack.naturalWidth > 0) {
                ctx.drawImage(this.cardBack, x, y, 64, 90);
            }
        } else if (card) {
            let suitMap = { 'H': 'hearts', 'D': 'diamonds', 'C': 'clubs', 'S': 'spades' };

            let r = card.rank.toString();
            if (r !== '10' && r !== 'J' && r !== 'Q' && r !== 'K' && r !== 'A') r = '0' + r;

            let imgKey = `${suitMap[card.suit]}_${r}`;
            let img = this.cardCache[imgKey];

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, x, y, 64, 90);
            }
        }
    }

    
    render(ctx) {
        const W = this.sm.canvas.width;
        const H = this.sm.canvas.height;

        ctx.fillStyle = '#27ae60';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#fff';
        ctx.font = '20px Kenney';
        ctx.textAlign = 'left';
        ctx.fillText(`Bankroll: $${this.session.bankroll}`, 20, 30);

        ctx.textAlign = 'right';
        ctx.fillText(`Trainer [C]: ${this.trainerMode ? 'ON' : 'OFF'}`, W - 20, 30);

        if (this.state !== 'BETTING') {
            ctx.textAlign = 'center';
            ctx.fillText('DEALER', W/2, 80);
            let startX = W/2 - ((this.dealerHand.cards.length * 60) / 2) + 5;
            for (let i = 0; i < this.dealerHand.cards.length; i++) {
                const isHole = (i === 1 && !this.dealerHand.holeRevealed);
                this.drawCardGraphic(ctx, this.dealerHand.cards[i], startX + i * 60, 100, isHole);
            }
            if (this.dealerHand.holeRevealed) {
                const dTot = this.getHandTotal(this.dealerHand.cards);
                ctx.fillText(`Total: ${dTot.total}${dTot.isSoft && dTot.total <= 21 ? ' (Soft)' : ''}`, W/2, 190);
            }

            const handWidth = 140;
            const totalW = this.playerHands.length * handWidth;
            let px = W/2 - totalW/2 + (handWidth / 2);

            for (let i = 0; i < this.playerHands.length; i++) {
                const hand = this.playerHands[i];
                ctx.fillStyle = (i === this.activeHandIndex && this.state === 'PLAYER_TURN') ? '#f1c40f' : '#fff';
                ctx.font = '16px Kenney';
                ctx.fillText(`HAND ${i+1} ($${hand.bet})`, px, H/2 - 10);

                let cx = px - ((hand.cards.length * 40) / 2) + 5;
                for (let j = 0; j < hand.cards.length; j++) {
                    this.drawCardGraphic(ctx, hand.cards[j], cx + j * 40, H/2 + 10 + (j*15), false);
                }

                const pTot = this.getHandTotal(hand.cards);
                ctx.fillStyle = '#fff';
                const yOff = H/2 + 120 + (hand.cards.length > 2 ? (hand.cards.length - 2) * 15 : 0);
                ctx.fillText(`Total: ${pTot.total}${pTot.isSoft && pTot.total <= 21 ? ' (Soft)' : ''}`, px, yOff);

                if (hand.result) {
                    ctx.fillStyle = (hand.payout > hand.bet) ? '#2ecc71' : (hand.payout === hand.bet) ? '#f1c40f' : '#e74c3c';
                    ctx.fillText(`${hand.result}`, px, yOff + 25);
                }
                px += handWidth;
            }
        }

        if (this.state === 'BETTING') {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.font = '30px Kenney';
            ctx.fillText('PLACE YOUR BET', W/2, H/2);
            this.drawButton(ctx, W/2 - 120, H - 100, 40, 40, '-', '#34495e');
            ctx.fillText(`$${this.currentBet}`, W/2, H - 72);
            this.drawButton(ctx, W/2 + 80, H - 100, 40, 40, '+', '#34495e');
            this.drawButton(ctx, W/2 - 50, H - 50, 100, 40, 'DEAL', '#27ae60');
        }

        else if (this.state === 'PLAYER_TURN') {
            const hand = this.playerHands[this.activeHandIndex];
            const canSplit = hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank && this.playerHands.length < 4;
            const canDouble = hand.cards.length === 2;
            const pending = this.playerHands.reduce((s, h) => s + h.bet, 0);
            const hasMoney = this.session.bankroll >= pending + hand.bet;

            this.drawButton(ctx, W/2 - 190, H - 100, 80, 40, 'HIT', '#2980b9');
            this.drawButton(ctx, W/2 - 90, H - 100, 80, 40, 'STAND', '#d35400');
            this.drawButton(ctx, W/2 + 10, H - 100, 90, 40, 'DOUBLE', hasMoney && canDouble ? '#8e44ad' : '#7f8c8d');
            this.drawButton(ctx, W/2 + 110, H - 100, 80, 40, 'SPLIT', hasMoney && canSplit ? '#16a085' : '#7f8c8d');
        }

        else if (this.state === 'TRAINER_PROMPT') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fff';
            ctx.font = '24px Kenney';
            ctx.textAlign = 'center';
            ctx.fillText("What is the Running Count?", W/2, H/2 - 20);
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(this.trainerInput || '_', W/2, H/2 + 20);
            ctx.font = '16px Kenney';
            ctx.fillStyle = '#bdc3c7';
            ctx.fillText("Press number and press Enter", W/2, H/2 + 60);
        }

        else if (this.state === 'PAYOUT') {
            this.drawButton(ctx, W/2 -75, H - 100, 150, 40, 'NEXT HAND', '#2980b9');

            if (this.trainerMode) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(20, H - 130, 260, 110);
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'left';

                const decksRem = Math.max(1, (312 - this.cardsDealt) / 52);
                const trueCount = Math.round((this.runningCount / decksRem) * 10) / 10;

                ctx.fillText(`Running Count: ${this.runningCount}`, 30, H - 100);
                ctx.fillText(`True Count: ${trueCount}`, 30, H - 70);

                if (this.trainerInput !== '') {
                    const guessed = parseInt(this.trainerInput);
                    const isCorrect = guessed === this.runningCount;
                    ctx.fillStyle = isCorrect ? '#2ecc71' : '#e74c3c';
                    ctx.fillText(`You GuessedL ${guessed} (${isCorrect ? '✔' : '✖'})`, 30, H - 40);
                }
            }
        }
    }
}
