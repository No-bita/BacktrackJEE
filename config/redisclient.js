const redis = require('redis');
require('dotenv').config();

// Create Redis Client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' // Default Redis URL
});

// Handle Connection Events
redisClient.on('connect', () => console.log("✅ Redis connected successfully!"));
redisClient.on('error', (err) => console.error("❌ Redis Error:", err));

// Function to Connect to Redis
const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("🚀 Connected to Redis!");
    } catch (error) {
        console.error("❌ Failed to connect to Redis:", error);
        process.exit(1); // Exit process on failure
    }
};

// Call connectRedis() function to establish connection
connectRedis();

// Export Redis Client
module.exports = redisClient;
