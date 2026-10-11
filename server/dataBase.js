const { Sequelize } = require('sequelize');

if (process.env.NODE_ENV === 'test') {
    module.exports = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
    });
} else {
    module.exports = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            dialect: 'mysql',
            host: process.env.DB_HOST,
            port: process.env.DB_PORT
        }
    );
}
