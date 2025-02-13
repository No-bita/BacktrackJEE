const express = require("express");
const StudentResponse = require("../models/Attempt");
const Exam = require("../models/exam");
const Question = require("../models/Question");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

// ✅ Submit All Answers for the Exam
router.post("/submit", authMiddleware, async (req, res) => {
    try {
        const { examId, answers, timeTaken } = req.body;

        // ✅ Check if the request is valid
        if (!examId || !answers || Object.keys(answers).length === 0) {
            return res.status(400).json({ error: "Exam ID and answers are required" });
        }

        // ✅ Check if exam exists
        const exam = await Exam.findById(examId).populate("questions");
        if (!exam) {
            return res.status(404).json({ error: "Exam not found" });
        }

        // ✅ Prevent duplicate submissions (Check if user already submitted)
        const existingSubmission = await StudentResponse.findOne({
            studentId: req.user.id,
            examId,
        });

        if (existingSubmission) {
            return res.status(400).json({ error: "You have already submitted this exam" });
        }

        // ✅ Fetch only valid questions from the exam
        const validQuestionIds = exam.questions.map(q => q._id.toString());
        let formattedResponses = [];
        let totalCorrect = 0;

        for (const question of exam.questions) {
            const selectedOption = answers[question._id];

            // ✅ Ignore responses for non-existing questions
            if (!validQuestionIds.includes(question._id.toString())) continue;

            const isCorrect = String(selectedOption) === String(question.correct_option);
            if (isCorrect) totalCorrect++;

            formattedResponses.push({
                questionId: question._id,
                selectedOption,
                correctOption: question.correct_option || null,
                isCorrect,
                timeTaken: timeTaken ? timeTaken[question._id] || null : null
            });
        }

        // ✅ Store responses in DB
        const studentResponse = new StudentResponse({
            studentId: req.user.id,
            examId,
            responses: formattedResponses,
            submittedAt: new Date(),
            totalScore: totalCorrect * 4 - (exam.questions.length - totalCorrect) * 1,
        });

        await studentResponse.save();

        res.json({
            success: true,
            message: "Exam submitted successfully",
            totalQuestions: exam.questions.length,
            correctAnswers: totalCorrect,
            score: studentResponse.totalScore
        });

    } catch (error) {
        console.error("Error submitting exam:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Fetch Student's Submitted Responses
router.get("/responses/:examId", authMiddleware, async (req, res) => {
    try {
        const studentResponses = await StudentResponse.findOne({
            studentId: req.user.id,
            examId: req.params.examId
        }).populate("responses.questionId");

        if (!studentResponses) {
            return res.status(404).json({ error: "No responses found for this exam" });
        }

        res.json({ success: true, responses: studentResponses });
    } catch (error) {
        console.error("Error fetching responses:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
