const Attempt = require('../models/Attempt');
const Question = require('../models/Question');

exports.startAttempt = async (req, res) => {
  try {
    const { year, shift } = req.body;
    
    // Get all 90 questions in original order
    const questions = await Question.find({ year, shift })
      .sort({ question_id: 1 });

    if (questions.length !== 90) {
      return res.status(404).json({ message: 'Complete question paper not found' });
    }

    // Create attempt with subject boundaries
    const attempt = new Attempt({
      user: req.user._id,
      questions: questions.map(q => q._id),
      year,
      shift,
      subjectBoundaries: {
        Mathematics: { start: 1, end: 30 },
        Physics: { start: 31, end: 60 },
        Chemistry: { start: 61, end: 90 }
      },
      responses: questions.map(q => ({
        questionId: q._id,
        answer: null
      }))
    });

    await attempt.save();

    // Return questions without answers
    const safeQuestions = questions.map(q => ({
      _id: q._id,
      question_id: q.question_id,
      type: q.type,
      options: q.options,
      image: q.image,
      subject: q.subject
    }));

    res.status(201).json({
      attemptId: attempt._id,
      questions: safeQuestions,
      subjectBoundaries: attempt.subjectBoundaries
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate('questions', 'type answer');

    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    // Calculate score
    let score = 0;
    const questionMap = new Map(attempt.questions.map(q => [q._id.toString(), q]));

    const detailedResults = attempt.responses.map(response => {
      const question = questionMap.get(response.questionId.toString());
      if (!question) return null;

      let marks = 0;
      if (response.answer !== null) {
        if (question.type === 'MCQ') {
          marks = (response.answer === question.answer) ? 4 : -1;
        } else {
          marks = (Number(response.answer) === Number(question.answer)) ? 4 : -1;
        }
      }
      score += marks;

      return {
        questionId: response.questionId,
        marks,
        correct: marks === 4
      };
    });

    // Update attempt
    attempt.score = score;
    attempt.completedAt = new Date();
    await attempt.save();

    res.json({
      score,
      totalQuestions: 90,
      maxPossible: 360,
      detailedResults,
      subjectBoundaries: attempt.subjectBoundaries
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};