const mongoose = require('mongoose');

if (!process.env.MONGODB_URI) {
    console.error('❌ No MongoDB URI provided - check your .env file');
    process.exit(1); // Exit the process with failure
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('📦 Connected to MongoDB'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

module.exports = mongoose.connection;
