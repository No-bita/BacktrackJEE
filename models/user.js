const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Stored in plaintext
    googleId: { type: String }, // Optional for Google OAuth
    createdAt: { type: Date, default: Date.now }
});

const express = require('express');
const User = require('../models/user');
const authenticateUser = require('../middleware/authmiddleware');

const router = express.Router();

// ✅ Fetch User Details (Protected Route)
router.get('/profile', authenticateUser, async (req, res) => {
    const user = await User.findById(req.user.userId).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
});

module.exports = router;

module.exports = mongoose.model('User', UserSchema);
