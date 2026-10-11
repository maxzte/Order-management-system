const { v4: uuidv4 } = require('uuid');

/**
 * Middleware that assigns a unique Request ID to each incoming HTTP request.
 * Reads X-Request-Id header if supplied by client/proxy, otherwise generates a new UUID.
 * Sets the X-Request-Id header on the outgoing response.
 */
module.exports = function requestId(req, res, next) {
    const headerId = req.headers['x-request-id'];
    const id = (headerId && typeof headerId === 'string' && headerId.trim()) ? headerId.trim() : uuidv4();

    req.id = id;
    res.setHeader('X-Request-Id', id);

    next();
};
