const jwt = require('jsonwebtoken');

/**
 * Optional authentication middleware:
 * If Authorization header with valid Bearer token is provided, decodes and attaches req.user.
 * If no header is provided or token is invalid, continues without failing (req.user remains undefined).
 */
module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        return next();
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        return next();
    } catch (e) {
        // If invalid token, proceed without authenticated user
        return next();
    }
};
