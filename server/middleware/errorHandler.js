const ApiError = require('../error/apiError');
const logger = require('../utils/logger');

module.exports = function (err, req, res, next) {
    const requestId = req.id || req.headers['x-request-id'] || 'n/a';

    if (err instanceof ApiError) {
        // Client errors (4xx) logged as warning
        logger.warn(`[Client Error] ${err.status} - ${err.message}`, {
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: err.status,
            userId: req.user ? req.user.id : null,
            ip: req.ip,
        });

        return res.status(err.status).json({
            message: err.message,
            requestId,
        });
    }

    // Unhandled server errors (500) logged as ERROR with full stack & context
    logger.error(`[Unhandled Error] ${err.message}`, {
        error: err,
        requestId,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        userId: req.user ? req.user.id : null,
        ip: req.ip,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    return res.status(500).json({
        message: isProduction ? 'Internal server error' : (err.message || 'Internal server error'),
        requestId,
    });
};