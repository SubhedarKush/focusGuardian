const FocusSession = require('../models/focusSession.model');

// Create a new focus session
exports.createFocusSession = async (req, res) => {
  const { blockedApps, blockedWebsites, startTime, endTime } = req.body;

  try {
    const session = new FocusSession({
      user: req.user._id,
      startTime: new Date(),
      endTime: endTime,
      blockedApps,
      blockedWebsites
    });

    await session.save();
    res.status(201).json(session);
  } catch (err) {
    console.error('Error creating focus session:', err.message);
    res.status(500).json({ message: 'Failed to create focus session' });
  }
};

// Get all focus sessions for the logged-in user
exports.getMyFocusSessions = async (req, res) => {
  try {
    const sessions = await FocusSession.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err.message);
    res.status(500).json({ message: 'Failed to fetch focus sessions' });
  }
};

// Mark session as completed (used for stop or timer end)
exports.completeFocusSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await FocusSession.findOne({
      _id: id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Only active sessions can be completed' });
    }

    session.endTime = new Date();
    session.status = 'completed';

    await session.save();
    res.status(200).json({ message: 'Focus session completed', session });
  } catch (err) {
    console.error('Error completing session:', err.message);
    res.status(500).json({ message: 'Failed to complete session' });
  }
};

// Cancel an active focus session by ID
exports.cancelFocusSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await FocusSession.findOne({
      _id: id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ message: 'Only active sessions can be cancelled' });
    }

    session.status = 'cancelled';
    session.endTime = new Date();

    await session.save();
    res.status(200).json({ message: 'Focus session cancelled', session });
  } catch (err) {
    console.error('Error cancelling session:', err.message);
    res.status(500).json({ message: 'Failed to cancel session' });
  }
};

// Get real-time stats including current active session
exports.getRealTimeStats = async (req, res) => {
  try {
    // Get completed sessions total time
    const completedSessions = await FocusSession.find({
      user: req.user._id,
      status: { $in: ['completed', 'cancelled'] },
      endTime: { $exists: true }
    });

    let totalCompletedTime = 0;
    completedSessions.forEach(session => {
      if (session.endTime && session.startTime) {
        const duration = (new Date(session.endTime) - new Date(session.startTime)) / 1000 / 3600; // hours
        totalCompletedTime += duration;
      }
    });

    // Get current active session
    const activeSession = await FocusSession.findOne({
      user: req.user._id,
      status: 'active'
    });

    let currentSessionTime = 0;
    if (activeSession) {
      const now = new Date();
      const sessionStart = new Date(activeSession.startTime);
      currentSessionTime = (now - sessionStart) / 1000 / 3600; // hours
    }

    const totalRealTimeHours = totalCompletedTime + currentSessionTime;

    res.status(200).json({
      totalHours: Math.round(totalRealTimeHours * 100) / 100, // Round to 2 decimal places
      completedHours: Math.round(totalCompletedTime * 100) / 100,
      currentSessionHours: Math.round(currentSessionTime * 100) / 100,
      hasActiveSession: !!activeSession
    });

  } catch (err) {
    console.error('Error fetching real-time stats:', err.message);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};
