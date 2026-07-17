const express = require('express');
const Contact = require('../models/Contact');
const authMiddleware = require('../middleware/auth');
const { sendSMS } = require('./notify');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/contacts  — list all contacts for current user
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts  — create new contact + send welcome SMS
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, relationship, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    const contact = await Contact.create({
      userId: req.user._id,
      name, phone, email, relationship, notes,
    });

    // Send welcome / setup SMS to the new contact
    const welcomeMsg = `🛡️ SafeplusAI Alert: ${req.user.name} has added you as an emergency contact. If you receive future messages from this number, it means they need immediate help. Stay safe!`;

    const smsSent = await sendSMS(phone, welcomeMsg);
    if (smsSent) {
      console.log(`✅ Welcome SMS sent to ${name} (${phone})`);
    } else {
      console.log(`📋 Welcome SMS logged (Twilio not configured): ${name} (${phone})`);
    }

    res.status(201).json({ contact, smsSent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contacts/:id  — update contact
router.put('/:id', async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contacts/:id  — delete contact
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ message: 'Contact deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
