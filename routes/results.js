import express from "express";
import mongoose from "mongoose";
import Attempt from "../models/Attempt.js"; // ✅ Ensure file extension `.js`
import authenticateUser from "../middleware/authmiddleware.js"; // ✅ Ensure file extension `.js`

const router = express.Router();

// 🧠 Calculate Exam Results with Negative Marking
router.get("/calculate", authenticateUser, async (req, res) => {
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

        const questions = await QuestionModel.find({});
        const totalQuestions = questions.length;

        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;
        let totalMarks = 0;

        // 4️⃣ Process each question from the database
        const detailedResults = questions.map((question) => {
            const questionId = question._id.toString();
            const correctAnswer = question.correct_option;
            const userAnswer = answers?.get(questionId) ?? null;

            let status;

            if (userAnswer === null || userAnswer === undefined || userAnswer === "") {
                status = "unattempted";
                unattempted++;
            } else if (parseInt(userAnswer) === parseInt(correctAnswer)) {
                status = "correct";
                correct++;
                totalMarks += 4;
            } else {
                status = "incorrect";
                incorrect++;
                totalMarks -= 1;
            }

            return {
                question_id: question._id,
                user_answer: userAnswer,
                correct_answer: correctAnswer,
                status,
            };
        });

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
            answers: detailedResults,
        };

        res.json(resultSummary);
    } catch (error) {
        console.error("❌ Error calculating results:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router; // ✅ Use ES Modules export
