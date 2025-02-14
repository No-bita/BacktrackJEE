const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const token = req.headers.authorization;
    console.log("🔹 Received Token:", token);

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. No valid token provided." });
    }

    if (!process.env.JWT_SECRET) {
        console.error("❌ JWT_SECRET is not defined!");
        return res.status(500).json({ error: "Server error: Missing JWT_SECRET" });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded;
        console.log("✅ Token Verified. User ID:", decoded.id);
        next();
    } catch (error) {
        console.error("❌ JWT Verification Failed:", error.message);
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
