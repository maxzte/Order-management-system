const ApiError = require('../error/apiError');

module.exports = function (err, req, res, next) {
    if (err instanceof ApiError) {
        return res.status(err.status).json({ message: err.message });
    }

    console.error('Unhandled Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
};