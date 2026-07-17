const express = require('express');
const EmergencyEvent = require('../models/EmergencyEvent');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/events  — save emergency event
router.post('/', async (req, res) => {
  try {
    const {
      riskScore, riskLevel, location, signals,
      timeline, aiSummary, contactsNotified, triggeredBy,
    } = req.body;

    const event = await EmergencyEvent.create({
      userId: req.user._id,
      riskScore, riskLevel, location, signals,
      timeline: timeline || [],
      aiSummary,
      contactsNotified: contactsNotified || [],
      triggeredBy: triggeredBy || 'auto',
    });

    res.status(201).json({ event });
  } catch (err) {
    console.error('Save event error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events  — get event history (newest first, limit 100)
router.get('/', async (req, res) => {
  try {
    const events = await EmergencyEvent.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/events/:id/status  — update event status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['active', 'resolved', 'false_alarm'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }
    const event = await EmergencyEvent.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        $set: {
          status,
          ...(status === 'resolved' ? { resolvedAt: new Date() } : {}),
        },
      },
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/stats  — summary stats
router.get('/stats', async (req, res) => {
  try {
    const [total, active, resolved] = await Promise.all([
      EmergencyEvent.countDocuments({ userId: req.user._id }),
      EmergencyEvent.countDocuments({ userId: req.user._id, status: 'active' }),
      EmergencyEvent.countDocuments({ userId: req.user._id, status: 'resolved' }),
    ]);
    const avgScore = await EmergencyEvent.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, avg: { $avg: '$riskScore' } } },
    ]);
    res.json({
      total,
      active,
      resolved,
      avgRiskScore: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
