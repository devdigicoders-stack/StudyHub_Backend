const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// Track a page view
router.post("/track", analyticsController.trackPageView);

// Get real-time dashboard analytics
router.get("/dashboard-stats", analyticsController.getDashboardStats);

module.exports = router;
