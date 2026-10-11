process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = 'test_secret_key';

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../models/models');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Middleware Access Control API', () => {
    const adminToken = jwt.sign({ id: 1, email: 'admin@example.com', role: 'ADMIN' }, process.env.SECRET_KEY);
    const userToken = jwt.sign({ id: 2, email: 'user@example.com', role: 'USER' }, process.env.SECRET_KEY);

    it('should allow ADMIN to access role-protected endpoints', async () => {
        const res = await request(app)
            .get('/api/user')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('rows');
    });

    it('should reject USER from ADMIN endpoints with 403 Forbidden', async () => {
        const res = await request(app)
            .get('/api/user')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/Forbidden/);
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
        const res = await request(app)
            .get('/api/user');

        expect(res.statusCode).toBe(401);
    });

    it('should reject malformed or invalid token with 401', async () => {
        const res = await request(app)
            .get('/api/user')
            .set('Authorization', 'Bearer invalid_garbage_token');

        expect(res.statusCode).toBe(401);
    });

    describe('Security Headers & Health Check', () => {
        it('should set security headers and hide X-Powered-By', async () => {
            const res = await request(app).get('/api/health');

            expect(res.statusCode).toBe(200);
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
            expect(res.headers['x-powered-by']).toBeUndefined();
        });

        it('should return 200 OK and database status on /api/health', async () => {
            const res = await request(app).get('/api/health');

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.database).toBe('connected');
            expect(typeof res.body.uptime).toBe('number');
        });
    });
});
