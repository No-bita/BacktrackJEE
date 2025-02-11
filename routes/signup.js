const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const User = require("../models/user"); // Adjust based on your structure

const router = express.Router();
const JWT_SECRET = "your_secret_key"; // Keep it secret

// 📩 Email Transporter (Using Gmail or SMTP)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your-email@gmail.com",
        pass: "your-email-password",
    },
});

// ✅ Signup Route
router.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user (unverified)
    user = new User({ name, email, password: hashedPassword, verified: false });
    await user.save();

    // Generate verification token
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });

    // Send Verification Email
    const verificationLink = `https://yourwebsite.com/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
        from: '"JEE Backtrack" <your-email@gmail.com>',
        to: email,
        subject: "Verify Your Email - JEE Backtrack",
        html: `<p>Click the link below to verify your email:</p>
               <a href="${verificationLink}">Verify Email</a>`,
    });

    res.json({ success: true, message: "Verification email sent" });
});

module.exports = router;
