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
                this.sm.spawnFloatingText("TEXAS HOLD'EM", this.sm.canvas.width/2, 100, '#f1c40f');
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
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

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

        let allCards = [...holeCards, ...this.communityCards];
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

        let counts = Object.entries(ranks).map(([r, c]) => ({ value: parseInt(value), count }));
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

    
}