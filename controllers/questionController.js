exports.getQuestionsByslot = asyncHandler(async (req, res) => {
    const { year, slot, subject } = req.query;
    
    const questions = await Question.find({ year, slot, subject })
      .sort('question_id')
      .select('-answer -__v');
  
    res.json({
      year,
      slot,
      subject,
      count: questions.length,
      questions
    });
  });

  exports.getFullQuestionPaper = async (req, res) => {
    try {
      const { year, shift } = req.query;
      
      // Get all questions sorted by question_id
      const questions = await Question.find({ year, shift })
        .sort({ question_id: 1 })
        .select('-answer -__v');
  
      if (questions.length !== 90) {
        return res.status(404).json({ message: 'Complete question paper not found' });
      }
  
      // Split into subjects based on fixed positions
      const subjects = {
        Mathematics: questions.slice(0, 30),
        Physics: questions.slice(30, 60),
        Chemistry: questions.slice(60, 90)
      };
  
      res.json({
        year,
        shift,
        subjects,
        boundaries: {
          Mathematics: { start: 1, end: 30 },
          Physics: { start: 31, end: 60 },
          Chemistry: { start: 61, end: 90 }
        }
      });
  
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  exports.getSubjectBoundaries = async (req, res) => {
    res.json({
      boundaries: {
        Mathematics: { start: 1, end: 30 },
        Physics: { start: 31, end: 60 },
        Chemistry: { start: 61, end: 90 }
      }
    });
  };