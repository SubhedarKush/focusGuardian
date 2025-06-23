import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ✅ FIXED API URLs - backend runs on port 8000, agent routes on same server
const API = 'http://localhost:8000';
const AGENT_API = 'http://localhost:8000';

const App = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('focus_token') || '');
  const [username, setUsername] = useState(localStorage.getItem('focus_username') || '');
  const [totalHours, setTotalHours] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');

  const [timerMinutes, setTimerMinutes] = useState(25);
  const [remainingTime, setRemainingTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Fetch user profile to get username
  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsername(res.data.name || res.data.email.split('@')[0]);
    } catch (error) {
      console.error('Failed to fetch user profile:', error.response?.data?.message || error.message);
    }
  };

  // Countdown logic
  useEffect(() => {
    if (!isRunning || remainingTime <= 0) return;
    const interval = setTimeout(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(interval);
  }, [isRunning, remainingTime]);

  // Auto-stop when timer hits 0
  useEffect(() => {
    if (remainingTime === 0 && isRunning) {
      stopSession();
    }
  }, [remainingTime]);

  // Fetch user profile when token changes
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleLogin = async () => {
    if (!email || !password) return alert("Please enter email and password");
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      const userToken = res.data.token;
      localStorage.setItem('focus_token', userToken);
      setToken(userToken);
      
      // Set username from response or fallback to email
      const userName = res.data.user?.name || res.data.name || email.split('@')[0];
      setUsername(userName);
      localStorage.setItem('focus_username', userName);
      
      // ✅ FIXED AGENT API CALL - added /api/agent prefix
      await axios.post(`${AGENT_API}/api/agent/save-token`, { token: userToken });
    } catch (error) {
      console.error('Login error:', error.response?.data?.message || error.message);
      alert('Login failed: ' + (error.response?.data?.message || 'Network error'));
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) return alert("Please fill all fields");
    try {
      const res = await axios.post(`${API}/api/auth/register`, { name, email, password });
      const userToken = res.data.token;
      localStorage.setItem('focus_token', userToken);
      setToken(userToken);
      
      // Set username from response or fallback to name entered
      const userName = res.data.user?.name || res.data.name || name;
      setUsername(userName);
      localStorage.setItem('focus_username', userName);
      
      // ✅ FIXED AGENT API CALL - added /api/agent prefix
      await axios.post(`${AGENT_API}/api/agent/save-token`, { token: userToken });
    } catch (error) {
      console.error('Signup error:', error.response?.data?.message || error.message);
      alert('Signup failed: ' + (error.response?.data?.message || 'Network error'));
    }
  };

 const startSession = async () => {
  try {
    const res = await axios.post(`${API}/api/focus-sessions`, {
      startTime: new Date(),
      endTime: new Date(Date.now() + timerMinutes * 60 * 1000),
      blockedApps: ['chrome.exe', 'YouTube', 'Instagram']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setSessionId(res.data._id);
    setRemainingTime(timerMinutes * 60);
    setIsRunning(true);

    // ✅ ADD THIS: Start the agent after creating the session
    await axios.post(`${AGENT_API}/api/agent/start-agent`, {
      blockedApps: ['chrome.exe', 'YouTube', 'Instagram'],
      sessionId: res.data._id
      // Add any other data your agent needs
    });

  } catch (err) {
    console.error('Failed to start session:', err.response?.data?.message || err.message);
    alert('Could not start session: ' + (err.response?.data?.message || 'Network error'));
  }
};

  const stopSession = async () => {
    try {
      if (sessionId) {
        await axios.patch(`${API}/api/focus-sessions/${sessionId}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // ✅ FIXED AGENT API CALL - added /api/agent prefix
      await axios.get(`${AGENT_API}/api/agent/kill-agent`);
    } catch (err) {
      console.error('Stop session failed:', err.response?.data?.message || err.message);
    } finally {
      setIsRunning(false);
      setSessionId(null);
      setRemainingTime(timerMinutes * 60);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('focus_token');
      localStorage.removeItem('focus_username');
      setToken('');
      setUsername('');
      await stopSession();
      
      // ✅ FIXED AGENT API CALL - changed to DELETE and added /api/agent prefix
      await axios.delete(`${AGENT_API}/api/agent/delete-token`);
    } catch (err) {
      console.error("Logout failed:", err.response?.data?.message || err.message);
    }
  };

 const fetchStats = () => {
  if (!token) return;

  // ✅ Use real-time stats instead of total-time
  axios.get(`${API}/api/focus-sessions/stats/realtime`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => {
    setTotalHours(res.data.totalHours);
  }).catch((error) => {
    console.error('Failed to fetch real-time stats:', error.response?.data?.message || error.message);
    // Don't reset totalHours on error
  });

  axios.get(`${API}/api/violations`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => setViolations(res.data))
    .catch((error) => {
      console.error('Failed to fetch violations:', error.response?.data?.message || error.message);
      // Don't clear violations on error
    });
};

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col justify-center items-center">
        <div className="text-4xl font-bold mb-2">FocusGuardian</div>
        <p className="text-sm text-gray-400 mb-8">Take control of your digital focus</p>

        <div className="bg-slate-800 p-6 rounded-lg w-96">
          <div className="flex mb-4">
            <button onClick={() => setIsLogin(true)} className={`flex-1 p-2 rounded-l ${isLogin ? 'bg-blue-500' : 'bg-slate-700'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 p-2 rounded-r ${!isLogin ? 'bg-blue-500' : 'bg-slate-700'}`}>Sign Up</button>
          </div>
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              className="w-full mb-3 p-2 rounded bg-slate-700 text-white"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 p-2 rounded bg-slate-700 text-white"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 p-2 rounded bg-slate-700 text-white"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button onClick={isLogin ? handleLogin : handleSignup} className="w-full bg-blue-600 p-2 rounded font-semibold">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navbar */}
      <nav className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-blue-400">FocusGuardian</h1>
            <span className="text-gray-300">Welcome, {username}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 pt-8">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 p-4 rounded shadow">
            <p className="text-gray-400">Total Focus Time</p>
            <p className="text-2xl font-semibold">{totalHours} hrs</p>
          </div>

          <div className="bg-slate-800 p-4 rounded shadow max-h-64 overflow-y-auto">
            <p className="text-gray-400">Blocked Attempts</p>
            <ul className="list-disc pl-4">
              {violations.map((v, i) => (
                <li key={i}>{v.appName} at {new Date(v.timestamp).toLocaleTimeString()}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-72 h-72 rounded-full border-8 border-blue-500 flex items-center justify-center text-4xl font-bold mb-4">
            {formatTime(remainingTime)}
          </div>

          <select
            disabled={isRunning}
            value={timerMinutes}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setTimerMinutes(val);
              setRemainingTime(val * 60);
            }}
            className="mb-4 p-2 rounded bg-slate-700 text-white"
          >
            {[10, 15, 20, 25, 30, 45, 60].map(min => (
              <option key={min} value={min}>{min} minutes</option>
            ))}
          </select>

          <div className="flex gap-4">
            {!isRunning ? (
              <button onClick={startSession} className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700">Start</button>
            ) : (
              <button onClick={stopSession} className="bg-red-500 px-6 py-2 rounded hover:bg-red-600">Stop</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 