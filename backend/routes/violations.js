const express = require('express');
const router = express.Router();
const AppViolation = require("../models/appViolation.models.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

// Log a new violation
router.post('/', authMiddleware, async (req, res) => {
  const { appName } = req.body;

  if (!appName) return res.status(400).json({ message: 'App name is required' });

  try {
    const violation = new AppViolation({
      user: req.user.id,
      appName
    });

    await violation.save();
    res.status(201).json({ message: 'Violation logged' });
  } catch (err) {
    res.status(500).json({ message: 'Server error logging violation' });
  }
});

// Get all violations for dashboard
router.get('/', authMiddleware, async (req, res) => {
  try {
    const violations = await AppViolation.find({ user: req.user.id }).sort({ timestamp: -1 });
    res.json(violations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
