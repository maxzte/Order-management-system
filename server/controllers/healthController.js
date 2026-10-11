const sequelize = require('../dataBase');

/**
 * Health check handler: returns system uptime, timestamp, and database connectivity.
 */
async function healthCheck(req, res) {
    const healthStatus = {
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: 'connected',
    };

    try {
        await sequelize.authenticate();
        return res.status(200).json(healthStatus);
    } catch (error) {
        healthStatus.status = 'degraded';
        healthStatus.database = 'disconnected';
        healthStatus.error = error.message;
        return res.status(503).json(healthStatus);
    }
}

module.exports = {
    healthCheck,
};
