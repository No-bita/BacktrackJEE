const mongoose = require("mongoose");

const StudentResponseSchema = new mongoose.Schema({
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    }, // ✅ Links the response to a student in the "User" collection

    examId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Exam", 
        required: true 
    }, // ✅ Links to an "Exam" collection to track which test the student took

    responses: [
        {
            questionId: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: "Question", 
                required: true 
            }, // ✅ Links the question

            selectedOption: { 
                type: Number, 
                required: true, 
                enum: [1, 2, 3, 4] 
            }, // ✅ Restricts to 4 valid options

            correctOption: { 
                type: Number, 
                required: true 
            }, // ✅ Ensures that the correct option is always stored

            isCorrect: { 
                type: Boolean, 
                default: false 
            } // ✅ Helps in result calculation
        }
    ],

    totalScore: { 
        type: Number, 
        default: 0 
    }, // ✅ Stores the student's score for the test

    submittedAt: { 
        type: Date, 
        default: Date.now 
    } // ✅ Stores when the test was submitted
});

const StudentResponse = mongoose.model("StudentResponse", StudentResponseSchema);
module.exports = StudentResponse;
