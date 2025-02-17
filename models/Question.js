const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question_id: { type: Number, required: true, unique: true },
  type: { type: String, enum: ['MCQ', 'Integer'], required: true },
  options: [String],
  answer: { type: Number, required: true },
  image: { type: String, required: true },
  subject: { type: String, enum: ['Mathematics', 'Physics', 'Chemistry'], required: true },

});

module.exports = mongoose.model('Question', questionSchema);