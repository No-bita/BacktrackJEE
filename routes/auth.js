import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";
import User from "../models/user.js"; // ✅ Ensure file extension `.js`
import userController from "../controllers/userController.js"; // ✅ Ensure file extension `.js`
import authenticateUser from "../middleware/authmiddleware.js"; // ✅ Ensure file extension `.js`

dotenv.config();

const router = express.Router();

// ✅ Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "4h" } // Token expires in 4 hours
    );
};

// ✅ GET Profile (Protected Route)
router.get("/profile", authenticateUser, userController.getProfile);

// ✅ User Registration (with JWT)
router.post(
    "/register",
    [
        body("name").notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Please enter a valid email").normalizeEmail(),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, password } = req.body;

            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ error: "User already exists with this email" });
            }

            user = new User({ name, email, password });
            await user.save();

            const token = generateToken(user);

            res.status(201).json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ error: "Server error during registration" });
        }
    }
);

// ✅ User Login (with JWT)
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Please enter a valid email").normalizeEmail(),
        body("password").notEmpty().withMessage("Password is required")
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            // Since password hashing is disabled, we are directly checking passwords
            if (password !== user.password) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const token = generateToken(user);

            res.json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ error: "Server error during login" });
        }
    }
);

// ✅ Logout (Handled on the frontend by deleting token)
router.post("/logout", (req, res) => {
    res.json({ message: "Logout successful (Clear token from frontend)" });
});

// ✅ Authentication Status Check
router.get("/status", (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.json({ isAuthenticated: false });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ isAuthenticated: true, user: decoded });
    } catch (error) {
        console.error("🔴 Token Verification Error:", error.message);
        res.json({ isAuthenticated: false, error: error.message });
    }
});

export default router; // ✅ Use ES Modules export