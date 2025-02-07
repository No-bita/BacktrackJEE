const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error("❌ MONGO_URI is not set in the .env file");
}

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let db = null; // Store the DB instance

// ✅ Function to Connect to MongoDB
const connectDB = async () => {
    try {
        if (!db) {
            await client.connect();
            db = client.db("Mains_2024"); // Replace with your actual DB name
            console.log("✅ MongoDB Connected Successfully");
        }
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        throw new Error("Database connection failed");
    }
};

// ✅ Function to Get DB Instance
const getDB = () => {
    if (!db) {
        throw new Error("❌ Database not connected");
    }
    return db;
};

// ✅ Function to Close MongoDB Connection Gracefully
const closeDB = async () => {
    if (client) {
        await client.close();
        console.log("🛑 MongoDB Connection Closed");
    }
};

module.exports = { connectDB, getDB, closeDB };
