/**
 * Speech Service — Web Speech API wrapper
 * Detects distress keywords in real-time transcription.
 */

const DISTRESS_KEYWORDS = [
  // High severity (weight 1.0)
  { word: 'help', weight: 1.0, severity: 'critical' },
  { word: 'help me', weight: 1.0, severity: 'critical' },
  { word: 'emergency', weight: 1.0, severity: 'critical' },
  { word: 'call police', weight: 1.0, severity: 'critical' },
  { word: 'call 911', weight: 1.0, severity: 'critical' },
  { word: 'let me go', weight: 1.0, severity: 'critical' },
  { word: 'stop', weight: 0.7, severity: 'high' },
  { word: "don't touch me", weight: 1.0, severity: 'critical' },
  { word: 'leave me alone', weight: 0.9, severity: 'high' },
  // Medium severity
  { word: 'scared', weight: 0.8, severity: 'high' },
  { word: "i'm scared", weight: 0.9, severity: 'high' },
  { word: 'danger', weight: 0.8, severity: 'high' },
  { word: 'afraid', weight: 0.7, severity: 'medium' },
  { word: 'hurt', weight: 0.7, severity: 'medium' },
  { word: 'attack', weight: 0.9, severity: 'high' },
  { word: 'run', weight: 0.5, severity: 'medium' },
  { word: 'no', weight: 0.3, severity: 'low' },
  { word: 'please', weight: 0.2, severity: 'low' },
  { word: 'please stop', weight: 0.8, severity: 'high' },
  { word: 'someone help', weight: 1.0, severity: 'critical' },
  { word: 'robbery', weight: 0.9, severity: 'high' },
  { word: 'fire', weight: 0.8, severity: 'high' },
  { word: 'accident', weight: 0.7, severity: 'medium' },
];

class SpeechService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onStatusChange = null;
    this.supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.currentTranscript = '';
    this.detectedKeywords = [];
    this.riskContribution = 0;
  }

  init(onResult, onStatusChange) {
    if (!this.supported) return false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
    this.onResult = onResult;
    this.onStatusChange = onStatusChange;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      const combined = (final || interim).toLowerCase();
      if (combined) {
        this.currentTranscript = combined;
        const analysis = this._analyzeForDistress(combined);
        this.detectedKeywords = analysis.keywords;
        this.riskContribution = analysis.riskScore;
        if (this.onResult) this.onResult({ transcript: combined, ...analysis });
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Auto-restart to keep listening
        try { this.recognition.start(); } catch (e) {}
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        this.isListening = false;
        if (this.onStatusChange) this.onStatusChange('permission_denied');
      }
    };
    return true;
  }

  _analyzeForDistress(text) {
    const matched = [];
    let maxWeight = 0;
    for (const kw of DISTRESS_KEYWORDS) {
      if (text.includes(kw.word)) {
        matched.push(kw);
        if (kw.weight > maxWeight) maxWeight = kw.weight;
      }
    }
    // Risk score: 0-35 based on highest weight keyword
    const riskScore = Math.round(maxWeight * 35);
    return { keywords: matched, riskScore, hasDistress: matched.length > 0 };
  }

  start() {
    if (!this.recognition || this.isListening) return;
    this.isListening = true;
    try { this.recognition.start(); } catch (e) {}
    if (this.onStatusChange) this.onStatusChange('listening');
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
    if (this.onStatusChange) this.onStatusChange('stopped');
  }

  reset() {
    this.currentTranscript = '';
    this.detectedKeywords = [];
    this.riskContribution = 0;
  }

  getState() {
    return {
      isListening: this.isListening,
      transcript: this.currentTranscript,
      keywords: this.detectedKeywords,
      riskContribution: this.riskContribution,
      supported: this.supported,
    };
  }
}

export default new SpeechService();
