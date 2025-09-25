const mongoose = require('mongoose');

const requestedServiceProviderSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  serviceType: [{
    type: String,
    required: true
  }],
  phoneNumber: {
    type: String,
    required: true
  },
  serviceArea: {
    type: String,
    required: true
  },
  availableDays: [{
    type: String,
    required: true
  }],
  timeFrom: {
    type: String,
    required: true
  },
  timeTo: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  serviceFee: {
    type: Number,
    required: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('RequestedServiceProvider', requestedServiceProviderSchema);