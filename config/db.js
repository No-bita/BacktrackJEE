const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error("❌ MONGO_URI is not set in the .env file");
}

const client = new MongoClient(uri, { tls: true });

let db = null;

const connectDB = async () => {
    try {
        if (!db) {
            await client.connect();
            db = client.db("Mains_2024"); // ✅ Use correct database name
            console.log("✅ MongoDB Connected Successfully");
        }
        return db;
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        return null;
    }
};

const getDB = () => {
    if (!db) throw new Error("❌ Database not connected");
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        console.log("🛑 MongoDB Connection Closed");
    }
};

module.exports = { connectDB, getDB, closeDB };
