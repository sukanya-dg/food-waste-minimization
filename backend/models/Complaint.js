const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'agent'], required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'customerService', default: null },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const complaintSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userType: { type: String, enum: ['donor', 'receiver'], required: true },
  title: String,
  description: String,
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
  replies: [replySchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
