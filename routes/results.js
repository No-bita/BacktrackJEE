const express = require('express');
const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const authenticateUser = require('../middleware/authmiddleware');

const router = express.Router();

// 🧠 Calculate Exam Results with Negative Marking
router.get('/calculate', authenticateUser, async (req, res) => {
    const { user_id, year, slot } = req.query;

    if (!user_id || !year || !slot) {
        return res.status(400).json({ error: "Missing parameters: user_id, year, slot" });
    }

    try {
        // 1️⃣ Fetch the user's attempt
        const attempt = await Attempt.findOne({ user_id, year, slot });
        if (!attempt) {
            return res.status(404).json({ error: "Attempt not found" });
        }

        const userAnswers = attempt.answers;

        // 2️⃣ Fetch the correct answers for these questions
        const questionIds = Object.keys(userAnswers);
        const questions = await Question.find({ _id: { $in: questionIds } });

        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;
        let totalMarks = 0;

        // 3️⃣ Calculate the results
        const detailedResults = questions.map((question) => {
            const userAnswer = userAnswers[question._id.toString()];
            const correctOption = question.correct_option;

            // Evaluate answer
            let status;
            if (userAnswer === null || userAnswer === undefined) {
                status = 'unattempted';
                unattempted++;
            } else if (userAnswer === correctOption) {
                status = 'correct';
                correct++;
                totalMarks += 4; // +4 for correct
            } else {
                status = 'incorrect';
                incorrect++;
                totalMarks -= 1; // -1 for incorrect
            }

            return {
                question_id: question._id,
                question_text: question.question_text,
                user_answer: userAnswer,
                correct_answer: correctOption,
                status
            };
        });

        // 4️⃣ Prepare final result summary
        const resultSummary = {
            total_questions: questions.length,
            correct,
            incorrect,
            unattempted,
            total_marks: totalMarks,
            answers: detailedResults
        };

        res.json(resultSummary);
    } catch (error) {
        console.error("Error calculating results:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
