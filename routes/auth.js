const express = require("express");
const passport = require("passport");
const User = require("../models/user");
require("dotenv").config();

const router = express.Router();

// ✅ Debugging Middleware
router.use((req, res, next) => {
    console.log(`🛠 Auth Route: ${req.method} ${req.originalUrl}`);
    next();
});

// 🟢 Local Authentication Routes
router.post("/register", async (req, res, next) => {
    try {
        console.log("🔍 Registering user:", req.body.email);
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("❌ Email already registered:", email);
            return res.status(400).json({ error: "Email already registered" });
        }

        // Create user
        const user = await User.create({ name, email, password });

        req.login(user, (err) => {
            if (err) return next(err);
            console.log("✅ User registered and logged in:", user.email);
            res.json({ user: { id: user._id, name: user.name, email: user.email } });
        });
    } catch (error) {
        console.error("❌ Registration error:", error);
        next(error);
    }
});

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
    (req, res, next) => {
        console.log("🔵 Received Google callback");
        next();
    },
    passport.authenticate("google", { 
        failureRedirect: "/login",
        failureMessage: true,
        session: true
    }),
    (req, res, next) => {
        try {
            console.log("✅ Google authentication successful");
            
            if (!req.user) {
                console.error("❌ No user found after Google auth");
                return res.redirect("/login?error=Authentication failed");
            }

            const redirectUrl = req.session.returnTo || "/dashboard";
            delete req.session.returnTo;

            // Ensure proper redirect URL construction
            const fullRedirectUrl = process.env.NODE_ENV === "development"
                ? `http://localhost:3000${redirectUrl}`
                : `${process.env.CLIENT_URL}${redirectUrl}`;

            console.log(`🔄 Redirecting to: ${fullRedirectUrl}`);
            res.redirect(fullRedirectUrl);
        } catch (error) {
            console.error("❌ Error in Google callback:", error);
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