const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const authMiddleware = require('../middleware/authmiddleware');

// Start new attempt
router.post('/start', authMiddleware, attemptController.startAttempt);

// Submit attempt
router.post('/:attemptId/submit', authMiddleware, attemptController.submitAttempt);

module.exports = router;