const app = require('./app');
const sequelize = require('./dataBase');
const models = require('./models/models');
const port = process.env.PORT || 9000;

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        app.listen(port, () => console.log('server started on port:' + port));
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

start();