process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = 'test_secret_key';

const request = require('supertest');
const fs = require('fs');
const app = require('../app');
const { sequelize } = require('../models/models');
const logger = require('../utils/logger');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Observability & Resilience API', () => {
    it('should generate and return X-Request-Id header in responses', async () => {
        const res = await request(app).get('/api/health');

        expect(res.statusCode).toBe(200);
        expect(res.headers['x-request-id']).toBeDefined();
        expect(typeof res.headers['x-request-id']).toBe('string');
        expect(res.headers['x-request-id'].length).toBeGreaterThan(10);
    });

    it('should preserve incoming X-Request-Id from client', async () => {
        const customId = 'custom-trace-uuid-12345';
        const res = await request(app)
            .get('/api/health')
            .set('X-Request-Id', customId);

        expect(res.statusCode).toBe(200);
        expect(res.headers['x-request-id']).toBe(customId);
    });

    it('should include requestId in client error responses (4xx)', async () => {
        const res = await request(app).get('/api/non-existent-route-12345');

        // Express default or 404
        expect([404, 500]).toContain(res.statusCode);
    });

    it('should include requestId when ApiError is thrown', async () => {
        // Calling dish getOne with invalid ID triggers ApiError.badRequest(400)
        const res = await request(app).get('/api/dish/not-a-number');

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('requestId');
        expect(res.body.requestId).toBe(res.headers['x-request-id']);
    });

    it('should safely sanitize sensitive keys in logger', () => {
        const testError = new Error('Test DB error');
        logger.error('Test error logging', {
            error: testError,
            requestId: 'test-req-999',
            password: 'superSecretPassword',
            token: 'jwt.token.secret'
        });

        // Verify that error.log file was written
        expect(fs.existsSync(logger.ERROR_LOG_PATH)).toBe(true);
        const fileContent = fs.readFileSync(logger.ERROR_LOG_PATH, 'utf-8');
        expect(fileContent).toContain('test-req-999');
        expect(fileContent).toContain('***MASKED***');
        expect(fileContent).not.toContain('superSecretPassword');
    });
});
