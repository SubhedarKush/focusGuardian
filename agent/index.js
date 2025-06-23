const axios = require('axios');
const psList = require('ps-list');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const TOKEN_PATH = require("./tokenPath.js");

const BACKEND_URL = 'http://localhost:8000';

const pollInterval = 5000;

let USER_TOKEN = null;
let intervalId = null;
let shouldStop = false;

// Load token from file
const loadToken = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    USER_TOKEN = fs.readFileSync(TOKEN_PATH, 'utf-8').trim();
    return true;
  }
  return false;
};

const checkForNewSessions = async () => {
  try {
    const configPath = path.join(__dirname, 'sessionConfig.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Check if this is a new session (compare timestamps, etc.)
      // Start monitoring if it's a new session
      console.log('Found new session config:', config);
      
    }
  } catch (error) {
    console.error('Error checking for sessions:', error);
  }
};

setInterval(checkForNewSessions, 2000);


const killApp = (name) => {
  //  Added cross-platform support
  const command = process.platform === 'win32' 
    ? `taskkill /IM ${name} /F`
    : `pkill -f ${name}`;

  exec(command, (err) => {
    if (!err) {
      console.log(` Blocked and killed: ${name}`);
      //  Added error handling for violation logging
      axios.post(`${BACKEND_URL}/api/violations`, { appName: name }, {
        headers: { Authorization: `Bearer ${USER_TOKEN}` }
      }).catch((error) => {
        console.error('Failed to log violation:', error.message);
      });
    }
  });
};

//  Listen for stop signal from API
process.on('STOP_AGENT_MONITORING', () => {
  console.log('Received stop signal from API');
  shouldStop = true;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});

// Main monitoring loop
const startMonitor = async () => {
  console.log('Agent monitoring started...');
  
  intervalId = setInterval(async () => {
    // Check if we should stop
    if (shouldStop) {
      console.log(' Stopping agent monitoring...');
      clearInterval(intervalId);
      return;
    }

    // Exit if token file was removed
    if (!fs.existsSync(TOKEN_PATH)) {
      console.log(' Token deleted. Exiting agent.');
      clearInterval(intervalId);
      process.exit(0);
    }

    try {
      const res = await axios.get(`${BACKEND_URL}/api/focus-sessions`, {
        headers: { Authorization: `Bearer ${USER_TOKEN}` }
      });

      const now = new Date();
      const activeSession = res.data.find(session => {
        if (session.status !== 'active') return false;
        const end = session.endTime ? new Date(session.endTime) : null;
        if (end && now > end) return false;
        return true;
      });

      // If no session is active
      if (!activeSession) {
        console.log(' No active session. Agent paused.');
        return;
      }

      const blockedApps = activeSession.blockedApps || [];
      if (blockedApps.length === 0) return;

      const runningApps = await psList();
      const runningNames = runningApps.map(p => p.name.toLowerCase());

      blockedApps.forEach(app => {
        if (runningNames.includes(app.toLowerCase())) {
          killApp(app);
        }
      });

    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('Agent error:', msg);

      if (err.response?.status === 401) {
        console.log(' Unauthorized token. Logging out.');
        if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
        clearInterval(intervalId);
        process.exit(0);
      }
    }
  }, pollInterval);
};

// Entry point
(async () => {
  const tokenLoaded = loadToken();
  if (!tokenLoaded) {
    console.log(' Token not found. Please log in from the frontend first.');
    process.exit(1);
  }

  await startMonitor();
})();