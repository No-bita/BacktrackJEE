const mongoose = require("mongoose");
const { options } = require("../server");
const Schema = mongoose.Schema;

const attemptSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }, // ✅ Stores which user attempted the exam

    year: {
        type: Schema.Types.ObjectId,
        ref: "Year",
        required: true
    }, // e.g., "2024"
    
    slot: {
        type: Schema.Types.ObjectId,
        ref: "Slot",
        required: true
    }, // e.g., "Jan 30 Shift 1"    

    responses: [
        {
            question: {
                type: Schema.Types.ObjectId,
                ref: "Question",
                required: true
            }, // ✅ Links each question

            questionType: {
                type: String,
                enum: ["MCQ", "Integer"],
                required: true
            }, // ✅ Stores the type of question (MCQ or Integer)

            selectedOption: {
                type: Number,
                default: null
            },

            options: {
                type: Map,
                of: String
            }, // ✅ Stores the options for MCQs

            correctOption: {
                type: Number,
            }, // ✅ Stores the correct answer

            isCorrect: {
                type: Boolean,
                default: null
            }, // ✅ Automatically calculated (True if correct, False if incorrect)

            timeSpent: {
                type: Number,
                default: 0
            }, // ✅ Tracks how many seconds the student spent on this question

            marksObtained: {
                type: Number,
                default: null
            } // ✅ Scoring (+4, -1, 0)
        }
    ],

    totalMarks: {
        type: Number,
        default: 0
    }, // ✅ Total score after applying (+4, -1, 0) system

    totalQuestions: {
        type: Number,
        required: true
    }, // ✅ Stores how many questions were in the exam

    attemptedQuestions: {
        type: Number,
        default: 0
    }, // ✅ Number of questions answered

    unattemptedAnswers: {
        type: Number,
        default: 0
    }, // ✅ Number of questions answered

    correctAnswers: {
        type: Number,
        default: 0
    }, // ✅ Number of correct responses

    incorrectAnswers: {
        type: Number,
        default: 0
    }, // ✅ Number of incorrect responses

    startTime: {
        type: Date,
        required: true
    }, // ✅ Stores when the exam was started

    endTime: {
        type: Date
    }, // ✅ Stores when the exam was submitted

    status: {
        type: String,
        enum: ["IN_PROGRESS", "COMPLETED", "TIMED_OUT"],
        default: "IN_PROGRESS"
    }, // ✅ Tracks whether the test was completed or abandoned

    timeAlloted: {
        type: Number,
        required: true
    } // ✅ Stores the total allowed time in minutes
}, {
    timestamps: true
});

// ✅ Automatically Calculate Score Before Saving
attemptSchema.pre("save", function (next) {
    if (this.isModified("responses")) {
        let correct = 0;
        let incorrect = 0;
        let attempted = 0;
        let unattempted = 0;
        let totalMarks = 0;

        this.responses.forEach(q => {
            if (q.selectedOption !== null && q.selectedOption !== undefined) {
                attempted++;

                if (q.questionType === "MCQ") {
                    // ✅ Check correctness for MCQs
                    q.isCorrect = q.selectedOption === q.correctOption;
                } else if (q.questionType === "Integer") {
                    // ✅ Check correctness for Integer-type questions
                    q.isCorrect = q.selectedOption === q.correctOption;
                }

                if (q.isCorrect) {
                    correct++;
                    q.marksObtained = 4; // ✅ Correct Answer = +4
                    totalMarks += 4;
                } else {
                    incorrect++;
                    q.marksObtained = -1; // ❌ Incorrect Answer = -1
                    totalMarks -= 1;
                }
            } else {
                // ⚪ Question was skipped
                q.isCorrect = null;
                q.marksObtained = 0;
            }
        });

        // ✅ Update final stats
        this.attemptedQuestions = attempted;
        this.correctAnswers = correct;
        this.incorrectAnswers = incorrect;
        this.unattemptedAnswers = unattempted;
        this.totalMarks = Math.max(0, totalMarks); // Ensure totalMarks doesn't go negative

        // ✅ If no questions were attempted, set all to 0
        if (attempted === 0) {
            this.totalMarks = 0;
            this.correctAnswers = 0;
            this.incorrectAnswers = 0;
        }
    }
    next();
});

// ✅ Virtual Field to Calculate Time Taken
attemptSchema.virtual("timeTaken").get(function () {
    return this.endTime ? Math.round((this.endTime - this.startTime) / (1000 * 60)) : 0;
});


const Attempt = mongoose.model("Attempt", attemptSchema);
module.exports = Attempt;
