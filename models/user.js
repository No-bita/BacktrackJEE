const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Add this package for password hashing

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: { 
        type: String, 
        required: function() {
            return !this.googleId; // Require password only if Google ID is not present
        } 
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    googleId: { type: String }, // Optional for Google OAuth
    createdAt: { type: Date, default: Date.now }
});

// Add pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Add method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false; // Prevent errors for OAuth users
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
