process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = 'test_secret_key';

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { sequelize, User, Dish, Category, Menu, Order, OrderItem } = require('../models/models');

const adminToken = jwt.sign({ id: 1, email: 'admin@example.com', role: 'ADMIN' }, process.env.SECRET_KEY);

describe('Soft Delete (Paranoid) Functionality', () => {
    let category;
    let dish;
    let user;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        user = await User.create({
            name: 'Soft User',
            email: 'softuser@example.com',
            password: 'pwd',
            role: 'USER'
        });

        const menu = await Menu.create({ name: 'Soft Menu', description: 'desc' });
        category = await Category.create({ name: 'Soft Category', menuId: menu.id, description: 'desc' });
        dish = await Dish.create({
            name: 'Soft Dish',
            price: 120,
            description: 'Delicious dish',
            categoryId: category.id
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should soft delete a dish (set deletedAt and exclude from catalog)', async () => {
        // Delete dish as ADMIN
        const delRes = await request(app)
            .delete(`/api/dish/${dish.id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(delRes.statusCode).toBe(200);
        expect(delRes.body.message).toBe('Dish deleted successfully');

        // Verify dish is excluded from public GET /api/dish
        const getRes = await request(app).get('/api/dish');
        expect(getRes.statusCode).toBe(200);
        const found = getRes.body.rows.find(d => d.id === dish.id);
        expect(found).toBeUndefined();

        // Verify direct findOne does not return it by default
        const directFind = await Dish.findByPk(dish.id);
        expect(directFind).toBeNull();

        // Verify database still holds the record with paranoid: false
        const paranoidFind = await Dish.findByPk(dish.id, { paranoid: false });
        expect(paranoidFind).not.toBeNull();
        expect(paranoidFind.deletedAt).toBeDefined();
        expect(paranoidFind.deletedAt).not.toBeNull();
    });

    it('should soft delete a user and prevent login', async () => {
        // Delete user as ADMIN
        const delRes = await request(app)
            .delete(`/api/user/${user.id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(delRes.statusCode).toBe(200);

        // Verify user cannot log in
        const loginRes = await request(app)
            .post('/api/user/login')
            .send({ email: 'softuser@example.com', password: 'pwd' });

        expect(loginRes.statusCode).toBe(400);
        expect(loginRes.body.message).toMatch(/User not found/);

        // Verify user still exists in database with paranoid: false
        const paranoidUser = await User.findByPk(user.id, { paranoid: false });
        expect(paranoidUser).not.toBeNull();
        expect(paranoidUser.deletedAt).not.toBeNull();
    });
});
