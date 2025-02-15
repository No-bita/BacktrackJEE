const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. Invalid or missing token." });
    }

    try {
        // Extract token after "Bearer "
        const jwtToken = token.split(" ")[1];

        // Verify the token
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(`🔴 JWT Error: ${error.message}`);
        res.status(401).json({ error: `Invalid token: ${error.message}` });
    }
};
