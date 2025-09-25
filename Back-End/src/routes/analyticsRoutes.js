const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// Get analytics dashboard data
router.get("/dashboard", analyticsController.getAnalyticsData);

module.exports = router;
