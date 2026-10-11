/**
 * Simple in-memory rate limiter middleware for authentication routes.
 * Limits each IP to maxRequests within windowMs.
 *
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds (e.g. 15 * 60 * 1000)
 * @param {number} options.max - Maximum requests allowed per IP in the window
 * @param {string} [options.message] - Custom error message
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many requests from this IP, please try again later.' }) {
    const hits = new Map();

    // Periodic cleanup of expired entries
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of hits.entries()) {
            if (now - record.startTime > windowMs) {
                hits.delete(ip);
            }
        }
    }, windowMs);

    if (cleanupInterval.unref) {
        cleanupInterval.unref();
    }

    return function rateLimiter(req, res, next) {
        // Skip in test environment if desired, or allow testing with high limits
        if (process.env.NODE_ENV === 'test') {
            return next();
        }

        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const record = hits.get(ip);

        if (!record || now - record.startTime > windowMs) {
            hits.set(ip, { count: 1, startTime: now });
            return next();
        }

        record.count += 1;
        if (record.count > max) {
            return res.status(429).json({ message });
        }

        return next();
    };
}

module.exports = createRateLimiter;
