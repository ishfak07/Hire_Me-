const mongoose = require('mongoose');

const serviceRejectedSchema = new mongoose.Schema({
  serviceNeeder: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceNeeder', required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true }
  },
  serviceProvider: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovedServiceProvider', required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true }
  },
  serviceDetails: {
    serviceType: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    date: { type: String, required: true },
    timeFrom: { type: String, required: true },
    timeTo: { type: String, required: true },
    totalHours: { type: Number, required: true },
    feePerHour: { type: Number, required: true },
    totalFee: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'rejected'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceRejected', serviceRejectedSchema);