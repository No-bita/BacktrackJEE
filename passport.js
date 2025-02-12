const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user"); // Ensure correct case
const LocalStrategy = require('passport-local').Strategy;
require("dotenv").config();

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        proxy: true // Important for production with HTTPS
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ 
                $or: [
                    { googleId: profile.id },
                    { email: profile.emails[0].value }
                ]
            });
            
            if (user) {
                // If user exists but doesn't have googleId (registered with email)
                if (!user.googleId) {
                    user.googleId = profile.id;
                    await user.save();
                }
            } else {
                // Create new user
                user = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    password: Math.random().toString(36).slice(-8), // Random password
                    role: 'user'
                });
            }
            
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    })
);

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return done(null, false, { 
                message: 'No account found with this email' 
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return done(null, false, { 
                message: 'Incorrect password' 
            });
        }

        // Check if account is active/verified if you have such fields
        // if (!user.isActive) {
        //     return done(null, false, { 
        //         message: 'Account is not active' 
        //     });
        // }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-examHistory -password');
        done(null, user);
    } catch (error) {
        console.error("❌ Error in deserializeUser:", error);
        done(error, null);
    }
});

module.exports = passport;
