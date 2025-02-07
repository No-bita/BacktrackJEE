const mongoose = require("mongoose");

module.exports = (collectionName) => {
    const questionSchema = new mongoose.Schema({
        question_id: { type: Number, required: true, unique: true },
        type: { type: String, required: true, enum: ["MCQ", "Integer"] }, // ✅ New field to differentiate question types
        question_text: { type: String, required: true },
        options: {
            1: { type: String, required: function() { return this.type === "MCQ"; } },
            2: { type: String, required: function() { return this.type === "MCQ"; } },
            3: { type: String, required: function() { return this.type === "MCQ"; } },
            4: { type: String, required: function() { return this.type === "MCQ"; } }
        }, // ✅ Options are only required for MCQs
        correct_option: { 
            type: Number, 
            required: true, 
            validate: {
                validator: function(value) {
                    return this.type === "MCQ" ? [1, 2, 3, 4].includes(value) : (value >= 0 && value <= 99999);
                },
                message: props => `${props.value} is not a valid answer`
            }
        }, // ✅ Allow 1-4 for MCQs, 0-99999 for Integer questions
        image: { type: String, default: null }
    }, { collection: collectionName });

    return mongoose.models[collectionName] || mongoose.model(collectionName, questionSchema);
};
