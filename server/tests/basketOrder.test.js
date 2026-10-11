process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = 'test_secret_key';

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { sequelize, User, Basket, Dish, Category, Menu } = require('../models/models');

const adminToken = jwt.sign({ id: 1, email: 'admin@example.com', role: 'ADMIN' }, process.env.SECRET_KEY);

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Basket and Order Lifecycle API', () => {
    let user;
    let dish;
    let orderId;

    beforeAll(async () => {
        // Setup initial user and basket
        user = await User.create({
            name: 'Customer 1',
            email: 'customer@example.com',
            password: 'secret_hash_pwd',
            role: 'USER'
        });
        await Basket.create({ userId: user.id });

        const menu = await Menu.create({ name: 'Dinner', description: 'Dinner Menu' });
        const category = await Category.create({ name: 'Pizza', menuId: menu.id, description: 'Italian' });
        dish = await Dish.create({
            name: 'Margherita',
            price: 150.00,
            description: 'Cheese pizza',
            categoryId: category.id
        });
    });

    it('should add item to basket', async () => {
        const res = await request(app)
            .post(`/api/basket/addDishes/${user.id}`)
            .send({
                dishId: dish.id,
                quantity: 2
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('quantity', 2);
    });

    it('should fetch all basket items for user', async () => {
        const res = await request(app)
            .get(`/api/basket/allItems/${user.id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.rows.length).toBe(1);
        expect(res.body.rows[0].dishId).toBe(dish.id);
    });

    it('should create an order from basket and empty the basket', async () => {
        const res = await request(app)
            .post(`/api/order/${user.id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('order');
        expect(res.body.order.orderAmount).toBe(300.00); // 150 * 2
        expect(res.body.order.status).toBe('Обробка замовлення');
        orderId = res.body.order.id;

        // Verify basket is now empty
        const basketRes = await request(app).get(`/api/basket/allItems/${user.id}`);
        expect(basketRes.body.rows.length).toBe(0);
    });

    it('should fail creating order when basket is empty (400)', async () => {
        const res = await request(app)
            .post(`/api/order/${user.id}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Basket is empty/);
    });

    it('should fetch order details by orderId', async () => {
        const res = await request(app)
            .get(`/api/order/${orderId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(orderId);
        expect(res.body.order_items.length).toBe(1);
        expect(res.body.order_items[0].dishId).toBe(dish.id);
    });

    it('should allow ADMIN to update order status', async () => {
        const res = await request(app)
            .patch(`/api/order/updStatus/${orderId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'Замовлення виконується' });

        expect(res.statusCode).toBe(200);
        expect(res.body.order.status).toBe('Замовлення виконується');
    });

    it('should reject invalid order status (400)', async () => {
        const res = await request(app)
            .patch(`/api/order/updStatus/${orderId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'Non-existent status' });

        expect(res.statusCode).toBe(400);
    });
});
