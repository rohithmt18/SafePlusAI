const mongoose = require('mongoose');

const timelineItemSchema = new mongoose.Schema({
  time: Date,
  signal: String,
  detail: String,
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
  keywords: [{ word: String, weight: Number, severity: String }],
}, { _id: false });

const emergencyEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['Safe', 'Caution', 'Danger', 'Emergency'], required: true },

  location: {
    lat: Number,
    lng: Number,
    address: String,
    accuracy: Number,
  },

  signals: {
    speechRisk: { type: Number, default: 0 },
    audioRisk:  { type: Number, default: 0 },
    emotionRisk:{ type: Number, default: 0 },
    motionRisk: { type: Number, default: 0 },
    timeRisk:   { type: Number, default: 0 },
    keywords:   { type: Array, default: [] },
    audioEventType: String,
    emotion:    String,
    emotionConfidence: Number,
    motionEventType: String,
  },

  timeline: [timelineItemSchema],

  aiSummary: String,

  contactsNotified: [{
    name: String,
    phone: String,
    relationship: String,
    smsSent: { type: Boolean, default: false },
    _id: false,
  }],

  triggeredBy: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto',
  },

  status: {
    type: String,
    enum: ['active', 'resolved', 'false_alarm'],
    default: 'active',
  },

  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient user queries
emergencyEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('EmergencyEvent', emergencyEventSchema);
