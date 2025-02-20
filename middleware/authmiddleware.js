import jwt from "jsonwebtoken";

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. Invalid or missing token." });
    }

    try {
        // Extract the actual token after "Bearer "
        const jwtToken = token.split(" ")[1];

        // Verify the token using the secret key
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to the request
        next(); // Move to the next middleware or route handler
    } catch (error) {
        console.error(`🔴 JWT Error: ${error.message}`);
        res.status(401).json({ error: `Invalid token: ${error.message}` });
    }
};

export default authenticateUser; // ✅ Export as ES module
