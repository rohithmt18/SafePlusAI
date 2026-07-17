/**
 * Risk Engine — Aggregates all sensor signals into a 0-100 risk score.
 * 
 * Signal weights:
 *  - Distress keywords:   35 pts max
 *  - Audio event:         25 pts max
 *  - Voice emotion:       20 pts max
 *  - Device motion:       10 pts max
 *  - Time of day (night):  5 pts max
 *  - Location:             5 pts max
 * Total: 100 pts
 */

export const RISK_LEVELS = {
  SAFE:      { label: 'Safe',      color: '#2ed573', min: 0,  max: 30,  severity: 0 },
  CAUTION:   { label: 'Caution',   color: '#ffa502', min: 31, max: 60,  severity: 1 },
  DANGER:    { label: 'Danger',    color: '#ff6b35', min: 61, max: 80,  severity: 2 },
  EMERGENCY: { label: 'Emergency', color: '#ff4757', min: 81, max: 100, severity: 3 },
};

export function getRiskLevel(score) {
  if (score >= 81) return RISK_LEVELS.EMERGENCY;
  if (score >= 61) return RISK_LEVELS.DANGER;
  if (score >= 31) return RISK_LEVELS.CAUTION;
  return RISK_LEVELS.SAFE;
}

export function calculateRiskScore(signals) {
  const {
    speechRisk = 0,    // 0-35
    audioRisk = 0,     // 0-25
    emotionRisk = 0,   // 0-20
    motionRisk = 0,    // 0-10
    timeRisk = 0,      // 0-5
    locationRisk = 0,  // 0-5
  } = signals;

  const total = Math.min(100, Math.round(
    speechRisk +
    audioRisk +
    emotionRisk +
    motionRisk +
    timeRisk +
    locationRisk
  ));

  return total;
}

export function generateEmergencyReport(signals, position, address, user, contacts) {
  const score = calculateRiskScore(signals);
  const level = getRiskLevel(score);
  const now = new Date();

  const timeline = [];

  if (signals.speechRisk > 0) {
    timeline.push({
      time: now.toISOString(),
      signal: 'Distress Speech',
      detail: `Detected distress keywords with risk contribution: ${signals.speechRisk}/35`,
      severity: signals.speechRisk > 25 ? 'critical' : 'high',
      keywords: signals.keywords || [],
    });
  }

  if (signals.audioRisk > 0) {
    timeline.push({
      time: now.toISOString(),
      signal: 'Audio Event',
      detail: `${signals.audioEventType || 'Loud sound'} detected. Risk contribution: ${signals.audioRisk}/25`,
      severity: signals.audioRisk >= 20 ? 'critical' : 'high',
    });
  }

  if (signals.emotionRisk > 0) {
    timeline.push({
      time: now.toISOString(),
      signal: 'Voice Emotion',
      detail: `Voice classified as "${signals.emotion || 'distressed'}" (${signals.emotionConfidence || 0}% confidence). Risk: ${signals.emotionRisk}/20`,
      severity: signals.emotionRisk >= 15 ? 'high' : 'medium',
    });
  }

  if (signals.motionRisk > 0) {
    timeline.push({
      time: now.toISOString(),
      signal: 'Device Motion',
      detail: `${signals.motionEventType === 'fall_detected' ? 'Possible fall detected' : 'Abnormal shaking detected'}. Risk: ${signals.motionRisk}/10`,
      severity: signals.motionEventType === 'fall_detected' ? 'critical' : 'medium',
    });
  }

  if (signals.timeRisk > 0) {
    const hour = now.getHours();
    timeline.push({
      time: now.toISOString(),
      signal: 'Time of Day',
      detail: `Late night hours (${hour}:${String(now.getMinutes()).padStart(2,'0')}) increase risk. Contribution: ${signals.timeRisk}/5`,
      severity: 'low',
    });
  }

  const report = {
    id: `event_${Date.now()}`,
    timestamp: now.toISOString(),
    user: user ? { name: user.name, email: user.email } : { name: 'Unknown', email: '' },
    riskScore: score,
    riskLevel: level.label,
    location: {
      lat: position?.lat || null,
      lng: position?.lng || null,
      address: address || 'Location unavailable',
      accuracy: position?.accuracy || null,
    },
    signals: { ...signals, score },
    timeline,
    contactsNotified: (contacts || []).map(c => ({ name: c.name, phone: c.phone, relationship: c.relationship })),
    aiSummary: _generateAISummary(score, level, signals, address),
    status: 'active',
  };

  return report;
}

function _generateAISummary(score, level, signals, address) {
  const parts = [];
  parts.push(`⚠️ Emergency alert triggered with risk score ${score}/100 (${level.label}).`);

  if (address) parts.push(`📍 Location: ${address}.`);

  const triggers = [];
  if (signals.speechRisk > 0) triggers.push(`distress speech detected ("${(signals.keywords || [])[0]?.word || 'help'}")`);
  if (signals.audioRisk > 0) triggers.push(`loud audio event (${signals.audioEventType || 'scream'})`);
  if (signals.emotionRisk > 0) triggers.push(`voice emotion classified as ${signals.emotion || 'fearful'}`);
  if (signals.motionRisk > 0) triggers.push(signals.motionEventType === 'fall_detected' ? 'potential fall detected' : 'abnormal device shaking');
  if (signals.timeRisk > 0) triggers.push('late-night high-risk timeframe');

  if (triggers.length > 0) {
    parts.push(`🔍 Triggered by: ${triggers.join(', ')}.`);
  }

  parts.push('🚨 Emergency contacts have been notified. Please verify the user\'s safety immediately.');

  return parts.join(' ');
}

export function saveEmergencyEvent(report) {
  const events = getEmergencyEvents();
  events.unshift(report); // newest first
  localStorage.setItem('safeplusai_events', JSON.stringify(events.slice(0, 100)));
}

export function getEmergencyEvents() {
  try {
    return JSON.parse(localStorage.getItem('safeplusai_events')) || [];
  } catch { return []; }
}

export function updateEventStatus(id, status) {
  const events = getEmergencyEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx !== -1) {
    events[idx].status = status;
    localStorage.setItem('safeplusai_events', JSON.stringify(events));
  }
}
