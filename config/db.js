const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let db;

const connectDB = async () => {
    try {
        await client.connect();
        db = client.db("Mains_2024"); // Replace with your DB name
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1);
    }
};

// Function to get the DB instance
const getDB = () => {
    if (!db) {
        throw new Error("❌ Database not connected");
    }
    return db;
};

module.exports = { connectDB, getDB };
