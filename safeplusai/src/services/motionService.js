/**
 * Motion Service — DeviceMotion API
 * Detects falls (sudden large acceleration change) and abnormal shaking.
 */

class MotionService {
  constructor() {
    this.isListening = false;
    this.onUpdate = null;
    this.riskContribution = 0;
    this.eventType = 'normal';
    this.supported = 'DeviceMotionEvent' in window;
    this._handler = this._handleMotion.bind(this);

    // Acceleration history
    this.accHistory = [];
    this.MAX_HISTORY = 10;
    this.lastAcc = { x: 0, y: 0, z: 9.8 };

    // Thresholds
    this.FALL_THRESHOLD = 25;   // sudden large magnitude change
    this.SHAKE_THRESHOLD = 15;
  }

  async start(onUpdate) {
    this.onUpdate = onUpdate;

    // iOS 13+ requires permission
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') return false;
      } catch (e) { return false; }
    }

    if (!this.supported) {
      // Simulate motion for desktop demo
      this._startSimulation();
      return true;
    }

    window.addEventListener('devicemotion', this._handler, { passive: true });
    this.isListening = true;
    return true;
  }

  _startSimulation() {
    // Simulate gentle motion for desktop browsers that don't have DeviceMotion
    this.isListening = true;
    this._simInterval = setInterval(() => {
      const noise = () => (Math.random() - 0.5) * 2;
      const acc = { x: noise(), y: noise(), z: 9.8 + noise() * 0.5 };
      this._processAcceleration(acc);
    }, 500);
  }

  _handleMotion(event) {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) return;
    this._processAcceleration({ x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 });
  }

  _processAcceleration(acc) {
    const dx = acc.x - this.lastAcc.x;
    const dy = acc.y - this.lastAcc.y;
    const dz = acc.z - this.lastAcc.z;
    const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);

    this.accHistory.push(delta);
    if (this.accHistory.length > this.MAX_HISTORY) this.accHistory.shift();
    this.lastAcc = acc;

    let eventType = 'normal';
    let riskScore = 0;

    if (delta >= this.FALL_THRESHOLD) {
      eventType = 'fall_detected';
      riskScore = 10;
    } else if (delta >= this.SHAKE_THRESHOLD) {
      eventType = 'shaking';
      riskScore = 5;
    }

    this.eventType = eventType;
    this.riskContribution = riskScore;

    if (this.onUpdate) {
      this.onUpdate({
        acceleration: acc,
        delta: Math.round(delta * 10) / 10,
        eventType,
        riskScore,
      });
    }
  }

  stop() {
    this.isListening = false;
    window.removeEventListener('devicemotion', this._handler);
    if (this._simInterval) clearInterval(this._simInterval);
    this.riskContribution = 0;
    this.eventType = 'normal';
  }

  getState() {
    return {
      isListening: this.isListening,
      eventType: this.eventType,
      riskContribution: this.riskContribution,
      supported: this.supported,
    };
  }
}

export default new MotionService();
