process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = 'test_secret_key';

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../models/models');

const adminToken = jwt.sign({ id: 1, email: 'admin@example.com', role: 'ADMIN' }, process.env.SECRET_KEY);

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Menu, Category, Dish Management API', () => {
    let menuId;
    let categoryId;
    let dishId;

    describe('Menu API', () => {
        it('should allow ADMIN to create a menu', async () => {
            const res = await request(app)
                .post('/api/menu')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Main Menu',
                    description: 'Daily dishes'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.menu).toHaveProperty('id');
            expect(res.body.menu.name).toBe('Main Menu');
            menuId = res.body.menu.id;
        });

        it('should fetch all menus publicly', async () => {
            const res = await request(app).get('/api/menu');
            expect(res.statusCode).toBe(200);
            expect(res.body.rows.length).toBeGreaterThan(0);
        });

        it('should fail creating menu without name (400)', async () => {
            const res = await request(app)
                .post('/api/menu')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'No name' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('Category API', () => {
        it('should allow ADMIN to create a category', async () => {
            const res = await request(app)
                .post('/api/category')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Soups',
                    description: 'Hot soups',
                    menuId
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.category).toHaveProperty('id');
            expect(res.body.category.name).toBe('Soups');
            categoryId = res.body.category.id;
        });

        it('should fetch one category with dishes', async () => {
            const res = await request(app).get(`/api/category/${categoryId}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('category');
            expect(res.body).toHaveProperty('dishes');
        });

        it('should return 404 for non-existent category', async () => {
            const res = await request(app).get('/api/category/9999');
            expect(res.statusCode).toBe(404);
        });
    });

    describe('Dish API', () => {
        it('should allow ADMIN to create a dish', async () => {
            const res = await request(app)
                .post('/api/dish')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Borscht',
                    price: 120.50,
                    description: 'Traditional Ukrainian soup',
                    rating: 5,
                    categoryId
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.dish).toHaveProperty('id');
            expect(res.body.dish.name).toBe('Borscht');
            dishId = res.body.dish.id;
        });

        it('should reject creating dish with non-positive price (400)', async () => {
            const res = await request(app)
                .post('/api/dish')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Free Food',
                    price: 0,
                    categoryId
                });

            expect(res.statusCode).toBe(400);
        });

        it('should fetch all dishes publicly with pagination', async () => {
            const res = await request(app).get('/api/dish?page=1&limit=5');
            expect(res.statusCode).toBe(200);
            expect(res.body.rows.length).toBeGreaterThan(0);
        });

        it('should fetch single dish by ID', async () => {
            const res = await request(app).get(`/api/dish/${dishId}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.id).toBe(dishId);
        });
    });
});
