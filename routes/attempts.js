const express = require("express");
const authMiddleware = require("../middleware/authmiddleware");
const { submitExam, getExamResults, startAttempt } = require("../controllers/attemptController");

const router = express.Router();

// ✅ Start a New Attempt
router.post("/start", authMiddleware, startAttempt);

// ✅ Submit an Attempt
router.post("/submit", authMiddleware, attemptController.submitExam);

// ✅ Fetch Exam Results
router.post("/results", authMiddleware, getExamResults);

module.exports = router;
