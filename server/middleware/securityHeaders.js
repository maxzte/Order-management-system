/**
 * Lightweight security headers middleware.
 * Implements core OWASP recommended headers without external dependencies.
 */
module.exports = function securityHeaders(req, res, next) {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking by only allowing framing from same origin
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // XSS auditor protection for legacy browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Disable technology fingerprinting
    res.removeHeader('X-Powered-By');
    const originalSend = res.send;
    res.send = function () {
        res.removeHeader('X-Powered-By');
        return originalSend.apply(this, arguments);
    };

    next();
};
