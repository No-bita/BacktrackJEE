const express = require('express');
const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const authenticateUser = require('../middleware/authmiddleware');

const router = express.Router();

// 🧠 Calculate Exam Results with Negative Marking
router.get('/calculate', authenticateUser, async (req, res) => {
    const { user, year, slot } = req.query;

    if (!user || !year || !slot) {
        return res.status(400).json({ error: "Missing parameters: user, year, slot" });
    }

    try {
        // 1️⃣ Fetch the user's attempt
        const attempt = await Attempt.findOne({ user, year, slot }).populate('responses.question');
        if (!attempt) {
            return res.status(404).json({ error: "Attempt not found" });
        }

        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;
        let totalMarks = 0;

        // 2️⃣ Calculate the results
        const detailedResults = attempt.responses.map((response) => {
            const question = response.question;
            const userAnswer = response.selectedOption;
            const correctAnswer = response.correctOption;

            let status;
            if (userAnswer === null || userAnswer === undefined) {
                status = 'unattempted';
                unattempted++;
            } else if (userAnswer === correctAnswer) {
                status = 'correct';
                correct++;
                totalMarks += 4;
            } else {
                status = 'incorrect';
                incorrect++;
                totalMarks -= 1;
            }

            return {
                question_id: question._id,
                question_text: question.questionText,
                user_answer: userAnswer,
                correct_answer: correctAnswer,
                status
            };
        });

        // 3️⃣ Ensure totalMarks is non-negative
        totalMarks = Math.max(0, totalMarks);

        // 4️⃣ Prepare final result summary
        const resultSummary = {
            user: attempt.user,
            year: attempt.year,
            slot: attempt.slot,
            total_questions: attempt.responses.length,
            correct,
            incorrect,
            unattempted,
            total_marks: totalMarks,
            accuracy: `${((correct / attempt.responses.length) * 100).toFixed(2)}%`,
            answers: detailedResults
        };

        res.json(resultSummary);
    } catch (error) {
        console.error("❌ Error calculating results:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
