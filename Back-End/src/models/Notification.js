const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  serviceProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovedServiceProvider',
    required: true
  },
  serviceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  serviceNeeder: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceNeeder' },
    name: String,
    phoneNumber: String
  },
  serviceDetails: {
    serviceType: String,
    location: String,
    address: String,
    date: String,
    timeFrom: String,
    timeTo: String,
    totalHours: Number,
    feePerHour: Number,
    totalFee: Number
  },
  message: String,
  read: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);