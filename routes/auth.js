const express = require("express");
const passport = require("passport");
const User = require("../models/user");
require("dotenv").config();

const router = express.Router();

// Local Authentication Routes
router.post("/register", async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Create new user
        const user = await User.create({ name, email, password });
        
        // Log the user in after registration
        req.login(user, (err) => {
            if (err) return next(err);
            res.json({ user: { id: user._id, name: user.name, email: user.email } });
        });
    } catch (error) {
        next(error);
    }
});

router.post("/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({ 
                error: info.message || 'Invalid credentials'
            });
        }

        // Log the user in and create a session
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }

            return res.json({ 
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Google OAuth Routes
router.get("/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
    passport.authenticate('google', { 
        failureRedirect: '/login',
        failureMessage: true,
        session: true
    }),
    (req, res, next) => {
        try {
            // Check if authentication was successful
            if (!req.user) {
                return res.redirect('/login?error=Authentication failed');
            }

            // Determine redirect based on user state
            const redirectUrl = req.session.returnTo || '/dashboard';
            delete req.session.returnTo; // Clean up the stored path

            if (process.env.NODE_ENV === 'development') {
                // For development (if your frontend is on a different port)
                res.redirect(`http://localhost:3000${redirectUrl}`);
            } else {
                // For production
                res.redirect(redirectUrl);
            }
        } catch (error) {
            next(error);
        }
    }
);

// Initial route to start Google OAuth - GET method
router.get('/google',
    (req, res, next) => {
        // Store the return path if provided
        if (req.query.returnTo) {
            req.session.returnTo = req.query.returnTo;
        }
        next();
    },
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account' // Always show account selector
    })
);

// Add a failure handler
router.get('/auth-failure', (req, res) => {
    const error = req.session.messages?.pop() || 'Authentication failed';
    res.status(401).json({ 
        error,
        redirectUrl: '/login'
    });
});

// Add route to check authentication status
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
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
    res.json({ isAuthenticated: false });
});

// Error handling middleware
router.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ 
        error: 'Authentication error occurred',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = router;
