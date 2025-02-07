const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

const router = express.Router();

// ✅ User Signup (Stores Plaintext Password)
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "Email already registered" });

        // ✅ Store user with plaintext password
        user = new User({ name, email, password });
        await user.save();

        res.json({ message: "Signup successful", userId: user._id });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ User Login (No Hashing, Direct Password Comparison)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // ✅ Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ User Logout (Just Returns a Success Message)
router.post("/logout", async (req, res) => {
    try {
        res.json({ message: "Logged out successfully!" });
    } catch (error) {
        console.error("❌ Logout Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
