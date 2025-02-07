const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require('../config/redisclient');
require('dotenv').config();

const router = express.Router();

// ✅ User Signup (Stores Plaintext Password)
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "Email already registered" });

    // Create new user with plaintext password
    user = new User({ name, email, password });
    await user.save();

    res.json({ message: "Signup successful", userId: user._id });
});

// ✅ User Login (Without Password Hashing)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

    // Store session in Redis (expires in 2 hours)
    await redisClient.setEx(`session:${user._id}`, 7200, JSON.stringify({ token, email }));

    res.json({ message: "Login successful", token });
});

// ✅ User Logout (Deletes Session from Redis)
router.post('/logout', async (req, res) => {
    const { userId } = req.body;
    await redisClient.del(`session:${userId}`);
    res.json({ message: "Logged out successfully!" });
});

module.exports = router;
