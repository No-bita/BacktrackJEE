const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user"); // Ensure correct case
require("dotenv").config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback",
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                console.log("🔍 Google Profile Data:", profile);

                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    user = new User({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails?.[0]?.value || null,
                        avatar: profile.photos?.[0]?.value || null,
                    });
                    await user.save();
                    console.log("✅ New user created:", user);
                } else {
                    console.log("🔄 Existing user found:", user);
                }

                done(null, user);
            } catch (err) {
                console.error("❌ Google Authentication Error:", err);
                done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        console.error("❌ Error in deserializeUser:", error);
        done(error, null);
    }
});

module.exports = passport;
