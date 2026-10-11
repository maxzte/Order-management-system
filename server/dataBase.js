const { Sequelize } = require('sequelize');

if (process.env.NODE_ENV === 'test') {
    module.exports = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
    });
} else {
    const isDevelopment = process.env.NODE_ENV === 'development';

    module.exports = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            dialect: 'mysql',
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            // Connection pool for high availability & resource management
            pool: {
                max: 10,
                min: 2,
                acquire: 30000,
                idle: 10000,
            },
            // Quiet SQL logs in production; can be turned on in dev via DEBUG_SQL=true
            logging: isDevelopment && process.env.DEBUG_SQL === 'true' ? console.log : false,
        }
    );
}
