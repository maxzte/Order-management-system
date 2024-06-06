require('dotenv').config();

const express = require('express');
const sequelize = require('./dataBase');
const models = require('./models/models');
const port = process.env.port || 8000;
const cors = require('cors');
const fileUpload = require('express-fileupload')
const router = require('./routes/index')
const errorHandler = require('./middleware/errorHandler')
const path = require('path');

const app = express()

app.use(cors());
app.use(express.json());
app.use('/static', express.static(path.resolve(__dirname, 'static')));
app.use(fileUpload({}));
app.use('/api', router);

app.use(errorHandler)

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        app.listen(port, () => console.log('server started on port:' + port))
    } catch (error) {
        console.log(error);
    }
}

start();