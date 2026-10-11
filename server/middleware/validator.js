const ApiError = require('../error/apiError');

/**
 * Creates an input validation middleware based on a declarative rules schema.
 * Supports checking required fields, data types, min/max numbers, and string lengths.
 *
 * @param {object} schema - Validation schema object
 * @example
 * validate({
 *   name: { type: 'string', required: true, trim: true },
 *   price: { type: 'number', required: true, min: 0.01 }
 * })
 */
function validate(schema) {
    return function (req, res, next) {
        const body = req.body || {};

        for (const [field, rules] of Object.entries(schema)) {
            let value = body[field];

            // Required check
            if (rules.required) {
                if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                    return next(ApiError.badRequest(`Field '${field}' is required`));
                }
            }

            // If not provided and not required, skip further checks
            if (value === undefined || value === null) {
                continue;
            }

            // String trim
            if (rules.trim && typeof value === 'string') {
                req.body[field] = value.trim();
                value = req.body[field];
            }

            // Type check: number
            if (rules.type === 'number') {
                const num = Number(value);
                if (isNaN(num)) {
                    return next(ApiError.badRequest(`Field '${field}' must be a valid number`));
                }
                if (rules.min !== undefined && num < rules.min) {
                    return next(ApiError.badRequest(`Field '${field}' must be at least ${rules.min}`));
                }
                if (rules.max !== undefined && num > rules.max) {
                    return next(ApiError.badRequest(`Field '${field}' must be at most ${rules.max}`));
                }
                req.body[field] = num;
            }

            // Type check: string
            if (rules.type === 'string') {
                if (typeof value !== 'string') {
                    return next(ApiError.badRequest(`Field '${field}' must be a string`));
                }
                if (rules.minLength && value.length < rules.minLength) {
                    return next(ApiError.badRequest(`Field '${field}' must be at least ${rules.minLength} characters`));
                }
            }

            // Type check: email
            if (rules.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(String(value))) {
                    return next(ApiError.badRequest(`Field '${field}' must be a valid email address`));
                }
            }
        }

        next();
    };
}

module.exports = validate;
