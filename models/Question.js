const mongoose = require("mongoose");

module.exports = (collectionName) => {
    const questionSchema = new mongoose.Schema({
        //exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: false }, // ✅ Allows linking to an exam
        question_id: { type: Number, required: true, unique: true },
        type: { type: String, required: true, enum: ["MCQ", "Integer"] }, // ✅ Differentiates question types
        question_text: { type: String, required: true, trim: true },
        year: { type: mongoose.Schema.Types.ObjectId, ref: "Year", required: false }, // ✅ Year of the question
        slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: false }, // ✅ Slot of the question

        options: {
            type: Map,
            of: String, // ✅ Accepts object instead of an array
            validate: {
                validator: function (value) {
                    if (this.type === "MCQ") return value && Object.keys(value).length === 4;
                    return value === null || Object.keys(value).length === 0; // ✅ Integer questions should have no options
                },
                message: "MCQ questions must have exactly 4 options, Integer questions must have none."
            },
            default: null
        },

        correct_option: { 
            type: Number, 
            required: true, 
            default: function () {
                return this.type === "MCQ" ? 1 : 0; // ✅ Default: 1 for MCQ, 0 for Integer
            },
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
