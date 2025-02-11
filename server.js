const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
require('dotenv').config();

// Initialize app
const app = express();

// Connect to MongoDB
require('./config/db');

// Passport config
require('./config/passport');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Validate environment variables
const requiredEnvVars = {
    MONGODB_URI: process.env.MONGODB_URI,
    SESSION_SECRET: process.env.SESSION_SECRET,
    CLIENT_URL: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true
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
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
};

// Pre-flight OPTIONS middleware
app.options('*', cors(corsOptions));

// Apply CORS for all routes
app.use(cors(corsOptions));

// Remove redundant headers since they're handled by cors middleware
// Additional security headers if needed
app.use((req, res, next) => {
    // Add any security headers not covered by cors
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Trust the first proxy
app.set('trust proxy', 1); // Trust first proxy

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60, // Session TTL in seconds (1 day)
        autoRemove: 'native' // Use MongoDB's TTL index
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax'
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api', require('./routes/signup'));


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;