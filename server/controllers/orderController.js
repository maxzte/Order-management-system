const { Order, OrderItem, Dish, User, Basket, BasketItem, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const { model } = require('../dataBase');


class OrderController {
    async create(req, res) {
        const { userId } = req.params;
        let transaction;
        let orderAmount = 0;
        try {
            transaction = await sequelize.transaction();
            const basketItems = await BasketItem.findAll({
                where: { basketId: userId },
                include: [{ model: Dish }]
            });

            for (const item of basketItems)
                orderAmount += item.dish.price * item.quantity;

            if (orderAmount <= 0)
                return res.json(ApiError.badRequest('Total amount cannot be <= 0'));

            const status = 'Обробка замовлення';
            const order = await Order.create({
                orderAcceptanceTime: new Date(),
                orderAmount,
                status,
                userId
            }, { transaction });

            for (const item of basketItems) {
                await OrderItem.create({
                    price: item.dish.price,
                    amount: item.quantity,
                    orderId: order.id,
                    dishId: item.dishId
                }, { transaction });
            }

            for (const item of basketItems) {
                await BasketItem.destroy({
                    where: { id: item.id },
                    transaction
                });
            }
            await transaction.commit();

            return res.json({ order });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(ApiError.badRequest('something went wrong: ' + e));
        }
    }

    // async create(req, res) {
    //     const { userId } = req.params
    //     let transaction;
    //     let orderAmount = 0;
    //     try {
    //         const basketItems = await BasketItem.findAll({
    //             where: { basketId: userId },
    //             include: [{ model: Dish }]
    //         });

    //         for (const item of basketItems)
    //             orderAmount += item.dish.price * item.quantity;

    //         if (orderAmount <= 0)
    //             return res.json(ApiError.badRequest('Total amount cannot be <= 0'));

    //         const status = 'Обробка замовлення';
    //         transaction = await sequelize.transaction();
    //         const order = await Order.create({
    //             orderAcceptanceTime: new Date(),
    //             orderAmount,
    //             status,
    //             userId
    //         }, { transaction });

    //         await transaction.commit();
    //         for (const item of basketItems) {
    //             await OrderItem.create({
    //                 price: item.dish.price,
    //                 amount: item.quantity,
    //                 orderId: order.id,
    //                 dishId: item.dishId
    //             });
    //         }

    //         return res.json({ order })
    //     } catch (e) {
    //         if (transaction) await transaction.rollback();
    //         return res.json(ApiError.badRequest('something went wrong: ' + e))
    //     }
    // }

    async getAll(req, res) {
        const orders = await Order.findAndCountAll({ include: [{ model: User }] })
        if (!orders)
            return res.json(ApiError.badRequest('Not found!'))

        return res.json(orders)
    }

    //for client
    async getAllById(req, res) {
        const { id } = req.params
        let { dir, limit, page } = req.query
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 9;
        let offset = page * limit - limit;
        let order = [];
        if (!Number(id))
            return res.json(ApiError.badRequest('not valid id'));

        if (dir)
            order.push(['createdAt', dir || 'DESC']);

        const orders = await Order.findAndCountAll({
            where: { userId: id },
            limit,
            offset,
            order,
            include: [
                {
                    model: User,
                    attributes: ['name']
                },
                {
                    model: OrderItem,
                    include: [
                        {
                            model: Dish,
                            attributes: ['name', 'price', 'img']
                        }
                    ]
                }
            ]
        });
        if (!orders)
            return res.json(ApiError.badRequest('Not found!'))

        return res.json(orders);
    }

    async getOne(req, res) {
        const { id } = req.params;
        const order = await Order.findOne({
            where: { id },
            include: [{
                model: User,
                attributes: ['id', 'name', 'email'],
            },
            {
                model: OrderItem,
                include: [{
                    model: Dish,
                    attributes: ['name', 'price', 'img'],
                }],
            },
            ],
        });
        return res.json(order);
    }

    //оновлюємо замовлення - видаляємо страву або оновлюємо кількість страв в замовленні
    async updateOrder(req, res) {
        const { userId } = req.params;
        const { dishId, quantity, del } = req.body;
        let transaction;
        let orderAmount = 0;
        try {
            transaction = await sequelize.transaction();
            if (!Number(userId)) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Invalid userId!'));
            }
            if (!Number(dishId)) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Invalid dishId!'));
            }
            const order = await Order.findOne({ where: { userId }, transaction });
            if (!order) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Order not found for this user'));
            }
            if (dishId && quantity) {
                if (quantity <= 0 || !Number(quantity)) {
                    await transaction.rollback();
                    return res.json(ApiError.badRequest('Not valid quantity!'));
                }
                const orderItem = await OrderItem.findOne({
                    where: { orderId: order.id, dishId },
                    transaction
                });
                if (!orderItem) {
                    await transaction.rollback();
                    return res.json(ApiError.badRequest('Order item not found'));
                }
                orderItem.amount = quantity;
                await orderItem.save({ transaction });
            } else if (dishId && del) {
                const orderItem = await OrderItem.findOne({
                    where: { orderId: order.id, dishId },
                    transaction
                });
                if (orderItem) await orderItem.destroy()
            }
            const orderItems = await OrderItem.findAll({
                where: { orderId: order.id },
                include: [{ model: Dish }],
                transaction
            });
            for (const item of orderItems)
                orderAmount += item.price * item.amount;

            await order.update({ orderAmount }, { transaction });
            await transaction.commit();
            const updatedOrder = await Order.findOne({
                where: { id: order.id },
                include: [{ model: OrderItem, include: [Dish] }]
            });

            return res.json(updatedOrder);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(ApiError.badRequest('something went wrong: ' + e));
        }
    }

    async deleteOne(req, res, next) {
        const { id } = req.params;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            if (!Number(id))
                return res.json(ApiError.badRequest('Invalid ID'));

            const order = await Order.findOne({ where: { id } });
            if (!order) return res.json(ApiError.notFound('Order not found'));
            await order.destroy();
            await transaction.commit();
            return res.json({ message: 'Order deleted successfully' });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(e);
        }
    }

    async updateStatus(req, res) {
        const { orderId } = req.params;
        const { status } = req.body;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            if (!Number(orderId))
                return res.json(ApiError.badRequest('Invalid order ID'));

            const validStatuses = ['Обробка замовлення', 'Замовлення виконується', 'Замовлення виконане', 'Оплачено'];
            if (!validStatuses.includes(status))
                return res.json(ApiError.badRequest('Invalid status'));

            const order = await Order.findByPk(orderId);
            if (!order)
                return res.json(ApiError.notFound('Order not found'));

            order.status = status;
            await order.save();
            await transaction.commit();

            return res.json({ order });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(e);
        }
    }
}

module.exports = new OrderController()