// 📂 models/Attempt.js
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const attemptSchema = new Schema({
    user_id: {
        type: String,
        required: true
    }, // Stores the user's ID

    user_name: {
        type: String,
        required: true
    }, // Stores the user's name

    year: {
        type: String,
        required: true
    }, // e.g., "2024"

    slot: {
        type: String,
        required: true
    }, // e.g., "Jan 29 Shift 1"

    answers: {
        type: Map,
        of: Number,
        required: true
    }, // Map of question_id -> selected answer

    timestamp: {
        type: Date,
        default: Date.now
    } // Automatically logs when the attempt is stored
}, {
    collection: "userattempts" // Matches your DB collection name
});

const Attempt = mongoose.model("Attempt", attemptSchema);
module.exports = Attempt;
