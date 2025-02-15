const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db"); // ✅ Import database connection

// ✅ Validate environment variables before running
if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
}

// Initialize app
const app = express();

// ✅ CORS Configuration
const corsOptions = {
    origin: "*", // ✅ Define allowed origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors());
app.use(express.urlencoded({ extended: false }));

// ✅ Security headers
app.use((req, res, next) => {
    res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
});

// ✅ Trust first proxy (needed for cookies)
app.set("trust proxy", 1);

// ✅ Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/attempts", require("./routes/attempts"));
app.use("/api/questions", require("./routes/questions"));

// ✅ Test Route
app.get("/api/test", (req, res) => {
    res.json({ message: "Hello from the server!" });
});

const resultsRoutes = require('./routes/results');
app.use('/api/results', resultsRoutes);

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!", error: process.env.NODE_ENV === "development" ? err.message : undefined });
});

// ✅ 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// ✅ Start Server Only After MongoDB is Connected
const PORT = process.env.PORT || 5001;
const startServer = async () => {
    try {
        await connectDB(); // ✅ Ensure DB connection before running server

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1); // Stop process if DB fails
    }
};

startServer(); // ✅ Start server only if MongoDB connects successfully

module.exports = app;
