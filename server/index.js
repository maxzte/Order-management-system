const app = require('./app');
const sequelize = require('./dataBase');
const models = require('./models/models');
const logger = require('./utils/logger');
const port = process.env.PORT || 9000;

let server;

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        server = app.listen(port, () => logger.info(`Server started on port: ${port}`));

        // Reverse proxy and Slowloris protection timeouts
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal, exitCode = 0) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed.');
            try {
                await sequelize.close();
                logger.info('Database connection pool closed.');
                process.exit(exitCode);
            } catch (err) {
                logger.error('Error closing database connection:', err);
                process.exit(1);
            }
        });

        // Force shutdown after 10 seconds if hanging
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000).unref();
    } else {
        process.exit(exitCode);
    }
};

// Process-level resilience: catch unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection at:', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : null,
    });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception thrown:', error);
    // Gracefully shutdown with exit code 1 to let orchestrator restart
    gracefulShutdown('uncaughtException', 1);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));

start();