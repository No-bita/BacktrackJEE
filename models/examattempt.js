const mongoose = require("mongoose");

const ExamAttemptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    selected_option: String,
    is_correct: Boolean,
    time_taken: Number,
}, { timestamps: true });

module.exports = mongoose.model("ExamAttempt", ExamAttemptSchema);
