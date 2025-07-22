const express = require('express');
const connectDB = require('./db/db');
const cors = require('cors');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json()); // for parsing JSON

//  Use Auth Routes
app.use('/api/auth', require('./routes/authRoutes.js'));

app.get('/', (req, res) => {
  res.send('FocusGuardian Backend is running...');
});

app.use('/api/user', require("./routes/authRoutes.js")); 

app.use('/api/focus-sessions', require('./routes/focusSessionRoute.js'));

const violationRoutes = require("./routes/violations.js");
app.use('/api/violations', violationRoutes);


app.use('/api/agent', require("../agent/agentRoutes.js"));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
