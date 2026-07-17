const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: 100,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
  },
  relationship: {
    type: String,
    enum: ['Family', 'Friend', 'Partner', 'Colleague', 'Neighbor', 'Medical', 'Other'],
    default: 'Other',
  },
  notes: {
    type: String,
    default: '',
    maxlength: 500,
  },
  smsEnabled: {
    type: Boolean,
    default: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contact', contactSchema);
