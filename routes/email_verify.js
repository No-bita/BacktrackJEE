router.get("/verify-email", async (req, res) => {
    const { token } = req.query;

    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });

        if (!user) return res.status(400).json({ message: "User not found" });

        // Mark the user as verified
        user.verified = true;
        await user.save();

        res.json({ success: true, message: "Email verified successfully. You can now log in." });
    } catch (error) {
        res.status(400).json({ message: "Invalid or expired token" });
    }
});
