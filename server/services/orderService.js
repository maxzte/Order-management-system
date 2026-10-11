const { Order, OrderItem, Dish, Basket, BasketItem, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');

class OrderService {
    /**
     * Creates an order from a user's basket in an ACID database transaction.
     * Calculates total amount, creates order items in bulk, and clears the basket.
     *
     * @param {number|string} userId
     * @returns {Promise<Order>}
     */
    async createOrderFromBasket(userId) {
        const transaction = await sequelize.transaction();

        try {
            let basket = await Basket.findOne({ where: { userId }, transaction });
            if (!basket) {
                basket = await Basket.findOne({ where: { id: userId }, transaction });
            }

            if (!basket) {
                await transaction.rollback();
                throw ApiError.notFound('Basket not found for this user');
            }

            const basketItems = await BasketItem.findAll({
                where: { basketId: basket.id },
                include: [{ model: Dish }],
                transaction
            });

            if (!basketItems || basketItems.length === 0) {
                await transaction.rollback();
                throw ApiError.badRequest('Basket is empty');
            }

            let orderAmount = 0;
            for (const item of basketItems) {
                if (!item.dish) {
                    await transaction.rollback();
                    throw ApiError.badRequest('Dish in basket no longer exists');
                }
                orderAmount += item.dish.price * item.quantity;
            }

            if (orderAmount <= 0) {
                await transaction.rollback();
                throw ApiError.badRequest('Total amount cannot be <= 0');
            }

            const status = 'Обробка замовлення';
            const order = await Order.create({
                orderAcceptanceTime: new Date(),
                orderAmount: parseFloat(orderAmount.toFixed(2)),
                status,
                userId: basket.userId || userId
            }, { transaction });

            const orderItemsData = basketItems.map(item => ({
                price: item.dish.price,
                amount: item.quantity,
                orderId: order.id,
                dishId: item.dishId
            }));

            await OrderItem.bulkCreate(orderItemsData, { transaction });
            await BasketItem.destroy({ where: { basketId: basket.id }, transaction });

            await transaction.commit();
            return order;
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }
}

module.exports = new OrderService();
