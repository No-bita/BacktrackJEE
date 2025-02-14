const mongoose = require("mongoose");

module.exports = (collectionName) => {
    const questionSchema = new mongoose.Schema({
        exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true }, // ✅ Links to Exam
        question_id: { type: Number, required: true, unique: true },
        type: { type: String, required: true, enum: ["MCQ", "Integer"] }, // ✅ Differentiates question types
        question_text: { type: String, required: true },

        options: {
            type: [String], // ✅ MCQ: Array of 4 options, Integer: Empty
            validate: {
                validator: function (value) {
                    if (this.type === "MCQ") return Array.isArray(value) && value.length === 4;
                    return value.length === 0; // Integer questions should have no options
                },
                message: "MCQ questions must have exactly 4 options, Integer questions must have none."
            },
            default: []
        },

        correct_option: { 
            type: Number, 
            required: true, 
            validate: {
                validator: function(value) {
                    if (this.type === "MCQ") return Number.isInteger(value) && value >= 1 && value <= 4;
                    if (this.type === "Integer") return Number.isInteger(value); // Allow negatives
                    return false;
                },
                message: props => `Invalid correct answer: ${props.value}`
            }
        },

        marks: { type: Number, default: 4 }, // ✅ Allows variable marks per question
        image: { type: String, default: null } // ✅ Optional image URL

    }, { collection: collectionName });

    return mongoose.models[collectionName] || mongoose.model(collectionName, questionSchema, collectionName);
};
