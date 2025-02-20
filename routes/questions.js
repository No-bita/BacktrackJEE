import express from "express";
import mongoose from "mongoose";
import QuestionSchema from "../models/Question.js"; // ✅ Ensure file extension `.js`

const router = express.Router();

// ✅ Route to fetch questions based on year and slot
router.get("/", async (req, res) => {
  try {
    const { year, slot } = req.query;

    if (!year || !slot) {
      return res.status(400).json({ message: "Year and Slot parameters are required." });
    }

    const formattedSlot = slot.trim().replace(/\s+/g, "_"); // ✅ Trim and replace spaces with underscores

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "MongoDB is not connected." });
    }

    // ✅ Cache the model if it already exists
    const QuestionModel =
      mongoose.models[formattedSlot] ||
      mongoose.model(formattedSlot, new mongoose.Schema(QuestionSchema.obj), formattedSlot);

    const questions = await QuestionModel.find({}).lean(); // ✅ Use `.lean()` for better performance

    if (!questions.length) {
      return res.status(404).json({ message: "No questions found for this slot." });
    }

    res.json(questions);
  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

export default router;
