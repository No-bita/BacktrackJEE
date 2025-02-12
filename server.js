const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Initialize app
const app = express();

// CORS configuration
const corsOptions = {
    origin: ["http://localhost:3000", "https://no-bita.github.io/FronTrackkkJEE/", "https://backend-q2xl.onrender.com/"], // Allowed origins
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
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
//add a test 
app.get("/api/test", (req, res) => {
    res.json({ message: "Hello from the server!" });
})
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
