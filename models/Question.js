const mongoose = require("mongoose");

module.exports = (collectionName) => {
    const questionSchema = new mongoose.Schema({
        question_id: { type: Number, required: true, unique: true },
        type: { type: String, required: true, enum: ["MCQ", "Integer"] }, // ✅ New field to differentiate question types
        question_text: { type: String, required: true },
        options: {
            type: [String], // Array of strings for MCQ
            validate: {
                validator: function (value) {
                    return this.type === "MCQ" ? value.length === 4 : value.length === 0;
                },
                message: "MCQ questions must have exactly 4 options."
            },
            default:undefined
        },        
        correct_option: { 
            type: Number, 
            required: true, 
            validate: {
                validator: function(value) {
                    if (this.type === "MCQ") {
                        return Number.isInteger(value) && value >= 1 && value <= 4;
                    }
                    if (this.type === "Integer") {
                        return Number.isInteger(value);
                    }
                    return false;
                },
                message: props => `Invalid correct answer: ${props.value}`
            }
        },        
        image: { type: String, default: null }
    }, { collection: collectionName });

    return mongoose.models[collectionName] || mongoose.model(collectionName, questionSchema);
};
