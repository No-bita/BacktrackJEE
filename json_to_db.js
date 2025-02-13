require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ✅ Get JSON file name (without extension) and format collection name
const jsonFilePath = "/Users/aaryanshah/Desktop/Project/BacktrackJEE-master/JEE Mains/Apr_04_Shift_1.json";
const collectionName = path.basename(jsonFilePath, ".json").replace(/\s+/g, "_"); // ✅ Replace spaces with underscores

const Question = require("./models/Question")(collectionName);

// ✅ Fix: Use Correct MONGO_URI with Explicit Database Name
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) { // ✅ Ensure MONGO_URI is defined
    console.error("❌ MONGO_URI is not set in .env file!");
    process.exit(1);
}

// ✅ Connect to MongoDB with the Correct Database
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log(`✅ Connected to MongoDB`);
        console.log(`🛠️ Connected to Database: ${mongoose.connection.name}`); // ✅ Debugging Line
        console.log(`📂 Collection Name: ${collectionName}`); // ✅ Debugging Line
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// ✅ Function to Load JSON and Push to MongoDB
const pushJSONToMongo = async () => {
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

        const formattedData = jsonData.map(q => {
            const answer = parseInt(q.answer);
            const isMCQ = Array.isArray(q.options) && q.options.length === 4;

            return {
                question_id: q.question_id,
                type: isMCQ ? "MCQ" : "Integer",
                question_text: q.question,
                options: isMCQ
                    ? {
                        1: q.options[0] || "N/A",
                        2: q.options[1] || "N/A",
                        3: q.options[2] || "N/A",
                        4: q.options[3] || "N/A"
                    }
                    : null,
                correct_option: isMCQ 
                    ? ([1, 2, 3, 4].includes(answer) ? answer : 1)  // ✅ Default MCQ answer if missing
                    : (Number.isInteger(answer) ? answer : 0),  // ✅ Default Integer answer if missing
                image: q.image || null
            };
        });

        await Question.deleteMany({});
        console.log(`🗑️ Cleared old data from ${collectionName}`);

        await Question.insertMany(formattedData);
        console.log(`✅ Successfully inserted ${formattedData.length} questions into MongoDB collection: ${collectionName}`);

    } catch (error) {
        console.error("❌ Error inserting JSON data into MongoDB:", error);
    } finally {
        mongoose.connection.close();
        console.log("🔌 MongoDB Connection Closed");
    }
};

// ✅ Run the Function
pushJSONToMongo();
