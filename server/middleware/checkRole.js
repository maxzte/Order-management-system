const jwt = require('jsonwebtoken');

module.exports = function (role) {
    return function (req, res, next) {
        if (req.method === "OPTIONS") {
            return next();
        }

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ message: "Not authorized: No token provided" });
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: "Not authorized: Token missing" });
            }

            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            if (role && decoded.role !== role) {
                return res.status(403).json({ message: "Forbidden: No permission" });
            }

            req.user = decoded;
            next();
        } catch (e) {
            return res.status(401).json({ message: "Not authorized: Invalid token" });
        }
    };
};