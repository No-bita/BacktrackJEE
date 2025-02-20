import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import getQuestionModel from "./models/Question.js"; // ✅ Ensure `.js` extension

// ✅ Load environment variables
dotenv.config();

// ✅ Get JSON file path and extract collection name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonFilePath = path.resolve(__dirname, "JEE Mains/2024_Jan_27_Shift_2.json");
const collectionName = path.basename(jsonFilePath, ".json"); // ✅ Directly use the filename without modification

// ✅ Fix: Use Correct MONGO_URI with Explicit Database Name
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set in .env file!");
    process.exit(1);
}

// ✅ Connect to MongoDB with the Correct Database
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}`);
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};

// ✅ Function to Load JSON and Push to MongoDB
const pushJSONToMongo = async () => {
    try {
        // ✅ Connect to MongoDB
        await connectDB();

        // ✅ Get the correct Question model dynamically (based on filename)
        const Question = await getQuestionModel(collectionName);

        // ✅ Delete all existing documents before inserting new ones
        await Question.deleteMany({});
        console.log(`🗑️ Cleared previous data from ${collectionName}`);

        // ✅ Read JSON data
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

        // ✅ Format data
        const formattedData = jsonData.map(q => ({
            question_id: q.question_id, // ✅ Ensure question_id is included
            type: q.type,
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [],
            answer: q.answer,
            image: q.image || null,
            subject: q.subject,
        }));

        // ✅ Insert all questions after deletion
        await Question.insertMany(formattedData);
        console.log(`✅ Successfully inserted ${formattedData.length} questions into MongoDB collection: ${collectionName}`);

    } catch (error) {
        console.error("❌ Error inserting JSON data into MongoDB:", error);
    } finally {
        // ✅ Close connection only after all operations complete
        await mongoose.connection.close();
        console.log("🔌 MongoDB Connection Closed");
    }
};

// ✅ Run the Function
pushJSONToMongo();
