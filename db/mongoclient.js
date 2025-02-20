import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// ✅ MongoDB Connection Function
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected successfully!");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1); // Exit process with failure
    }
};

// ✅ Handle MongoDB Errors & Disconnections
mongoose.connection.on("error", (err) => {
    console.error("⚠️ MongoDB Connection Error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB Disconnected! Attempting to reconnect...");
    connectDB(); // Auto-reconnect
});

// ✅ Export function for use in `server.js`
export default connectDB;
