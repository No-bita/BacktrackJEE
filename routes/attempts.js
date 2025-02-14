const express = require("express");
const attemptController = require("../controllers/attemptController");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

// ✅ Start a New Attempt
router.post("/start", authMiddleware, startAttempt);

// ✅ Submit an Attempt
router.post("/submit", authMiddleware, attemptController.submitExam);

// ✅ Fetch Exam Results
router.post("/results", authMiddleware, getExamResults);

module.exports = router;
