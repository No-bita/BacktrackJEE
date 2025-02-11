const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Initialize app
const app = express();

// Connect to MongoDB
require("./config/db");

// Validate environment variables
const requiredEnvVars = {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    CLIENT_URL: process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : true
};

// Check all required environment variables
Object.entries(requiredEnvVars).forEach(([name, value]) => {
    if (!value) {
        console.error(`❌ ${name} not set in environment`);
        process.exit(1);
    }
});

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : ["http://localhost:3000", "http://127.0.0.1:3000", "https://no-bita.github.io"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"]
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Security headers
app.use((req, res, next) => {
    res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
});

// Trust the first proxy
app.set("trust proxy", 1);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/attempts", require("./routes/attempts"));
app.use("/api/questions", require("./routes/questions"));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
