const express = require('express');
const router = express.Router();
const FocusSession = require("../models/focusSession.model.js");
const {
  createFocusSession,
  getMyFocusSessions,
  cancelFocusSession,
  completeFocusSession,
  getRealTimeStats
} = require("../controllers/focusSessionController");

const protect = require("../middlewares/authMiddleware.js");

// Create a new focus session

router.post('/', protect, createFocusSession);

//Get all sessions for logged-in user

router.get('/', protect, getMyFocusSessions);

// Cancel a session

router.patch('/:id/cancel', protect, cancelFocusSession);

//Mark a session as completed (used on timer stop or end)

router.put('/:id/complete', protect, completeFocusSession);

// Get total completed focus hours

router.get('/stats/realtime', protect, getRealTimeStats);

module.exports = router;
