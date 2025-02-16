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
        // Dynamically determine the correct collection
        const collectionName = `${slot.replace(/\s+/g, "_")}`;
        let QuestionModel;
        if (mongoose.models[collectionName]) {
            QuestionModel = mongoose.models[collectionName];
        } else {
            QuestionModel = mongoose.model(collectionName, new mongoose.Schema({}, { strict: false, collection: collectionName }));
        }

        // Get total question count directly from the Questions collection
        const totalQuestions = await QuestionModel.countDocuments({});


        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;
        let totalMarks = 0;

        // 2️⃣ Process each answer using Map.entries()
        const detailedResults = await Promise.all(
            Array.from(answers.entries()).map(async ([questionId, userAnswer]) => {
                try {
                    // Validate and convert questionId to ObjectId
                    if (!mongoose.Types.ObjectId.isValid(questionId)) {
                        throw new Error(`Invalid ObjectId: ${questionId}`);
                    }
                    const objectId = new mongoose.Types.ObjectId(questionId);

                    // Dynamically determine the correct collection
                    const collectionName = `${slot.replace(/\s+/g, "_")}`;
                    const QuestionModel = mongoose.models[collectionName] || mongoose.model(collectionName, new mongoose.Schema({}, { strict: false, collection: collectionName }));

                    // Fetch the question document
                    const question = await QuestionModel.findById(objectId);
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

                    // Calculate status with type-based validation
                    let status;

                    // Normalize user answer (handle whitespace)
                    const normalizedAnswer = userAnswer;

                    // Fetch question type (MCQ or INTEGER)
                    const questionType = question.type;

                    // Determine valid answer based on question type
                    let isValidAnswer = false;

                    if (questionType === 'MCQ') {
                        // Validate MCQ (1 to 4)
                        isValidAnswer = /^[1-4]$/.test(normalizedAnswer);
                    } else if (questionType === 'INTEGER') {
                        // Validate Integer (-99999 to 99999)
                        isValidAnswer = /^-?\d{1,5}$/.test(normalizedAnswer) && parseInt(normalizedAnswer) >= -99999 && parseInt(normalizedAnswer) <= 99999;
                    }

                    // Apply logic based on validation
                    if (!normalizedAnswer || !isValidAnswer) {
                        // Unattempted if empty, invalid, or non-numeric
                        status = 'unattempted';
                        unattempted++;
                    } else if (parseInt(normalizedAnswer) === correctAnswer) {
                        // Correct answer
                        status = 'correct';
                        correct++;
                        totalMarks += 4;
                    } else {
                        // Incorrect answer
                        status = 'incorrect';
                        incorrect++;
                        totalMarks -= 1;
                    }



                    return {
                        question_id: question._id,
                        question_text: question.question_text || "N/A",
                        user_answer: userAnswer,
                        correct_answer: correctAnswer,
                        status
                    };

                } catch (err) {
                    console.error(`⚠️ Error fetching question for ID ${questionId}:`, err.message);
                    return {
                        question_id: questionId,
                        question_text: "Error retrieving question",
                        user_answer: userAnswer,
                        correct_answer: "Unknown",
                        status: "error"
                    };
                }
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
