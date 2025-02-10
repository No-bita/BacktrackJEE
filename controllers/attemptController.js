const Attempt = require('../models/Attempt');
const Question = require('../models/Question');

const attemptController = {
    // Start a new attempt
    startAttempt: async (req, res) => {
        try {
            const { examType, subject, totalQuestions, timeAlloted } = req.body;

            // Fetch random questions based on criteria
            const questions = await Question.aggregate([
                { $match: subject !== 'ALL' ? { subject } : {} },
                { $sample: { size: parseInt(totalQuestions) } }
            ]);

            const attempt = new Attempt({
                user: req.user._id,
                questions: questions.map(q => ({
                    question: q._id
                })),
                examType,
                subject,
                totalQuestions,
                timeAlloted,
                startTime: new Date()
            });

            await attempt.save();
            
            // Return attempt with populated questions
            const populatedAttempt = await Attempt.findById(attempt._id)
                .populate('questions.question')
                .select('-questions.question.correctOption -questions.question.explanation');

            res.status(201).json(populatedAttempt);
        } catch (error) {
            console.error('Error starting attempt:', error);
            res.status(500).json({ message: 'Error starting attempt', error: error.message });
        }
    },

    // Submit answer for a question
    submitAnswer: async (req, res) => {
        try {
            const { attemptId, questionIndex, selectedOption } = req.body;
            
            const attempt = await Attempt.findOne({ 
                _id: attemptId, 
                user: req.user._id,
                status: 'IN_PROGRESS'
            }).populate('questions.question');

            if (!attempt) {
                return res.status(404).json({ message: 'Attempt not found or already completed' });
            }

            // Validate question index
            if (questionIndex >= attempt.questions.length) {
                return res.status(400).json({ message: 'Invalid question index' });
            }

            // Update the answer
            const question = attempt.questions[questionIndex];
            question.selectedOption = selectedOption;
            question.isCorrect = selectedOption === question.question.correctOption;
            
            await attempt.save();

            res.json({ 
                isCorrect: question.isCorrect,
                marksObtained: question.isCorrect ? 4 : -1
            });
        } catch (error) {
            console.error('Error submitting answer:', error);
            res.status(500).json({ message: 'Error submitting answer', error: error.message });
        }
    },

    // End attempt
    endAttempt: async (req, res) => {
        try {
            const { attemptId } = req.params;
            
            const attempt = await Attempt.findOne({ 
                _id: attemptId, 
                user: req.user._id,
                status: 'IN_PROGRESS'
            });

            if (!attempt) {
                return res.status(404).json({ message: 'Attempt not found or already completed' });
            }

            attempt.status = 'COMPLETED';
            attempt.endTime = new Date();
            await attempt.save();

            // Return attempt summary
            const summary = {
                totalMarks: attempt.totalMarks,
                accuracy: attempt.accuracy,
                timeTaken: attempt.timeTaken,
                attemptedQuestions: attempt.attemptedQuestions,
                correctAnswers: attempt.correctAnswers,
                incorrectAnswers: attempt.incorrectAnswers
            };

            res.json(summary);
        } catch (error) {
            console.error('Error ending attempt:', error);
            res.status(500).json({ message: 'Error ending attempt', error: error.message });
        }
    },

    // Get attempt history
    getAttemptHistory: async (req, res) => {
        try {
            const attempts = await Attempt.find({ user: req.user._id })
                .select('-questions')
                .sort({ createdAt: -1 });
            res.json(attempts);
        } catch (error) {
            console.error('Error fetching attempt history:', error);
            res.status(500).json({ message: 'Error fetching attempt history', error: error.message });
        }
    },

    // Get specific attempt details
    getAttemptDetails: async (req, res) => {
        try {
            const attempt = await Attempt.findOne({ 
                _id: req.params.attemptId,
                user: req.user._id
            }).populate('questions.question');

            if (!attempt) {
                return res.status(404).json({ message: 'Attempt not found' });
            }

            res.json(attempt);
        } catch (error) {
            console.error('Error fetching attempt details:', error);
            res.status(500).json({ message: 'Error fetching attempt details', error: error.message });
        }
    }
};

module.exports = attemptController; 