process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = 'test_secret_key';

const request = require('supertest');
const app = require('../app');
const { sequelize, User, Basket } = require('../models/models');

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('User Authentication API', () => {
    let token = '';
    let userId = null;

    it('should register a new user successfully and create a basket', async () => {
        const res = await request(app)
            .post('/api/user/reg')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'USER'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('role', 'USER');

        token = res.body.token;
        userId = res.body.id;

        // Verify basket was created for this user
        const basket = await Basket.findOne({ where: { userId } });
        expect(basket).not.toBeNull();
    });

    it('should fail registration with duplicate email (400)', async () => {
        const res = await request(app)
            .post('/api/user/reg')
            .send({
                name: 'Duplicate',
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail registration with missing fields (400)', async () => {
        const res = await request(app)
            .post('/api/user/reg')
            .send({
                email: 'incomplete@example.com'
            });

        expect(res.statusCode).toBe(400);
    });

    it('should login successfully with valid credentials', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.id).toBe(userId);
    });

    it('should fail login with incorrect password (400)', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Wrong password/);
    });

    it('should verify auth token via /api/user/auth', async () => {
        const res = await request(app)
            .get('/api/user/auth')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.id).toBe(userId);
    });

    it('should reject /api/user/auth without token (401)', async () => {
        const res = await request(app)
            .get('/api/user/auth');

        expect(res.statusCode).toBe(401);
    });
});
