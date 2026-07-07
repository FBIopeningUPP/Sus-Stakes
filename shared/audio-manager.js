export class AudioManager {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.15;
        this.masterGain.connect(this.ctx.destination);
    }

    playTone(freq, type, duration) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();

        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.stop(this.ctx.currentTime + duration);
    }


    playCoin() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';

        osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playTick() {
        this.playTone(150, 'square', 0.05);
    }

    playWin() {
        setTimeout(() => this.playTone(440, 'square', 0.1), 0);
        setTimeout(() => this.playTone(554, 'square', 0.1), 100);
        setTimeout(() => this.playTone(659, 'square', 0.1), 200);
        setTimeout(() => this.playTone(880, 'square', 0.3), 300);
    }

    playLose() {
        if(this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.stop(this.ctx.currentTime + 0.5);
    }
}