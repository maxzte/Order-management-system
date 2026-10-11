require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const router = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const securityHeaders = require('./middleware/securityHeaders');
const requestLogger = require('./middleware/requestLogger');
const requestId = require('./middleware/requestId');

const app = express();

// Request ID tracing
app.use(requestId);

// Security headers & disable x-powered-by
app.disable('x-powered-by');
app.use(securityHeaders);

// Logging in non-test environments
app.use(requestLogger);

// CORS configuration supporting CLIENT_URL or permissive fallback
const corsOptions = process.env.CLIENT_URL
    ? { origin: process.env.CLIENT_URL.split(',').map(url => url.trim()) }
    : {};
app.use(cors(corsOptions));

// Body size limit protection (1MB)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static files
app.use('/static', express.static(path.resolve(__dirname, 'static')));

// File upload with 5MB max size limit and in-memory threshold protection
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    abortOnLimit: true,
    responseOnLimit: 'Розмір файлу перевищує ліміт 5MB',
}));

// Interactive OpenAPI / Swagger Documentation
const { swaggerUi, swaggerDocument } = require('./docs/swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use('/api', router);

// 404 JSON fallback for unhandled routes
const ApiError = require('./error/apiError');
app.use((req, res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
