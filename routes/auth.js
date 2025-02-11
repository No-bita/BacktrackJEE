const express = require("express");
const passport = require("passport");
const User = require("../models/user");
require("dotenv").config();
const userController = require('../controllers/userController');
const { registerValidation } = require('../middleware/validation');
const authenticateUser = require('../middleware/authmiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// ✅ Debugging Middleware
router.use((req, res, next) => {
    console.log(`🛠 Auth Route: ${req.method} ${req.originalUrl}`);
    next();
});

// 🟢 Local Authentication Routes
router.post("/register", [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password
        });

        // Save user
        await user.save();

        // Return user data (excluding password)
        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Profile Routes
router.get('/profile', authenticateUser, userController.getProfile);
router.put('/profile', authenticateUser, userController.updateProfile);

router.post("/login", (req, res, next) => {
    console.log("🔍 Login attempt for:", req.body.email);
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.error("❌ Error in login:", err);
            return next(err);
        }

        if (!user) {
            console.log("❌ Invalid credentials:", info);
            return res.status(401).json({ error: info.message || "Invalid credentials" });
        }

        req.login(user, (err) => {
            if (err) return next(err);
            console.log("✅ User logged in:", user.email);
            res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
        });
    })(req, res, next);
});

router.get("/logout", (req, res) => {
    console.log("🔍 Processing logout");
    req.session.destroy((err) => {
        if (err) {
            console.error("❌ Logout error:", err);
            return res.status(500).json({ error: "Logout failed" });
        }
        
        res.clearCookie("connect.sid");
        console.log("✅ Logout successful");
        res.json({ message: "Logged out successfully" });
    });
});

// 🟢 Google OAuth Routes
router.get("/google", 
    (req, res, next) => {
        console.log("🔵 Starting Google OAuth flow");
        // Store the return path if provided
        if (req.query.returnTo) {
            req.session.returnTo = req.query.returnTo;
            console.log("📌 Storing return path:", req.query.returnTo);
        }
        next();
    },
    passport.authenticate("google", { 
        scope: ["profile", "email"],
        prompt: "select_account",
        accessType: "offline" // Request refresh token
    })
);

// 🟢 Google Callback Route
router.get("/google/callback",
    passport.authenticate('google', { 
        failureRedirect: '/login',
        failureMessage: true
    }),
    async (req, res, next) => {
        try {
            const { id, displayName, emails } = req.user;
            
            // Find or create user
            let user = await User.findOne({ 
                $or: [
                    { googleId: id },
                    { email: emails[0].value }
                ]
            });

            if (!user) {
                // Create new user if doesn't exist
                user = await User.create({
                    googleId: id,
                    name: displayName,
                    email: emails[0].value,
                    isVerified: true // Google OAuth users are automatically verified
                });
            } else if (!user.googleId) {
                // If user exists but doesn't have googleId
                user.googleId = id;
                await user.save();
            }

            // Log in the user
            req.login(user, (err) => {
                if (err) return next(err);
                
                const redirectUrl = req.session.returnTo || '/dashboard';
                delete req.session.returnTo;

                const fullRedirectUrl = process.env.NODE_ENV === 'development'
                    ? `http://localhost:3000${redirectUrl}`
                    : `${process.env.CLIENT_URL}${redirectUrl}`;

                res.redirect(fullRedirectUrl);
            });
        } catch (error) {
            next(error);
        }
    }
);

// 🟢 Auth Status Check
router.get("/status", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("✅ User is authenticated:", req.user.email);
        return res.json({ 
            isAuthenticated: true, 
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    }
    console.log("❌ User is not authenticated");
    res.json({ isAuthenticated: false });
});

// 🟢 Error handling middleware
router.use((err, req, res, next) => {
    console.error("❌ Auth error:", err);
    res.status(500).json({ 
        error: "Authentication error occurred",
        message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

module.exports = router;