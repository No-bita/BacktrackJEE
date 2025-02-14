const express = require("express");
const Attempt = require("../models/Attempt");
const Exam = require("../models/exam");
const Question = require("../models/Question");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

// ✅ Submit an Attempt (Using year & slot)
router.post("/api/exam/submit", authMiddleware, async (req, res) => {
    try {
        const { year, slot, answers } = req.body;
        const userId = req.user.id;

        if (!year || !slot || !answers) {
            return res.status(400).json({ error: "Year, slot, and answers are required." });
        }

        // ✅ Find Exam based on year & slot
        const exam = await Exam.findOne({ year, slot }).populate("questions");
        if (!exam) {
            return res.status(404).json({ error: "Exam not found." });
        }

        let totalMarks = 0, correctAnswers = 0, incorrectAnswers = 0, attemptedQuestions = 0;
        let responses = [];

        // ✅ Process each question and evaluate answers
        exam.questions.forEach(q => {
            const selected = answers[q._id] ? Number(answers[q._id]) : null;
            let isCorrect = false, marksObtained = 0;

            if (selected !== null) {
                attemptedQuestions++;
                isCorrect = selected === q.correctOption;

                if (isCorrect) {
                    correctAnswers++;
                    marksObtained = 4; // ✅ +4 for correct answer
                    totalMarks += 4;
                } else {
                    incorrectAnswers++;
                    marksObtained = -1; // ❌ -1 for incorrect answer
                    totalMarks -= 1;
                }
            }

            responses.push({
                question: q._id,
                selectedOption: selected,
                correctOption: q.correctOption,
                isCorrect,
                marksObtained
            });
        });

        // ✅ Save Attempt
        const attempt = new Attempt({
            user: userId,
            exam: exam._id,
            responses,
            totalQuestions: exam.questions.length,
            attemptedQuestions,
            correctAnswers,
            incorrectAnswers,
            totalMarks: Math.max(0, totalMarks), // Prevent negative marks
            startTime: new Date(), // Store start time (ensure it was recorded in frontend)
            endTime: new Date(), // Mark submission time
            status: "COMPLETED",
            timeAlloted: 180 // Assume 180 minutes (3 hours)
        });

        await attempt.save();

        // ✅ Send response back to frontend
        res.json({
            message: "✅ Exam submitted successfully",
            score: attempt.totalMarks,
            correct: attempt.correctAnswers,
            incorrect: attempt.incorrectAnswers,
            skipped: attempt.totalQuestions - attempt.attemptedQuestions,
            attempt
        });

    } catch (error) {
        console.error("Error submitting attempt:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
