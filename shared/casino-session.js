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
            this.debt = parsed.debt ?? 0;
            this.transactions = parsed.transactions || [];
        }
    }

    save() {
        localStorage.setItem('sus_stakes_session', JSON.stringify({
            bankroll: this.bankroll,
            debt: this.debt,
            transactions: this.transactions
        }));
    }

    hardReset() {
        this.bankroll = 1000;
        this.debt = 0;
        this.transactions = [];
        this.save();
    }

    addTransaction(game, wager, payout) {
        let netProfit = payout - wager;

        if (netProfit < 0 && this.debt > 0) {
            const sharkCut = Math.min(this.debt, Math.ceil(netProfit * 0.20));
            this.debt -= sharkCut;
            netProfit += sharkCut;
        }

        this.bankroll += netProfit;
        this.transactions.push({ game, wager, payout, timestamp: Date.now() });
        this.save();
    }

    takeLoan() {
        this.bankroll += 1000;
        this.debt += 1500;
        this.save();
    }
}