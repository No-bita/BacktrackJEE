const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    }, // ✅ Ensures no duplicate exams like "JEE Mains 2024"

    duration: { 
        type: Number, 
        required: true, 
        min: 10, 
        max: 300 
    }, // ✅ Ensures duration is between 10 minutes and 5 hours

    totalMarks: { 
        type: Number, 
        required: true 
    }, // ✅ Defines total marks for the exam

    questions: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Question",
        required: true 
    }], // ✅ Ensures each exam must have questions

    isPublished: { 
        type: Boolean, 
        default: false 
    }, // ✅ Allows admin to control if an exam is available to students

    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true 
    }, // ✅ Tracks who created the exam (useful for admin functionality)

    createdAt: { 
        type: Date, 
        default: Date.now 
    }, // ✅ Automatically tracks when an exam is created

    updatedAt: { 
        type: Date, 
        default: Date.now 
    } // ✅ Auto-updated when modified
});

const Exam = mongoose.model("Exam", ExamSchema);
module.exports = Exam;
