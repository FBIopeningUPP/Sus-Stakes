export class CasinoSession {
    constructor() {
        this.bankroll = 1000;
        this.transactions = [];
    }

    load() {
        const data = localStorage.getItem('sus_stakes_session');
        if (data) {
            const parsed = JSON.parse(data);
            this.bankroll = parsed.bankroll ?? 1000;
            this.transactions = parsed.transactions || [];
        }
    }

    save() {
        localStorage.setItem('sus_stakes_session', JSON.stringify({
            bankroll: this.bankroll,
            transactions: this.transactions
        }));
    }

    addTransaction(game, wager, payout) {
        this.bankroll += (payout - wager);
        this.transactions.push({
            game, 
            wager, 
            payout,
            timestamp: Date.now()
        });
        this.save();
    }
}