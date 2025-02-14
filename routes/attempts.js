const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authmiddleware"); // Ensure user is authenticated

// Define MongoDB schema
const AttemptSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    user_name: { type: String, required: true },
    exam_year: { type: String, required: true },
    exam_slot: { type: String, required: true },
    answers: { type: Object, required: true },
    timestamp: { type: Date, default: Date.now }
});

const AttemptModel = mongoose.model("UserAttempts", AttemptSchema);

// API to save user attempts
router.post("/save-attempt", authMiddleware, async (req, res) => {
    try {
        const { user_id, user_name, exam_year, exam_slot, answers } = req.body;

        if (!user_id || !exam_year || !exam_slot || !answers) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Save attempt in MongoDB
        const attemptRecord = new AttemptModel({ user_id, user_name, exam_year, exam_slot, answers });
        await attemptRecord.save();

        return res.status(201).json({ message: "Attempt saved successfully" });
    } catch (error) {
        console.error("Error saving attempt:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
