/**
 * Audio Service — Web Audio API wrapper
 * Detects high-amplitude audio events (screaming, loud sounds).
 */

class AudioService {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.stream = null;
    this.isListening = false;
    this.animationId = null;
    this.onUpdate = null;
    this.volumeHistory = [];
    this.MAX_HISTORY = 30;

    // Thresholds
    this.LOUD_THRESHOLD = 80;     // 0-255 scale — sustained loud sound
    this.SCREAM_THRESHOLD = 160;  // sudden very loud spike
    this.SILENCE_THRESHOLD = 10;

    this.currentVolume = 0;
    this.riskContribution = 0;
    this.eventType = 'silence';
  }

  async start(onUpdate) {
    if (this.isListening) return;
    this.onUpdate = onUpdate;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      this.isListening = true;
      this._loop();
      return true;
    } catch (err) {
      return false;
    }
  }

  _loop() {
    if (!this.isListening) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);

    // Calculate RMS volume
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / data.length);
    const volume = Math.round(rms * 255);
    this.currentVolume = volume;

    // Track history for anomaly detection
    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > this.MAX_HISTORY) {
      this.volumeHistory.shift();
    }

    // Classify audio event
    let eventType = 'silence';
    let riskScore = 0;

    if (volume >= this.SCREAM_THRESHOLD) {
      eventType = 'scream';
      riskScore = 25;
    } else if (volume >= this.LOUD_THRESHOLD) {
      // Check if sustained (>5 samples above threshold)
      const sustained = this.volumeHistory.filter(v => v >= this.LOUD_THRESHOLD).length;
      if (sustained > 5) {
        eventType = 'loud_sustained';
        riskScore = 18;
      } else {
        eventType = 'loud';
        riskScore = 12;
      }
    } else if (volume >= this.SILENCE_THRESHOLD) {
      eventType = 'normal';
      riskScore = 0;
    }

    this.eventType = eventType;
    this.riskContribution = riskScore;

    // Volume bar percentage (0-100)
    const volumePct = Math.min(100, Math.round((volume / 200) * 100));

    if (this.onUpdate) {
      this.onUpdate({ volume, volumePct, eventType, riskScore });
    }

    this.animationId = requestAnimationFrame(() => this._loop());
  }

  stop() {
    this.isListening = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.microphone) this.microphone.disconnect();
    if (this.audioContext) this.audioContext.close();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.stream = null;
    this.currentVolume = 0;
    this.riskContribution = 0;
    this.eventType = 'silence';
    this.volumeHistory = [];
  }

  getState() {
    return {
      isListening: this.isListening,
      volume: this.currentVolume,
      eventType: this.eventType,
      riskContribution: this.riskContribution,
    };
  }
}

export default new AudioService();
