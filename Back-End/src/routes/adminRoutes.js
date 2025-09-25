const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminAuthMiddleware = require("../middleware/adminAuth");

// Public routes
router.post("/login", adminController.login);

// Protected routes (require admin authentication)
router.get("/profile", adminAuthMiddleware, adminController.getProfile);
router.put("/profile", adminAuthMiddleware, adminController.updateProfile);
router.put(
  "/security-settings",
  adminAuthMiddleware,
  adminController.updateSecuritySettings
);

module.exports = router;
