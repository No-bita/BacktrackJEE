const ensureAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Please log in to access this resource' });
};

const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ message: 'Admin access required' });
};

const ensureGuest = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.status(400).json({ message: 'You are already logged in' });
};

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next(); // User is authenticated, proceed to the next middleware/route
    }
    return res.status(401).json({ error: 'Unauthorized access' }); // User is not authenticated
};

const authenticateUser = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
    next();
};

module.exports = authenticateUser;