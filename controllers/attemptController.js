const Attempt = require("../models/Attempt");
const Exam = require("../models/exam");
const Question = require("../models/Question");

// ✅ Start a New Exam Attempt
exports.startAttempt = async (req, res) => {
    try {
        const { year, slot, totalQuestions, timeAlloted } = req.body;
        const userId = req.user.id;

        if (!year || !slot || !totalQuestions) {
            return res.status(400).json({ error: "Year, slot, and totalQuestions are required." });
        }

        // ✅ Find Exam based on year & slot
        const exam = await Exam.findOne({ year, slot });
        if (!exam) {
            return res.status(404).json({ error: "Exam not found." });
        }

        // ✅ Check Available Questions
        const availableQuestions = await Question.countDocuments({ exam: exam._id });
        if (totalQuestions > availableQuestions) {
            return res.status(400).json({ error: `Only ${availableQuestions} questions are available.` });
        }

        // ✅ Create a New Attempt
        const attempt = new Attempt({
            user: userId,
            exam: exam._id,
            responses: questions.map(q => ({
                question: q._id,
                questionType: q.type
            })),
            totalQuestions,
            timeAlloted,
            startTime: new Date(),
            status: "IN_PROGRESS"
        });

        await attempt.save();

        res.status(201).json({
            message: "✅ Attempt started successfully.",
            attemptId: attempt._id,
            questions
        });

    } catch (error) {
        console.error("Error starting attempt:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Submit Exam
exports.submitExam = async (req, res) => {
    try {
        const { year, slot, answers } = req.body;
        const userId = req.user.id;

        if (!year || !slot || !answers || Object.keys(answers).length === 0) {
            return res.status(400).json({ error: "Year, slot, and at least one answer are required." });
        }

        // ✅ Find Exam
        const exam = await Exam.findOne({ year, slot }).populate("questions");
        if (!exam) {
            return res.status(404).json({ error: "Exam not found." });
        }

        let totalMarks = 0, correctAnswers = 0, incorrectAnswers = 0, attemptedQuestions = 0;
        let responses = [];

        // ✅ Process and Evaluate Answers
        exam.questions.forEach(q => {
            const selected = answers[q._id] ? Number(answers[q._id]) : null;
            let isCorrect = false, marksObtained = 0;

            if (selected !== null) {
                attemptedQuestions++;
                isCorrect = selected === Number(q.correctOption);

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
                correctOption: Number(q.correctOption),
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
            startTime: new Date(),
            endTime: new Date(),
            status: "COMPLETED",
            timeAlloted: 180 // Assume 180 minutes
        });

        await attempt.save();

        res.json({
            message: "✅ Exam submitted successfully.",
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
};

// ✅ Fetch Exam Results
exports.getExamResults = async (req, res) => {
    try {
        const { user_id, year, slot } = req.query.user_id ? req.query : req.body;

        if (!user_id || !year || !slot) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // ✅ Find Exam
        const exam = await Exam.findOne({ year, slot });
        if (!exam) {
            return res.status(404).json({ error: "Exam not found." });
        }

        // ✅ Fetch Attempt
        const attempt = await Attempt.findOne({ user: user_id, exam: exam._id }).populate("responses.question");

        if (!attempt) {
            return res.status(404).json({ error: "No attempt found for this exam." });
        }

        // ✅ Calculate Time Taken
        const timeTaken = attempt.endTime
            ? Math.round((attempt.endTime - attempt.startTime) / (1000 * 60))
            : 0;

        // ✅ Format Review Data
        const reviewData = attempt.responses.map(resp => ({
            question_text: resp.question.question_text,
            your_answer: resp.selectedOption || "⏺ Skipped",
            correct_answer: resp.correctOption,
            status: resp.isCorrect ? "✅ Correct" : resp.selectedOption ? "❌ Incorrect" : "⚪ Skipped",
            marksObtained: resp.marksObtained
        }));

        // ✅ Send Final Results
        res.status(200).json({
            totalMarks: attempt.totalMarks,
            accuracy: attempt.accuracy,
            attemptedQuestions: attempt.attemptedQuestions,
            correctAnswers: attempt.correctAnswers,
            incorrectAnswers: attempt.incorrectAnswers,
            skipped: attempt.totalQuestions - attempt.attemptedQuestions,
            timeTaken,
            status: attempt.status,
            review: reviewData
        });

    } catch (error) {
        console.error("Error fetching exam results:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};