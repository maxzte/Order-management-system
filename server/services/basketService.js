const { Basket, BasketItem, Dish, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const { getPagination } = require('../utils/paginationHelper');

class BasketService {
    /**
     * Finds or creates a basket for a given user.
     */
    async getOrCreateBasket(userId, transaction) {
        const [basket] = await Basket.findOrCreate({
            where: { userId },
            defaults: { totalAmount: 0 },
            transaction
        });
        return basket;
    }

    /**
     * Finds a basket by ID or userId fallback.
     */
    async findBasketByIdOrUserId(id, transaction) {
        let basket = await Basket.findOne({ where: { id }, transaction });
        if (!basket) {
            basket = await Basket.findOne({ where: { userId: id }, transaction });
        }
        return basket;
    }

    /**
     * Adds an item to a user's basket or increments existing quantity.
     */
    async addItem(userId, dishId, quantity) {
        const numQuantity = Number(quantity);
        if (!Number(userId) || !Number(dishId) || !numQuantity || numQuantity <= 0) {
            throw ApiError.badRequest('Invalid input data');
        }

        const transaction = await sequelize.transaction();
        try {
            const basket = await this.getOrCreateBasket(userId, transaction);

            const dish = await Dish.findByPk(dishId, { transaction });
            if (!dish) {
                await transaction.rollback();
                throw ApiError.notFound('Dish not found');
            }

            const [basketItem, created] = await BasketItem.findOrCreate({
                where: { basketId: basket.id, dishId },
                defaults: { quantity: numQuantity },
                transaction
            });

            if (!created) {
                basketItem.quantity += numQuantity;
                await basketItem.save({ transaction });
            }

            basket.totalAmount += dish.price * numQuantity;
            await basket.save({ transaction });

            await transaction.commit();
            return basketItem;
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Fetches all items from a basket with pagination.
     */
    async getItems(id, { page, limit, dir } = {}) {
        const { limit: queryLimit, offset } = getPagination(page, limit);
        let order = [];
        if (dir) {
            order.push(['createdAt', dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
        }

        const basket = await this.findBasketByIdOrUserId(id);
        if (!basket) {
            throw ApiError.notFound('Basket not found');
        }

        const basketItems = await BasketItem.findAndCountAll({
            where: { basketId: basket.id },
            order,
            limit: queryLimit,
            offset,
            include: [{ model: Dish }]
        });

        return { basket, basketItems };
    }

    /**
     * Fetches one item from basket by item ID.
     */
    async getItemById(itemId) {
        if (!Number(itemId)) {
            throw ApiError.badRequest('Invalid id');
        }

        const basketItem = await BasketItem.findOne({
            where: { id: itemId },
            include: [{ model: Dish, attributes: ['name', 'price', 'img'] }]
        });

        if (!basketItem) {
            throw ApiError.notFound('Item not found');
        }

        return basketItem;
    }

    /**
     * Deletes one item from basket.
     */
    async deleteItem(basketItemId) {
        if (!Number(basketItemId)) {
            throw ApiError.badRequest('Invalid id');
        }

        const transaction = await sequelize.transaction();
        try {
            const item = await BasketItem.findByPk(basketItemId, {
                include: [{ model: Dish }],
                transaction
            });

            if (!item) {
                await transaction.rollback();
                throw ApiError.notFound('Item not found in basket');
            }

            const basket = await Basket.findByPk(item.basketId, { transaction });
            if (basket && item.dish) {
                basket.totalAmount = Math.max(0, basket.totalAmount - item.dish.price * item.quantity);
                await basket.save({ transaction });
            }

            await item.destroy({ transaction });
            await transaction.commit();
            return { message: 'Item deleted successfully' };
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Clears all items from basket.
     */
    async clearBasket(basketId) {
        const transaction = await sequelize.transaction();
        try {
            await BasketItem.destroy({ where: { basketId }, transaction });
            const basket = await Basket.findByPk(basketId, { transaction });
            if (basket) {
                basket.totalAmount = 0;
                await basket.save({ transaction });
            }
            await transaction.commit();
            return { message: 'All items deleted successfully' };
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }
}

module.exports = new BasketService();
