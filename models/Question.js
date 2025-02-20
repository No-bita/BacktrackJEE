import mongoose from "mongoose";

const { Schema } = mongoose;

// ✅ Optimized Question Schema
const questionSchema = new Schema(
    {
        question_id: { type: Number, required: true, unique: true },

        type: { type: String, required: true, enum: ["MCQ", "Integer"] },

        options: { 
            type: Array, 
            default: [],
            validate: {
                validator(value) {
                    return this.type === "MCQ" ? value.length === 4 : value.length === 0;
                },
                message: "MCQs must have exactly 4 options, Integer questions must have none."
            }
        },

        answer: { 
            type: Number, 
            required: true,
            validate: {
                validator(value) {
                    return this.type === "MCQ" ? (value >= 1 && value <= 4) : Number.isInteger(value);
                },
                message: props => `Invalid answer: ${props.value}`
            }
        },

        image: { type: String, default: null }, // ✅ Stores image URL if available
        subject: { type: String, required: true } // ✅ Subject (Mathematics, Physics, etc.)
    },
    { timestamps: true } // ✅ Automatically adds `createdAt` & `updatedAt`
);

// ✅ Function to Retrieve Existing Collections (Mongoose Handles Collection Creation)
const getQuestionModel = async (collectionName) => {
    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName];
    }
    
    return mongoose.model(collectionName, questionSchema, collectionName);
};

export default getQuestionModel;
