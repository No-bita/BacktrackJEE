const express = require("express");
const attemptController = require("../controllers/attemptController");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

// ✅ Start a New Attempt
router.post("/start", authMiddleware, attemptController.startAttempt);

// ✅ Submit an Attempt
router.post("/attempts/submit", authMiddleware, attemptController.submitExam);

// ✅ Fetch Exam Results
router.post("/results", authMiddleware, attemptController.getExamResults);

module.exports = router;
