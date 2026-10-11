const app = require('./app');
const sequelize = require('./dataBase');
const models = require('./models/models');
const port = process.env.PORT || 9000;

let server;

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        server = app.listen(port, () => console.log('server started on port:' + port));
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    if (server) {
        server.close(async () => {
            console.log('HTTP server closed.');
            try {
                await sequelize.close();
                console.log('Database connection pool closed.');
                process.exit(0);
            } catch (err) {
                console.error('Error closing database connection:', err);
                process.exit(1);
            }
        });

        // Force shutdown after 10 seconds if hanging
        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000).unref();
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();