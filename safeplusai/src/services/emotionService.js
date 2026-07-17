/**
 * Emotion Service — Voice emotion analysis via frequency analysis
 * Analyzes microphone audio to estimate emotional state from pitch & energy patterns.
 */

class EmotionService {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.stream = null;
    this.isListening = false;
    this.animationId = null;
    this.onUpdate = null;

    this.pitchHistory = [];
    this.energyHistory = [];
    this.MAX_HISTORY = 60;

    this.currentEmotion = 'calm';
    this.confidence = 0;
    this.riskContribution = 0;
    this.pitch = 0;
  }

  async start(onUpdate) {
    if (this.isListening) return false;
    this.onUpdate = onUpdate;

    // Try to reuse existing audio stream if AudioService has one
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.85;
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      this.isListening = true;
      this._loop();
      return true;
    } catch (err) {
      return false;
    }
  }

  _estimatePitch(buffer) {
    // Autocorrelation-based pitch detection
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return 0; // too quiet

    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / MAX_SAMPLES;
      if (correlation > 0.9 && correlation > lastCorrelation) {
        bestOffset = offset;
        bestCorrelation = correlation;
      }
      lastCorrelation = correlation;
      if (bestCorrelation > 0.95) break;
    }

    if (bestOffset === -1) return 0;
    return this.audioContext.sampleRate / bestOffset;
  }

  _classifyEmotion(avgPitch, pitchVariance, avgEnergy) {
    // Emotion classification heuristics based on prosodic features
    // High pitch + high variance + high energy → fearful/distressed
    // High pitch + high variance + medium energy → stressed
    // Low pitch + low variance + low energy → calm
    // High energy + low variance → angry

    let emotion = 'calm';
    let riskScore = 0;
    let confidence = 0;

    if (avgPitch === 0) {
      return { emotion: 'analyzing', riskScore: 0, confidence: 0 };
    }

    const isHighPitch = avgPitch > 250;
    const isHighVariance = pitchVariance > 80;
    const isHighEnergy = avgEnergy > 0.15;
    const isMediumEnergy = avgEnergy > 0.05;

    if (isHighPitch && isHighVariance && isHighEnergy) {
      emotion = 'fearful';
      riskScore = 20;
      confidence = 85;
    } else if (isHighPitch && isHighVariance && isMediumEnergy) {
      emotion = 'stressed';
      riskScore = 14;
      confidence = 75;
    } else if (isHighEnergy && !isHighVariance) {
      emotion = 'agitated';
      riskScore = 10;
      confidence = 65;
    } else if (isMediumEnergy && isHighPitch) {
      emotion = 'anxious';
      riskScore = 8;
      confidence = 60;
    } else {
      emotion = 'calm';
      riskScore = 0;
      confidence = 80;
    }

    return { emotion, riskScore, confidence };
  }

  _loop() {
    if (!this.isListening) return;

    const floatData = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(floatData);

    const pitch = this._estimatePitch(floatData);
    const energy = floatData.reduce((s, v) => s + v * v, 0) / floatData.length;

    if (pitch > 50 && pitch < 500) {
      this.pitchHistory.push(pitch);
      if (this.pitchHistory.length > this.MAX_HISTORY) this.pitchHistory.shift();
    }
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.MAX_HISTORY) this.energyHistory.shift();

    const avgPitch = this.pitchHistory.length > 0
      ? this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length
      : 0;

    const pitchVariance = this.pitchHistory.length > 1
      ? Math.sqrt(this.pitchHistory.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) / this.pitchHistory.length)
      : 0;

    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    const result = this._classifyEmotion(avgPitch, pitchVariance, avgEnergy);
    this.currentEmotion = result.emotion;
    this.confidence = result.confidence;
    this.riskContribution = result.riskScore;
    this.pitch = Math.round(avgPitch);

    if (this.onUpdate) {
      this.onUpdate({
        emotion: result.emotion,
        confidence: result.confidence,
        riskScore: result.riskScore,
        pitch: Math.round(avgPitch),
        energy: Math.round(avgEnergy * 1000),
      });
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
    this.pitchHistory = [];
    this.energyHistory = [];
    this.currentEmotion = 'calm';
    this.riskContribution = 0;
    this.pitch = 0;
    this.confidence = 0;
  }

  getState() {
    return {
      isListening: this.isListening,
      emotion: this.currentEmotion,
      confidence: this.confidence,
      riskContribution: this.riskContribution,
      pitch: this.pitch,
    };
  }
}

export default new EmotionService();
