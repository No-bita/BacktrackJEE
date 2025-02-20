import User from "../models/user.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// ✅ Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
};

// ✅ User Controller
const userController = {
    // 🟢 Register new user (JWT-based)
    register: async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, password } = req.body;

            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({
                    error: "User already exists with this email"
                });
            }

            // Create new user
            user = new User({ name, email, password });
            await user.save();

            // Generate JWT token
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
            res.status(500).json({
                error: "Server error during registration"
            });
        }
    },

    // 🟢 Get Profile (Protected)
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select("-password");
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json(user);
        } catch (error) {
            console.error("Error fetching profile:", error);
            res.status(500).json({ error: "Server error" });
        }
    },

    // 🟢 Update Profile (Protected)
    updateProfile: async (req, res) => {
        try {
            const { name } = req.body;
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { name },
                { new: true }
            ).select("-password");

            res.json(updatedUser);
        } catch (error) {
            console.error("Profile update error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
};

export default userController; // ✅ Use ES module export
