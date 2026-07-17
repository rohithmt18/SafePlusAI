const express = require('express');
const Contact = require('../models/Contact');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── SMS sender (Console Fallback Only) ──────────────────────

/**
 * Send an SMS message (Simulated via console log).
 * Returns false to indicate it was simulated.
 */
async function sendSMS(to, body) {
  // Console fallback
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📱 [SMS SIMULATION] To: ${to}`);
  console.log(`   Message: ${body}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return false;
}


// ── POST /api/notify/sos  — Emergency SOS broadcast ───────────────
router.post('/sos', authMiddleware, async (req, res) => {
  try {
    const { riskScore, riskLevel, location, aiSummary, triggeredBy } = req.body;

    // Load all contacts for this user
    const contacts = await Contact.find({ userId: req.user._id, smsEnabled: true });

    if (contacts.length === 0) {
      return res.json({
        sent: 0,
        results: [],
        message: 'No emergency contacts configured. Add contacts to enable SMS alerts.',
      });
    }

    // Build emergency message
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const locationStr = location?.address || (location?.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Unknown location');
    const triggerNote = triggeredBy === 'manual' ? 'manually triggered SOS' : `AI detected danger (Risk Score: ${riskScore}/100 — ${riskLevel})`;

    const message =
      `🚨 EMERGENCY ALERT — SafeplusAI\n` +
      `Person: ${req.user.name}\n` +
      `Time: ${time} on ${dateStr}\n` +
      `Location: ${locationStr}\n` +
      `Reason: ${triggerNote}\n` +
      `\nPlease check on them immediately or call emergency services.\n` +
      `Reply SAFE to confirm they are okay.`;

    // Also add Google Maps link if we have coordinates
    const mapsLink = location?.lat
      ? `\n📍 Map: https://maps.google.com/?q=${location.lat},${location.lng}`
      : '';

    const fullMessage = message + mapsLink;

    // Send to all contacts
    const results = await Promise.all(
      contacts.map(async (contact) => {
        const smsSent = await sendSMS(contact.phone, fullMessage);
        return { name: contact.name, phone: contact.phone, smsSent };
      })
    );

    const sentCount = results.filter(r => r.smsSent).length;

    res.json({
      sent: sentCount,
      total: contacts.length,
      results,
      message: sentCount > 0
        ? `Emergency SMS sent to ${sentCount}/${contacts.length} contacts.`
        : `${contacts.length} contacts notified (console mode — real SMS sending disabled for now).`,
    });
  } catch (err) {
    console.error('SOS notify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/notify/test  — Test SMS to a single number ──────────
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required.' });

    const msg = `🛡️ SafeplusAI Test — SMS alerts are working! This is a test from ${req.user.name}'s SafeplusAI account.`;
    const sent = await sendSMS(phone, msg);

    res.json({ sent, phone, message: 'SMS logged to server console (real SMS sending disabled for now).' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.sendSMS = sendSMS;
