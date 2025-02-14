const express = require("express");
const Attempt = require("../models/Attempt");
const Exam = require("../models/exam");
const Question = require("../models/Question");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

// ✅ Submit an Attempt
router.post("/exam/submit", authMiddleware, async (req, res) => {
    try {
        const { examId, answers } = req.body;
        const userId = req.user.id;

        if (!examId || !answers) {
            return res.status(400).json({ error: "Exam ID and answers are required." });
        }

        // ✅ Find Exam
        const exam = await Exam.findById(examId).populate("questions");
        if (!exam) {
            return res.status(404).json({ error: "Exam not found." });
        }

        let responses = [];
        exam.questions.forEach(q => {
            const selected = answers[q._id] ? Number(answers[q._id]) : null;
            responses.push({
                question: q._id,
                selectedOption: selected,
                correctOption: q.correctOption,
                isCorrect: selected === q.correctOption
            });
        });        

        // ✅ Save Attempt
        const attempt = new Attempt({
            user: userId,
            exam: examId,
            responses,
            totalQuestions: exam.questions.length,
            endTime: new Date(),
            timeAlloted: 180 // Assume 180 minutes (3 hours)
        });

        await attempt.save();

        res.json({ message: "Exam submitted successfully", attempt });
    } catch (error) {
        console.error("Error submitting attempt:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Fetch All Attempts for a User
router.get("/history", authMiddleware, async (req, res) => {
    try {
        const attempts = await Attempt.find({ user: req.user.id })
            .populate("exam", "name totalMarks")
            .populate("responses.question", "question correct_option");

        if (!attempts.length) {
            return res.status(404).json({ message: "No past attempts found." });
        }

        res.json(attempts);
    } catch (error) {
        console.error("Error fetching attempt history:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
