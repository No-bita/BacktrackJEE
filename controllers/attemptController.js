const Attempt = require('../models/Attempt');
const Question = require('../models/Question');

const attemptController = {

// ✅ Start a new exam attempt based on year and slot
    startAttempt: async (req, res) => {
        try {
            const { year, slot, totalQuestions, timeAlloted } = req.body;

            // ✅ Find the exam based on year & slot
            const exam = await Exam.findOne({ year, slot });
            if (!exam) {
                return res.status(404).json({ message: "Exam not found." });
            }

            // ✅ Fetch random questions for the exam
            const questions = await Question.aggregate([
                { $match: { exam: exam._id } }, // Match questions for this exam
                { $sample: { size: parseInt(totalQuestions) } } // Randomize selection
            ]);

            if (!questions.length) {
                return res.status(404).json({ message: "No questions available for this exam." });
            }

            // ✅ Create new attempt
            const attempt = new Attempt({
                user: req.user._id,
                exam: exam._id,
                responses: questions.map(q => ({
                    question: q._id,
                    questionType: q.questionType
                })),
                totalQuestions,
                timeAlloted,
                startTime: new Date(),
                status: "IN_PROGRESS"
            });

            await attempt.save();

            // ✅ Return attempt without exposing correct answers
            const populatedAttempt = await Attempt.findById(attempt._id)
                .populate('responses.question', '-correctOption -explanation');

            res.status(201).json(populatedAttempt);
        } catch (error) {
            console.error('Error starting attempt:', error);
            res.status(500).json({ message: 'Error starting attempt', error: error.message });
        }
    },


    // Submit answer for a question
// ✅ Submit answer and update score dynamically
    submitAnswer: async (req, res) => {
        try {
            const { attemptId, questionIndex, selectedOption } = req.body;

            // ✅ Find attempt & ensure it's still in progress
            const attempt = await Attempt.findOne({
                _id: attemptId,
                user: req.user._id,
                status: "IN_PROGRESS"
            }).populate('responses.question');

            if (!attempt) {
                return res.status(404).json({ message: "Attempt not found or already completed." });
            }

            // ✅ Validate question index
            if (questionIndex >= attempt.responses.length) {
                return res.status(400).json({ message: "Invalid question index." });
            }

            // ✅ Fetch question data
            const response = attempt.responses[questionIndex];
            const question = response.question;
            const isCorrect = selectedOption === question.correctOption;
            let marksObtained = isCorrect ? 4 : -1;

            // ✅ Update attempt record
            response.selectedOption = selectedOption;
            response.isCorrect = isCorrect;
            response.marksObtained = marksObtained;

            // ✅ Recalculate attempt stats
            attempt.correctAnswers = attempt.responses.filter(q => q.isCorrect).length;
            attempt.incorrectAnswers = attempt.responses.filter(q => q.isCorrect === false).length;
            attempt.totalMarks = Math.max(0, attempt.correctAnswers * 4 - attempt.incorrectAnswers);

            await attempt.save();

            res.json({
                isCorrect,
                marksObtained,
                totalMarks: attempt.totalMarks
            });
        } catch (error) {
            console.error("Error submitting answer:", error);
            res.status(500).json({ message: "Error submitting answer", error: error.message });
        }
    },

// ✅ End attempt and finalize score
    endAttempt: async (req, res) => {
        try {
            const { attemptId } = req.params;

            // ✅ Find attempt
            const attempt = await Attempt.findOne({
                _id: attemptId,
                user: req.user._id,
                status: "IN_PROGRESS"
            });

            if (!attempt) {
                return res.status(404).json({ message: "Attempt not found or already completed." });
            }

            // ✅ Mark attempt as completed
            attempt.status = "COMPLETED";
            attempt.endTime = new Date();

            // ✅ Finalize score calculations
            attempt.totalMarks = Math.max(0, attempt.correctAnswers * 4 - attempt.incorrectAnswers);
            attempt.accuracy = attempt.attemptedQuestions === 0 ? 0 :
                ((attempt.correctAnswers / attempt.attemptedQuestions) * 100).toFixed(2);

            await attempt.save();

            res.json({
                totalMarks: attempt.totalMarks,
                accuracy: attempt.accuracy,
                timeTaken: attempt.timeTaken,
                attemptedQuestions: attempt.attemptedQuestions,
                correctAnswers: attempt.correctAnswers,
                incorrectAnswers: attempt.incorrectAnswers
            });
        } catch (error) {
            console.error("Error ending attempt:", error);
            res.status(500).json({ message: "Error ending attempt", error: error.message });
        }
    },


    // Get attempt history
// ✅ Fetch attempt history for user
    getAttemptHistory: async (req, res) => {
        try {
            const attempts = await Attempt.find({ user: req.user._id })
                .select("totalMarks attemptedQuestions correctAnswers incorrectAnswers status createdAt")
                .sort({ createdAt: -1 });

            res.json(attempts);
        } catch (error) {
            console.error("Error fetching attempt history:", error);
            res.status(500).json({ message: "Error fetching attempt history", error: error.message });
        }
    },


    // Get specific attempt details
// ✅ Fetch specific attempt with review breakdown
    getAttemptDetails: async (req, res) => {
        try {
            const attempt = await Attempt.findOne({
                _id: req.params.attemptId,
                user: req.user._id
            }).populate("responses.question");

            if (!attempt) {
                return res.status(404).json({ message: "Attempt not found." });
            }

            // ✅ Format review data
            const reviewData = attempt.responses.map(resp => ({
                question_text: resp.question.question_text,
                your_answer: resp.selectedOption || "⏺ Skipped",
                correct_answer: resp.correctOption,
                status: resp.isCorrect ? "✅ Correct" : resp.selectedOption ? "❌ Incorrect" : "⚪ Skipped"
            }));

            res.json({
                totalMarks: attempt.totalMarks,
                accuracy: attempt.accuracy,
                attemptedQuestions: attempt.attemptedQuestions,
                correctAnswers: attempt.correctAnswers,
                incorrectAnswers: attempt.incorrectAnswers,
                review: reviewData
            });
        } catch (error) {
            console.error("Error fetching attempt details:", error);
            res.status(500).json({ message: "Error fetching attempt details", error: error.message });
        }
    }
};


module.exports = attemptController; 