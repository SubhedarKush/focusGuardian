    const express = require('express');
    const protect = require("../middlewares/authMiddleware.js");
    const router = express.Router();
    const { register, login } = require("./../controllers/authcontroller.js");

    // @route   POST /api/auth/register
    router.post('/register', register);

    // @route   POST /api/auth/login
    router.post('/login', login);

    router.get('/me', protect, (req, res) => {
    res.json({
        message: 'You are authorized!',
        user: req.user
    });
    });

    module.exports = router;
