import mongoose from "mongoose";

const { Schema } = mongoose;

const AttemptSchema = new Schema({
    user_id: { 
        type: String, 
        required: true, 
        index: true  // ✅ Indexed for faster lookups
    }, // Stores the user's ID

    user_name: { 
        type: String, 
        required: true 
    }, // Stores the user's name

    year: { 
        type: String, 
        required: true, 
        index: true  // ✅ Indexed for efficient year-based queries
    }, // e.g., "2024"

    slot: { 
        type: String, 
        required: true, 
        index: true  // ✅ Indexed for quick slot lookups
    }, // e.g., "Jan 29 Shift 1"

    answers: [{
        question_id: { type: String, required: true },  // ✅ Ensures each answer is mapped to a question ID
        selected_answer: { type: Number, required: true }  // ✅ Ensures all answers are numbers
    }], // Stores selected answers as an array of objects instead of a Map (better for querying)

}, { 
    collection: "userattempts",
    timestamps: true  // ✅ Automatically adds `createdAt` & `updatedAt`
});

// ✅ Prevent duplicate model definition
const Attempt = mongoose.models.Attempt || mongoose.model("Attempt", AttemptSchema);

export default Attempt;
