const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract token from header

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid token" });
    }
};

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

const redisClient = require('../config/redisclient');

const authenticateUser = async (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const session = await redisClient.get(`session:${decoded.userId}`);

        if (!session) return res.status(401).json({ error: "Session expired. Please log in again." });

        req.user = decoded; // Attach user to request
        next();
    } catch (error) {
        res.status(400).json({ error: "Invalid token." });
    }
};

module.exports = authMiddleware;
