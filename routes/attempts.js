import express from "express";
import mongoose from "mongoose";
import authMiddleware from "../middleware/authmiddleware.js"; // ✅ Ensure file extension `.js`;
import Attempt from "../models/Attempt.js"

const router = express.Router();

// ✅ API to save user attempts
router.post("/save-attempt", authMiddleware, async (req, res) => {
    try {
        const { user_id, user_name, year, slot, answers } = req.body;

        if (!user_id || !year || !slot || !answers) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // ✅ Save attempt in MongoDB
        const attemptRecord = new Attempt({ user_id, user_name, year, slot, answers });
        await attemptRecord.save();

        return res.status(201).json({ message: "Attempt saved successfully" });
    } catch (error) {
        console.error("Error saving attempt:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router; // ✅ Use ES Modules export
