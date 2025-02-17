const { body } = require('express-validator');

// User Registration Validation
const registerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

// Question Validation (if needed for admin routes)
const questionValidation = [
    body('type').isIn(['MCQ', 'Integer']).withMessage('Invalid question type'),
    body('options').custom((value, { req }) => {
        if (req.body.type === 'MCQ' && (!Array.isArray(value) || value.length < 1)) {
            throw new Error('MCQ questions require at least 1 option');
        }
        if (req.body.type === 'Integer' && value.length > 0) {
            throw new Error('Integer questions should not have options');
        }
        return true;
    }),
    body('answer').isNumeric().withMessage('Answer must be a number')
];

// Attempt Validation
const validateAttemptStart = [
    body('year')
        .isInt({ min: 2000, max: 2100 })
        .withMessage('Valid year between 2000-2100 required'),
    body('shift')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Shift identifier required')
];

module.exports = {
    registerValidation,
    questionValidation,
    validateAttemptStart
};