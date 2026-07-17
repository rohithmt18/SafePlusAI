/**
 * SOS Sound Service — generates an emergency alarm using Web Audio API.
 * No audio file required. Works in any modern browser.
 */

class SOSSound {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.intervalId = null;
    this.gainNode = null;
    this._pulse = 0;
  }

  _getCtx() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play a single siren "whoop" — frequency sweeps from low to high.
   */
  _playWhoop(startFreq = 440, endFreq = 880, duration = 0.4, volume = 0.8) {
    const ctx = this._getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration + 0.1);
  }

  /**
   * Play a short beep.
   */
  _playBeep(freq = 880, duration = 0.1, volume = 0.6, delay = 0) {
    const ctx = this._getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime + delay);

    gainNode.gain.setValueAtTime(0.001, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration + 0.05);
  }

  /**
   * Play a 3-beep SOS alert (used for countdown cancel mode).
   */
  playSOSBeeps() {
    this._playBeep(1000, 0.15, 0.7, 0);
    this._playBeep(1000, 0.15, 0.7, 0.25);
    this._playBeep(1000, 0.15, 0.7, 0.5);
  }

  /**
   * Start continuous siren — alternating low/high sweep.
   * Stops after maxDuration seconds or when stop() is called.
   */
  startSiren(maxDuration = 30) {
    if (this.isPlaying) return;
    this.isPlaying = true;

    const playCycle = () => {
      if (!this.isPlaying) return;
      // Alternating wail
      this._playWhoop(350, 900, 0.5, 0.9);
      setTimeout(() => {
        if (!this.isPlaying) return;
        this._playWhoop(900, 350, 0.5, 0.9);
      }, 550);
    };

    // Play immediately
    playCycle();

    // Repeat every 1.1 seconds
    this.intervalId = setInterval(playCycle, 1100);

    // Auto-stop after maxDuration
    setTimeout(() => this.stopSiren(), maxDuration * 1000);
  }

  stopSiren() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * One-shot alarm for SOS button press.
   * Plays 3 escalating whoops then stops.
   */
  playSOSAlert() {
    this._playWhoop(300, 1000, 0.5, 0.85);
    setTimeout(() => this._playWhoop(300, 1200, 0.5, 0.9), 600);
    setTimeout(() => this._playWhoop(300, 1500, 0.6, 1.0), 1200);
  }
}

export default new SOSSound();
