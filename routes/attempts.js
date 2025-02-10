const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const authenticateUser = require('../middleware/authmiddleware');

// Verify authenticateUser is a function before using it
if (typeof authenticateUser !== 'function') {
    throw new Error('authenticateUser must be a function');
}

// All routes are protected and require authentication
router.use(authenticateUser);

// Start a new attempt
router.post('/start', attemptController.startAttempt);

// Submit answer for a question
router.post('/submit-answer', attemptController.submitAnswer);

// End an attempt
router.post('/:attemptId/end', attemptController.endAttempt);

// Get attempt history
router.get('/history', attemptController.getAttemptHistory);

// Get specific attempt details
router.get('/:attemptId', attemptController.getAttemptDetails);

module.exports = router; 