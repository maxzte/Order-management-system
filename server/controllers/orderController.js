const { Order, OrderItem, Dish, User, Basket, BasketItem, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const { getPagination } = require('../utils/paginationHelper');
const orderService = require('../services/orderService');

class OrderController {
    async create(req, res, next) {
        const { userId } = req.params;

        if (!Number(userId)) {
            return next(ApiError.badRequest('Invalid userId'));
        }

        if (req.user && req.user.role !== 'ADMIN' && String(req.user.id) !== String(userId)) {
            return next(ApiError.forbidden('Forbidden: Cannot create order for another user'));
        }

        try {
            const order = await orderService.createOrderFromBasket(userId);
            return res.json({ order });
        } catch (e) {
            return next(e);
        }
    }

    async getAll(req, res, next) {
        try {
            const orders = await Order.findAndCountAll({
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email']
                }],
                order: [['createdAt', 'DESC']]
            });
            return res.json(orders);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    // for client
    async getAllById(req, res, next) {
        const { id } = req.params;
        const { dir, limit, page } = req.query;
        const { limit: queryLimit, offset } = getPagination(page, limit);
        let order = [];

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid id'));
        }

        if (req.user && req.user.role !== 'ADMIN' && String(req.user.id) !== String(id)) {
            return next(ApiError.forbidden('Forbidden: Cannot view orders of another user'));
        }

        if (dir) {
            order.push(['createdAt', dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
        } else {
            order.push(['createdAt', 'DESC']);
        }

        try {
            const orders = await Order.findAndCountAll({
                where: { userId: id },
                limit: queryLimit,
                offset,
                order,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: OrderItem,
                        include: [
                            {
                                model: Dish,
                                attributes: ['id', 'name', 'price', 'img']
                            }
                        ]
                    }
                ]
            });

            return res.json(orders);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async getOne(req, res, next) {
        const { id } = req.params;
        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid id'));
        }

        try {
            const order = await Order.findOne({
                where: { id },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'email'],
                    },
                    {
                        model: OrderItem,
                        include: [{
                            model: Dish,
                            attributes: ['id', 'name', 'price', 'img'],
                        }],
                    },
                ],
            });

            if (!order) {
                return next(ApiError.notFound('Order not found'));
            }

            if (req.user && req.user.role !== 'ADMIN' && String(req.user.id) !== String(order.userId)) {
                return next(ApiError.forbidden('Forbidden: Cannot view order of another user'));
            }

            return res.json(order);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async updateOrder(req, res, next) {
        const { userId } = req.params;
        const { dishId, quantity, del } = req.body;
        let transaction;
        let orderAmount = 0;

        if (!Number(userId)) {
            return next(ApiError.badRequest('Invalid userId!'));
        }
        if (!Number(dishId)) {
            return next(ApiError.badRequest('Invalid dishId!'));
        }

        try {
            transaction = await sequelize.transaction();
            const order = await Order.findOne({ where: { userId }, transaction });
            if (!order) {
                await transaction.rollback();
                return next(ApiError.notFound('Order not found for this user'));
            }

            if (dishId && quantity) {
                const parsedQuantity = Number(quantity);
                if (parsedQuantity <= 0 || isNaN(parsedQuantity)) {
                    await transaction.rollback();
                    return next(ApiError.badRequest('Not valid quantity!'));
                }
                const orderItem = await OrderItem.findOne({
                    where: { orderId: order.id, dishId },
                    transaction
                });
                if (!orderItem) {
                    await transaction.rollback();
                    return next(ApiError.notFound('Order item not found'));
                }
                orderItem.amount = parsedQuantity;
                await orderItem.save({ transaction });
            } else if (dishId && del) {
                const orderItem = await OrderItem.findOne({
                    where: { orderId: order.id, dishId },
                    transaction
                });
                if (orderItem) {
                    await orderItem.destroy({ transaction });
                }
            }

            const orderItems = await OrderItem.findAll({
                where: { orderId: order.id },
                include: [{ model: Dish }],
                transaction
            });

            for (const item of orderItems) {
                orderAmount += item.price * item.amount;
            }

            await order.update({ orderAmount: parseFloat(orderAmount.toFixed(2)) }, { transaction });
            await transaction.commit();

            const updatedOrder = await Order.findOne({
                where: { id: order.id },
                include: [{ model: OrderItem, include: [Dish] }]
            });

            return res.json(updatedOrder);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Something went wrong: ' + e.message));
        }
    }

    async deleteOne(req, res, next) {
        const { id } = req.params;
        let transaction;

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid ID'));
        }

        try {
            transaction = await sequelize.transaction();
            const order = await Order.findOne({ where: { id }, transaction });
            if (!order) {
                await transaction.rollback();
                return next(ApiError.notFound('Order not found'));
            }

            await order.destroy({ transaction });
            await transaction.commit();

            return res.json({ message: 'Order deleted successfully' });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Something went wrong: ' + e.message));
        }
    }

    async updateStatus(req, res, next) {
        const { orderId } = req.params;
        const { status } = req.body;
        let transaction;

        if (!Number(orderId)) {
            return next(ApiError.badRequest('Invalid order ID'));
        }

        const validStatuses = ['Обробка замовлення', 'Замовлення виконується', 'Замовлення виконане', 'Оплачено'];
        if (!validStatuses.includes(status)) {
            return next(ApiError.badRequest('Invalid status'));
        }

        try {
            transaction = await sequelize.transaction();
            const order = await Order.findByPk(orderId, { transaction });
            if (!order) {
                await transaction.rollback();
                return next(ApiError.notFound('Order not found'));
            }

            order.status = status;
            await order.save({ transaction });
            await transaction.commit();

            return res.json({ order });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Something went wrong: ' + e.message));
        }
    }
}

module.exports = new OrderController();