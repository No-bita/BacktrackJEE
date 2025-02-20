import mongoose from "mongoose";

const { Schema } = mongoose;

// ✅ Updated Question Schema (No `question_id`)
const questionSchema = new Schema({
    type: { type: String, required: true, enum: ["MCQ", "Integer"] },

    options: { 
        type: Array, 
        default: [],
        validate: {
            validator: function (value) {
                if (this.type === "MCQ") return Array.isArray(value) && value.length === 4;
                return value.length === 0; // Integer questions should have no options
            },
            message: "MCQ must have exactly 4 options, Integer questions must have none."
        }
    },

    answer: { 
        type: Number, 
        required: true,
        validate: {
            validator: function(value) {
                if (this.type === "MCQ") return Number.isInteger(value) && value >= 1 && value <= 4; // ✅ MCQs must be 1-4
                if (this.type === "Integer") return Number.isInteger(value); // ✅ Integer answers can be any number
                return false;
            },
            message: props => `Invalid answer: ${props.value}`
        }
    },

    image: { type: String, default: null }, // ✅ Stores image URL if available
    subject: { type: String, required: true } // ✅ Subject of the question (Mathematics, Physics, etc.)

}, { timestamps: true }); // ✅ Adds `createdAt` & `updatedAt`

// ✅ Function to Find and Use Existing Collections
const getQuestionModel = async (collectionName) => {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // ✅ Check if the requested collection exists
    const collectionExists = collections.some(col => col.name === collectionName);
    
    if (!collectionExists) {
        throw new Error(`❌ Collection '${collectionName}' does not exist in the database.`);
    }

    // ✅ If the collection exists, return the model reference
    return mongoose.connection.db.collection(collectionName);
};

export default getQuestionModel;
