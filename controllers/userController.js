const User = require('../models/user');
const { validationResult } = require('express-validator');

const userController = {
    // Register new user
    register: async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, password } = req.body;

            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({
                    error: 'User already exists with this email'
                });
            }

            // Create new user
            user = new User({
                name,
                email,
                password
            });

            // Save user
            await user.save();

            // Log in the user after registration
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({
                        error: 'Error logging in after registration'
                    });
                }

                // Return user data (excluding password)
                res.status(201).json({
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                error: 'Server error during registration'
            });
        }
    },

    // Get user profile
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user._id).select('-password');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ user });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching user profile' });
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const { name } = req.body;
            const user = await User.findByIdAndUpdate(
                req.user._id,
                { $set: { name } },
                { new: true }
            ).select('-password');

            res.json({ user });
        } catch (error) {
            res.status(500).json({ error: 'Error updating profile' });
        }
    }
};

module.exports = userController; 