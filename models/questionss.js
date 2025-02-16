// 📂 models/Question.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question_id: { type: Number, required: true, unique: true },
    type: { type: String, required: true, enum: ["MCQ", "Integer"] },
    question_text: { type: String, required: true, trim: true },
    options: { type: Map, of: String, default: null },
    correct_option: { type: Number, required: true },
    marks: { type: Number, default: 4 },
    image: { type: String, default: null }
});

// ✅ Register with the static model name "questionss"
module.exports = mongoose.models.Question || mongoose.model("questionss", questionSchema);
