// agent/agentRoutes.js
const express = require('express');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const path = require('path');
const router = express.Router();

const TOKEN_PATH = require("./tokenPath"); // ✅ Use shared token path

// Track agent process
let agentProcess = null;

// ✅ Save token to file
router.post('/save-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token required' });

  fs.writeFileSync(TOKEN_PATH, token);
  res.json({ message: 'Token saved successfully' });
});

// ✅ Start the monitoring agent
router.post('/start-agent', (req, res) => {
  try {
    const { blockedApps, sessionId } = req.body;
    
    console.log('Starting monitoring for session:', sessionId);
    
    // Save the session configuration for the agent to use
    const configPath = path.join(__dirname, 'sessionConfig.json');
    const config = {
      blockedApps: blockedApps || [],
      sessionId,
      startTime: new Date().toISOString(),
      isActive: true,
      action: 'START' // Signal to start monitoring
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    res.json({ 
      message: 'Agent monitoring started', 
      sessionId,
      blockedApps 
    });
    
  } catch (error) {
    console.error('Failed to start agent:', error);
    res.status(500).json({ message: 'Failed to start agent' });
  }
});

// ✅ Delete token
router.delete('/delete-token', (req, res) => {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
  }
  res.json({ message: 'Token deleted successfully' });
});

// ✅ Stop monitoring (don't kill the process)
router.get('/kill-agent', (req, res) => {
  try {
    // Signal the agent to stop monitoring
    const configPath = path.join(__dirname, 'sessionConfig.json');
    const config = {
      isActive: false,
      action: 'STOP', // Signal to stop monitoring
      endTime: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log('Monitoring stopped - session marked as inactive');
    res.json({ message: 'Agent monitoring stopped' });
  } catch (error) {
    console.error('Error stopping agent:', error);
    res.status(500).json({ message: 'Failed to stop agent' });
  }
});

// ✅ Optional: Completely kill agent process (use sparingly)
router.post('/terminate-agent', (req, res) => {
  try {
    if (agentProcess && !agentProcess.killed) {
      agentProcess.kill('SIGTERM');
      agentProcess = null;
      console.log('Agent process terminated');
    }
    
    const configPath = path.join(__dirname, 'sessionConfig.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    res.json({ message: 'Agent process terminated' });
  } catch (error) {
    console.error('Error terminating agent:', error);
    res.status(500).json({ message: 'Failed to terminate agent' });
  }
});

module.exports = router;