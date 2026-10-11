process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = 'test_secret_key';

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { sequelize, User, Basket, BasketItem, Dish, Category, Menu, Order, OrderItem } = require('../models/models');
const validate = require('../middleware/validator');

const adminToken = jwt.sign({ id: 100, email: 'admin@example.com', role: 'ADMIN' }, process.env.SECRET_KEY);
const user1Token = jwt.sign({ id: 201, email: 'user1@example.com', role: 'USER' }, process.env.SECRET_KEY);
const user2Token = jwt.sign({ id: 202, email: 'user2@example.com', role: 'USER' }, process.env.SECRET_KEY);

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Business Logic & Edge Cases Testing Suite', () => {
    let user1, user2, menu, category, dish;

    beforeAll(async () => {
        user1 = await User.create({
            id: 201,
            name: 'User One',
            email: 'user1@example.com',
            password: 'hashed_password',
            role: 'USER'
        });
        await Basket.create({ userId: user1.id });

        user2 = await User.create({
            id: 202,
            name: 'User Two',
            email: 'user2@example.com',
            password: 'hashed_password',
            role: 'USER'
        });
        await Basket.create({ userId: user2.id });

        menu = await Menu.create({ name: 'Summer Menu', description: 'Fresh delights' });
        category = await Category.create({ name: 'Salads', menuId: menu.id, description: 'Green salads' });
        dish = await Dish.create({
            name: 'Caesar Salad',
            price: 180.00,
            description: 'Crispy salad',
            categoryId: category.id
        });
    });

    describe('Basket Edge Cases & Integrity', () => {
        it('should reject adding non-existent dish with 404', async () => {
            const res = await request(app)
                .post(`/api/basket/addDishes/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ dishId: 99999, quantity: 1 });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toMatch(/Dish not found/);
        });

        it('should reject invalid or negative quantity with 400', async () => {
            const resNegative = await request(app)
                .post(`/api/basket/addDishes/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ dishId: dish.id, quantity: -3 });

            expect(resNegative.statusCode).toBe(400);

            const resZero = await request(app)
                .post(`/api/basket/addDishes/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ dishId: dish.id, quantity: 0 });

            expect(resZero.statusCode).toBe(400);

            const resNan = await request(app)
                .post(`/api/basket/addDishes/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ dishId: dish.id, quantity: 'abc' });

            expect(resNan.statusCode).toBe(400);
        });

        it('should correctly increment quantity and totalAmount on repeated addition', async () => {
            const res1 = await request(app)
                .post(`/api/basket/addDishes/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ dishId: dish.id, quantity: 1 });

            expect(res1.statusCode).toBe(200);

            const res2 = await request(app)
                .post(`/api/basket/addDishes/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ dishId: dish.id, quantity: 2 });

            expect(res2.statusCode).toBe(200);

            const basketRes = await request(app)
                .get(`/api/basket/allItems/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(basketRes.statusCode).toBe(200);
            expect(basketRes.body.rows.length).toBe(1);
            expect(basketRes.body.rows[0].quantity).toBe(3);
        });

        it('should return 404 when querying single non-existent basket item', async () => {
            const res = await request(app)
                .get('/api/basket/999999')
                .set('Authorization', `Bearer ${user1Token}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toMatch(/Item not found/);
        });

        it('should return 404 when deleting non-existent basket item', async () => {
            const res = await request(app)
                .delete('/api/basket/888888')
                .set('Authorization', `Bearer ${user1Token}`);

            expect(res.statusCode).toBe(404);
        });

        it('should reset basket totalAmount to 0 when clearing basket', async () => {
            const user1Basket = await Basket.findOne({ where: { userId: user1.id } });
            expect(user1Basket.totalAmount).toBeGreaterThan(0);

            const clearRes = await request(app)
                .delete('/api/basket')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ basketId: user1Basket.id });

            expect(clearRes.statusCode).toBe(200);

            const updatedBasket = await Basket.findByPk(user1Basket.id);
            expect(updatedBasket.totalAmount).toBe(0);

            const itemsRes = await request(app)
                .get(`/api/basket/allItems/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`);
            expect(itemsRes.body.rows.length).toBe(0);
        });
    });

    describe('Order Edge Cases & Transaction Integrity', () => {
        it('should fail order creation and rollback if dish was deleted after being added to basket', async () => {
            // Create a temporary dish
            const tempDish = await Dish.create({
                name: 'Temporary Dish',
                price: 100,
                description: 'To be deleted',
                categoryId: category.id
            });

            // Add to user2's basket
            await request(app)
                .post(`/api/basket/addDishes/${user2.id}`)
                .set('Authorization', `Bearer ${user2Token}`)
                .send({ dishId: tempDish.id, quantity: 2 });

            // Soft delete the dish after it was added to basket
            await tempDish.destroy();

            // Attempt to create order
            const orderRes = await request(app)
                .post(`/api/order/${user2.id}`)
                .set('Authorization', `Bearer ${user2Token}`);

            expect(orderRes.statusCode).toBe(400);
            expect(orderRes.body.message).toMatch(/Dish in basket no longer exists/);

            // Verify no order was created in database
            const orders = await Order.findAll({ where: { userId: user2.id } });
            expect(orders.length).toBe(0);

            // Clean up user2 basket
            const user2Basket = await Basket.findOne({ where: { userId: user2.id } });
            await BasketItem.destroy({ where: { basketId: user2Basket.id } });
        });

        it('should reject status update for non-existent order with 404', async () => {
            const res = await request(app)
                .patch('/api/order/updStatus/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'Замовлення виконується' });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toMatch(/Order not found/);
        });

        it('should prevent non-admin user from viewing other users order (BOLA 403)', async () => {
            // First add item and create legitimate order for user1
            await request(app)
                .post(`/api/basket/addDishes/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ dishId: dish.id, quantity: 1 });

            const createRes = await request(app)
                .post(`/api/order/${user1.id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(createRes.statusCode).toBe(200);
            const user1OrderId = createRes.body.order.id;

            // user2 attempts to read user1 order
            const bolaRes = await request(app)
                .get(`/api/order/${user1OrderId}`)
                .set('Authorization', `Bearer ${user2Token}`);

            expect(bolaRes.statusCode).toBe(403);
            expect(bolaRes.body.message).toMatch(/Forbidden/);
        });

        it('should prevent user2 from viewing all orders of user1 (BOLA 403)', async () => {
            const res = await request(app)
                .get(`/api/order/all/${user1.id}`)
                .set('Authorization', `Bearer ${user2Token}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/);
        });
    });

    describe('Catalog & Category Edge Cases', () => {
        it('should reject updating non-existent category with 404', async () => {
            const res = await request(app)
                .patch('/api/category/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Name' });

            expect(res.statusCode).toBe(404);
        });

        it('should reject deleting non-existent category with 404', async () => {
            const res = await request(app)
                .delete('/api/category/999999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
        });

        it('should reject updating non-existent dish with 404', async () => {
            const res = await request(app)
                .patch('/api/dish/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Dish Name' });

            expect(res.statusCode).toBe(404);
        });

        it('should reject updating dish with negative price with 400', async () => {
            const res = await request(app)
                .patch(`/api/dish/${dish.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: -50 });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/Price must be greater than 0/);
        });

        it('should reject deleting non-existent dish with 404', async () => {
            const res = await request(app)
                .delete('/api/dish/999999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
        });
    });

    describe('Declarative Schema Validator Edge Cases', () => {
        const schema = {
            title: { type: 'string', required: true, minLength: 3, trim: true },
            amount: { type: 'number', required: true, min: 1, max: 100 },
            contactEmail: { type: 'email', required: false }
        };

        const validateMiddleware = validate(schema);

        it('should fail when required field is empty string or spaces', () => {
            const req = { body: { title: '   ', amount: 10 } };
            const next = jest.fn();
            validateMiddleware(req, {}, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
        });

        it('should trim string and validate minLength', () => {
            const req = { body: { title: '  ab  ', amount: 10 } };
            const next = jest.fn();
            validateMiddleware(req, {}, next);

            // Trimmed length is 2 < 3
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
        });

        it('should enforce min and max number bounds', () => {
            const reqBelow = { body: { title: 'Valid Title', amount: 0 } };
            const nextBelow = jest.fn();
            validateMiddleware(reqBelow, {}, nextBelow);
            expect(nextBelow).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));

            const reqAbove = { body: { title: 'Valid Title', amount: 150 } };
            const nextAbove = jest.fn();
            validateMiddleware(reqAbove, {}, nextAbove);
            expect(nextAbove).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
        });

        it('should validate email format if provided', () => {
            const reqInvalid = { body: { title: 'Valid', amount: 5, contactEmail: 'not-an-email' } };
            const nextInvalid = jest.fn();
            validateMiddleware(reqInvalid, {}, nextInvalid);
            expect(nextInvalid).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));

            const reqValid = { body: { title: 'Valid', amount: 5, contactEmail: 'test@domain.com' } };
            const nextValid = jest.fn();
            validateMiddleware(reqValid, {}, nextValid);
            expect(nextValid).toHaveBeenCalledWith();
        });
    });
});
