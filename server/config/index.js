require('dotenv').config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '9000', 10),
    clientUrl: process.env.CLIENT_URL || '',
    jwt: {
        secret: process.env.SECRET_KEY || 'default_dev_secret_change_in_production',
        expiresIn: '24h',
    },
    db: {
        name: process.env.DB_NAME || 'orders_system',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'admin',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
    },
};

// Fail fast in production if security secret is absent or default
if (config.env === 'production' && (!process.env.SECRET_KEY || process.env.SECRET_KEY.includes('change_me'))) {
    console.error('FATAL: SECRET_KEY environment variable must be set to a secure secret in production!');
    process.exit(1);
}

module.exports = config;
