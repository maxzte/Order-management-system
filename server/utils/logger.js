const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.resolve(__dirname, '..', 'logs');
const ERROR_LOG_PATH = path.resolve(LOGS_DIR, 'error.log');
const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret'];

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Recursively masks sensitive fields in objects for safe logging.
 * @param {any} data
 * @returns {any}
 */
function sanitize(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(sanitize);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
            sanitized[key] = '***MASKED***';
        } else if (value && typeof value === 'object') {
            sanitized[key] = sanitize(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Appends a log entry to error.log.
 * @param {object} logEntry
 */
function appendToFile(logEntry) {
    try {
        const line = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(ERROR_LOG_PATH, line, 'utf-8');
    } catch (err) {
        console.error('[Logger] Failed to write to error.log:', err.message);
    }
}

const logger = {
    info(message, meta = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message,
            ...sanitize(meta)
        };
        if (process.env.NODE_ENV !== 'test') {
            console.log(`[INFO] ${entry.timestamp} ${message}`);
        }
    },

    warn(message, meta = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'WARN',
            message,
            ...sanitize(meta)
        };
        if (process.env.NODE_ENV !== 'test') {
            console.warn(`[WARN] ${entry.timestamp} ${message} (reqId: ${meta.requestId || 'n/a'})`);
        }
    },

    error(message, errorOrMeta = {}) {
        let errDetails = {};
        if (errorOrMeta instanceof Error) {
            errDetails = {
                name: errorOrMeta.name,
                message: errorOrMeta.message,
                stack: errorOrMeta.stack,
            };
        } else if (errorOrMeta.error instanceof Error) {
            errDetails = {
                name: errorOrMeta.error.name,
                message: errorOrMeta.error.message,
                stack: errorOrMeta.error.stack,
            };
        }

        const entry = {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message,
            ...sanitize(errorOrMeta),
            ...errDetails
        };

        if (process.env.NODE_ENV !== 'test') {
            console.error(`[ERROR] ${entry.timestamp} ${message} (reqId: ${entry.requestId || 'n/a'})`, entry.stack || '');
        }

        // Persist errors to error.log file
        appendToFile(entry);
    },

    LOGS_DIR,
    ERROR_LOG_PATH,
};

module.exports = logger;
