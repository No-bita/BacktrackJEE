const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const QuestionSchema = require("../models/Question"); // ✅ Import Mongoose model

// ✅ Hardcoded years and slots
const years = ["2024"];
const slots = {
  "2024": [
    "Jan 27 Shift 1", "Jan 27 Shift 2", "Jan 29 Shift 1", "Jan 29 Shift 2",
    "Jan 30 Shift 1", "Jan 30 Shift 2", "Jan 31 Shift 1", "Jan 31 Shift 2",
    "Feb 1 Shift 1", "Feb 1 Shift 2", "Apr 04 Shift 1", "Apr 04 Shift 2",
    "Apr 05 Shift 1", "Apr 05 Shift 2", "Apr 06 Shift 1", "Apr 06 Shift 2",
    "Apr 08 Shift 1", "Apr 08 Shift 2", "Apr 09 Shift 1", "Apr 09 Shift 2"
  ]
};

// ✅ Route to fetch questions based on year and slot
router.get("/", async (req, res) => {
  try {
    const { year, slot } = req.query;
    console.log(`🔍 Received request for year: ${year}, slot: ${slot}`);

    if (!year || !slot) {
      return res.status(400).json({ message: "Year and Slot parameters are required." });
    }

    const formattedSlot = slot.replace(/\s+/g, "_"); // ✅ Replace spaces with underscores
    console.log(`📂 Searching in MongoDB collection: ${formattedSlot}`);
    
    // ✅ Ensure MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB is NOT connected!");
      return res.status(500).json({ message: "MongoDB is not connected." });
    }


    const QuestionModel =
    mongoose.models[formattedSlot] || mongoose.model(formattedSlot, new mongoose.Schema(QuestionSchema.obj), formattedSlot);

    const questions = await QuestionModel.find({});
    
    console.log(`📋 Found ${questions.length} questions in ${slot}`);

    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found for this slot." });
    }

    res.json(questions);
  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// ✅ Route to fetch available years
router.get("/years", (req, res) => {
  try {
    if (!years.length) {
      return res.status(404).json({ message: "No years available" });
    }
    res.json(years);
  } catch (err) {
    console.error("❌ Error fetching years:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// ✅ Route to fetch available slots for a selected year
router.get("/slots", (req, res) => {
  const { year } = req.query;
  console.log(`📅 Requested year: ${year}`);

  if (!year) {
    return res.status(400).json({ message: "Year is required" });
  }

  if (!slots[year]) {
    return res.status(400).json({ message: `Invalid year: ${year}. No slots available.` });
  }

  try {
    res.json(slots[year]);
  } catch (err) {
    console.error("❌ Error fetching slots:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
