const mongoose = require('mongoose');

const snNotificationSchema = new mongoose.Schema({
  serviceNeederId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceNeeder',
    required: true
  },
  serviceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  serviceProvider: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovedServiceProvider' },
    name: { type: String },
    phoneNumber: { type: String }
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SNNotification', snNotificationSchema);