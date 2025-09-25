const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const ServiceAccepted = require('../models/ServiceAccepted');
const ServiceRejected = require('../models/ServiceRejected');

// Get all pending service requests
router.get('/', async (req, res) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Error fetching service requests' });
  }
});

// Get all approved services
router.get('/approved', async (req, res) => {
  try {
    const approved = await ServiceAccepted.find().sort({ acceptedAt: -1 });
    res.status(200).json(approved);
  } catch (error) {
    console.error('Error fetching approved services:', error);
    res.status(500).json({ message: 'Error fetching approved services' });
  }
});

// Get all rejected services
router.get('/rejected', async (req, res) => {
  try {
    const rejected = await ServiceRejected.find().sort({ createdAt: -1 });
    res.status(200).json(rejected);
  } catch (error) {
    console.error('Error fetching rejected services:', error);
    res.status(500).json({ message: 'Error fetching rejected services' });
  }
});

module.exports = router;