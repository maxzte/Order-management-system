process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = 'test_secret_key';

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { sequelize, User, Dish, Category, Menu, Feedback } = require('../models/models');

const adminToken = jwt.sign({ id: 999, email: 'admin@example.com', role: 'ADMIN' }, process.env.SECRET_KEY);

describe('Feedback Security & Dashboard API', () => {
    let user1, user2, user1Token, user2Token;
    let dish;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        user1 = await User.create({
            id: 10,
            name: 'User One',
            email: 'user1@example.com',
            password: 'pwd',
            role: 'USER'
        });
        user1Token = jwt.sign({ id: user1.id, email: user1.email, role: 'USER' }, process.env.SECRET_KEY);

        user2 = await User.create({
            id: 20,
            name: 'User Two',
            email: 'user2@example.com',
            password: 'pwd',
            role: 'USER'
        });
        user2Token = jwt.sign({ id: user2.id, email: user2.email, role: 'USER' }, process.env.SECRET_KEY);

        const menu = await Menu.create({ name: 'Menu 1', description: 'Desc 1' });
        const category = await Category.create({ name: 'Cat 1', menuId: menu.id, description: 'Cat Desc' });
        dish = await Dish.create({ name: 'Soup', price: 50, description: 'Delicious soup', categoryId: category.id });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('Feedback IDOR/BOLA Protection', () => {
        it('should reject unauthenticated feedback creation (401)', async () => {
            const res = await request(app)
                .post(`/api/feedback/${user1.id}`)
                .send({ dishId: dish.id, text: 'Great soup!' });

            expect(res.statusCode).toBe(401);
        });

        it('should allow user to create feedback for themselves', async () => {
            const res = await request(app)
                .post(`/api/feedback/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ dishId: dish.id, text: 'Great soup!' });

            expect(res.statusCode).toBe(200);
            expect(res.body.text).toBe('Great soup!');
        });

        it('should reject user2 attempting to create feedback under user1 id (403)', async () => {
            const res = await request(app)
                .post(`/api/feedback/${user1.id}`)
                .set('Authorization', `Bearer ${user2Token}`)
                .send({ dishId: dish.id, text: 'Impersonated feedback' });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/);
        });

        it('should reject unauthenticated feedback deletion (401)', async () => {
            const res = await request(app)
                .delete(`/api/feedback/${user1.id}`)
                .send({ dishId: dish.id });

            expect(res.statusCode).toBe(401);
        });

        it('should reject user2 attempting to delete user1 feedback (403 IDOR)', async () => {
            const res = await request(app)
                .delete(`/api/feedback/${user1.id}`)
                .set('Authorization', `Bearer ${user2Token}`)
                .send({ dishId: dish.id });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/);
        });

        it('should allow ADMIN to delete user1 feedback', async () => {
            const res = await request(app)
                .delete(`/api/feedback/${user1.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ dishId: dish.id });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Feedback was deleted');
        });
    });

    describe('Dashboard Analytics & Basic Info', () => {
        it('should require ADMIN role for dashboard basic info', async () => {
            const userRes = await request(app)
                .get('/api/dashBoard')
                .set('Authorization', `Bearer ${user1Token}`);

            expect(userRes.statusCode).toBe(403);

            const adminRes = await request(app)
                .get('/api/dashBoard')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(adminRes.statusCode).toBe(200);
            expect(adminRes.body).toHaveProperty('usersCount');
            expect(adminRes.body).toHaveProperty('ordersCount');
        });

        it('should return aggregated chart data for ADMIN', async () => {
            const res = await request(app)
                .post('/api/dashBoard?period=Day')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
});
