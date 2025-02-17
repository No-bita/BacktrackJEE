const router = require('express').Router();
const Question = require('../models/Question');
const authMiddleware = require('../middleware/authmiddleware');

// Get question paper metadata
router.get('/boundaries', authMiddleware, async (req, res) => {
  res.json({
    boundaries: {
      Mathematics: { start: 1, end: 30 },
      Physics: { start: 31, end: 60 },
      Chemistry: { start: 61, end: 90 }
    }
  });
});

module.exports = router;