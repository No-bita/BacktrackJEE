const express = require('express');
const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const authenticateUser = require('../middleware/authmiddleware');

const router = express.Router();

// 🧠 Calculate Exam Results with Negative Marking
router.get('/calculate', authenticateUser, async (req, res) => {
    const { user_id, year, slot } = req.query;

    if (!user_id || !year || !slot) {
        return res.status(400).json({ error: "Missing parameters: user_id, year, slot" });
    }

    const decodedSlot = decodeURIComponent(slot).trim();

    try {
        // 1️⃣ Fetch the user's attempt
        const attempt = await Attempt.findOne({ user_id, year, slot: decodedSlot });
        if (!attempt) {
            return res.status(404).json({ error: "Attempt not found" });
        }

        const answers = attempt.answers;
        const totalQuestions = Object.keys(answers).length;

        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;
        let totalMarks = 0;

        const detailedResults = await Promise.all(
            Object.entries(answers).map(async ([questionId, userAnswer]) => {
                // Dynamically determine the correct collection based on the year and slot
                const collectionName = `${year}_${slot.replace(/\s+/g, "_")}_questions`.toLowerCase();

                // Dynamically create a Mongoose model
                const QuestionModel = mongoose.models[collectionName] || mongoose.model(collectionName, new mongoose.Schema({}, { strict: false, collection: collectionName }));

                // Fetch the correct question document
                const question = await QuestionModel.findById(questionId);

                if (!question) {
                    return {
                        question_id: questionId,
                        question_text: "Question not found",
                        user_answer: userAnswer,
                        correct_answer: "Unknown",
                        status: "error"
                    };
                }

                const correctAnswer = question.correct_option;

                // Calculate the status based on user response
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
                    question_text: question.question_text,
                    user_answer: userAnswer,
                    correct_answer: correctAnswer,
                    status
                };
            })
        );

        // 4️⃣ Prepare the final result summary
        const resultSummary = {
            user_id: attempt.user_id,
            user_name: attempt.user_name,
            year: attempt.year,
            slot: attempt.slot,
            total_questions: totalQuestions,
            correct,
            incorrect,
            unattempted,
            total_marks: totalMarks,
            answers: detailedResults
        };

        res.json(resultSummary);
    } catch (error) {
        console.error("❌ Error calculating results:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
