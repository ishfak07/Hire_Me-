const mongoose = require('mongoose');

const connectedServiceSchema = new mongoose.Schema({
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
  otp: { type: String, required: true },
  otpGeneratedAt: { type: Date, default: Date.now },
  otpVerifiedAt: { type: Date },
  originalServiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceAccepted', required: true },
  status: {
    type: String,
    enum: ['connected', 'completed'],
    default: 'connected'
  },
  connectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ConnectedService', connectedServiceSchema);