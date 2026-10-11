/**
 * Request logger middleware.
 * Logs incoming HTTP requests and response time in development/production.
 * Silenced in testing mode.
 */
module.exports = function requestLogger(req, res, next) {
    if (process.env.NODE_ENV === 'test') {
        return next();
    }

    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
        const reset = '\x1b[0m';
        console.log(`[HTTP] ${method} ${originalUrl} ${color}${status}${reset} - ${duration}ms`);
    });

    next();
};
