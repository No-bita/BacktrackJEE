const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attemptSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questions: [{
        question: {
            type: Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        selectedOption: {
            type: Number,
            min: 0,
            max: 3,
            default: null  // Allow null for skipped questions
        },
        isCorrect: {
            type: Boolean,
            default: false  // Changed to null as default
        },
        timeSpent: {
            type: Number,  // Time spent on this question in seconds
            default: 0
        },
        marksObtained: {
            type: Number,  // +4 for correct, -1 for incorrect, 0 for unattempted
            default: 0
        }
    }],
    examType: {
        type: String,
        enum: ['FULL_TEST', 'SUBJECT_WISE', 'CHAPTER_WISE', 'PREVIOUS_YEAR'],
        required: true
    },
    subject: {
        type: String,
        enum: ['ALL', 'Physics', 'Chemistry', 'Mathematics'],
        required: true
    },
    totalMarks: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    attemptedQuestions: {
        type: Number,
        default: 0
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    incorrectAnswers: {
        type: Number,
        default: 0
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['IN_PROGRESS', 'COMPLETED', 'TIMED_OUT'],
        default: 'IN_PROGRESS'
    },
    timeAlloted: {
        type: Number,  // Time alloted in minutes
        required: true
    }
}, {
    timestamps: true
});

// Calculate total time taken in minutes
attemptSchema.virtual('timeTaken').get(function() {
    if (!this.endTime) return 0;
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Calculate accuracy percentage
attemptSchema.virtual('accuracy').get(function() {
    if (this.attemptedQuestions === 0) return 0;  // Return 0 if no questions attempted
    return ((this.correctAnswers / this.attemptedQuestions) * 100).toFixed(2);
});

// Pre-save middleware to update attempt statistics
attemptSchema.pre('save', function(next) {
    if (this.isModified('questions')) {
        let correct = 0;
        let incorrect = 0;
        let attempted = 0;
        let totalMarks = 0;

        this.questions.forEach(q => {
            if (q.selectedOption !== null && q.selectedOption !== undefined) {
                // Question was attempted
                attempted++;
                if (q.isCorrect) {
                    correct++;
                    totalMarks += 4;
                    q.marksObtained = 4;
                } else {
                    incorrect++;
                    totalMarks -= 1;
                    q.marksObtained = -1;
                }
            } else {
                // Question was skipped
                q.isCorrect = null;
                q.marksObtained = 0;
            }
        });

        // Update statistics
        this.attemptedQuestions = attempted;
        this.correctAnswers = correct;
        this.incorrectAnswers = incorrect;
        this.totalMarks = Math.max(0, totalMarks);  // Ensure totalMarks doesn't go below 0
        
        // If no questions attempted, ensure all relevant fields are 0
        if (attempted === 0) {
            this.totalMarks = 0;
            this.correctAnswers = 0;
            this.incorrectAnswers = 0;
        }
    }
    next();
});

const Attempt = mongoose.model('Attempt', attemptSchema);
module.exports = Attempt; 