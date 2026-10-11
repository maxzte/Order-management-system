const { Basket, BasketItem, Dish, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');

class BasketController {
    async create(req, res, next) {
        const { userId } = req.params;
        let transaction;
        try {
            if (!Number(userId)) {
                return next(ApiError.badRequest('Invalid user id'));
            }

            transaction = await sequelize.transaction();
            const [basket] = await Basket.findOrCreate({
                where: { userId },
                defaults: { totalAmount: 0 },
                transaction
            });
            await transaction.commit();

            return res.json(basket);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Something went wrong: ' + e.message));
        }
    }

    async addItemToBasket(req, res, next) {
        const { userId } = req.params;
        const { dishId, quantity } = req.body;
        let transaction;

        const numQuantity = Number(quantity);
        if (!Number(userId) || !Number(dishId) || !numQuantity || numQuantity <= 0) {
            return next(ApiError.badRequest('Invalid input data'));
        }

        try {
            transaction = await sequelize.transaction();
            const [basket] = await Basket.findOrCreate({
                where: { userId },
                defaults: { totalAmount: 0 },
                transaction
            });

            const dish = await Dish.findByPk(dishId, { transaction });
            if (!dish) {
                await transaction.rollback();
                return next(ApiError.notFound('Dish not found'));
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

            await transaction.commit();
            return res.json(basketItem);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Something went wrong: ' + e.message));
        }
    }

    async getAll(req, res, next) {
        try {
            const baskets = await Basket.findAndCountAll();
            return res.json(baskets);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    // Supports passing either basket.id or userId (fallback to match client index.html?id=userId)
    async getAllItemsFromBasket(req, res, next) {
        const { id } = req.params;
        let { dir, limit, page } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 9;
        let offset = page * limit - limit;
        let order = [];

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid id'));
        }

        try {
            let basket = await Basket.findOne({ where: { id } });
            if (!basket) {
                basket = await Basket.findOne({ where: { userId: id } });
            }

            if (!basket) {
                return next(ApiError.notFound('Basket not found'));
            }

            if (dir) {
                order.push(['createdAt', dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
            }

            const basketItems = await BasketItem.findAndCountAll({
                where: { basketId: basket.id },
                order,
                limit,
                offset,
                include: [{
                    model: Dish
                }]
            });

            return res.json(basketItems);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async getOneItemFromBasket(req, res, next) {
        const { id } = req.params;
        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid id'));
        }

        try {
            const basketItem = await BasketItem.findOne({
                where: { id },
                include: [{
                    model: Dish,
                    attributes: ['name', 'price', 'img']
                }]
            });

            if (!basketItem) {
                return next(ApiError.notFound('Basket item not found'));
            }

            return res.json(basketItem);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async updBasketItems(req, res, next) {
        const { id } = req.params;
        const basketItemsArr = req.body;
        let transaction;

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid id'));
        }

        try {
            transaction = await sequelize.transaction();
            let basket = await Basket.findOne({ where: { id }, transaction });
            if (!basket) {
                basket = await Basket.findOne({ where: { userId: id }, transaction });
            }

            if (!basket) {
                await transaction.rollback();
                return next(ApiError.notFound('Basket not found'));
            }

            if (!Array.isArray(basketItemsArr) || !basketItemsArr.length) {
                await transaction.rollback();
                return next(ApiError.badRequest('Basket items array is empty or not valid'));
            }

            for (const item of basketItemsArr) {
                const { basketItemId, dishId, quantity } = item;

                const basketItem = await BasketItem.findOne({
                    where: { id: basketItemId, basketId: basket.id },
                    transaction
                });

                if (basketItem) {
                    if (dishId) basketItem.dishId = dishId;
                    if (quantity !== undefined) {
                        const q = Number(quantity);
                        if (q <= 0) {
                            await basketItem.destroy({ transaction });
                            continue;
                        }
                        basketItem.quantity = q;
                    }
                    await basketItem.save({ transaction });
                } else {
                    await transaction.rollback();
                    return next(ApiError.notFound(`Basket item with id ${basketItemId} not found`));
                }
            }

            await transaction.commit();
            return res.json({ message: 'Basket items updated successfully' });
        } catch (error) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Internal server error: ' + error.message));
        }
    }

    async deleteOneItemFromBasket(req, res, next) {
        const { id } = req.params;
        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid id'));
        }

        try {
            const basketItem = await BasketItem.findOne({ where: { id } });
            if (!basketItem) {
                return next(ApiError.notFound('Item does not exist!'));
            }

            await basketItem.destroy();
            return res.json({ message: 'Item deleted!' });
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async deleteAllItemsFromBasket(req, res, next) {
        try {
            const basketItems = await BasketItem.findAll();
            if (basketItems.length > 0) {
                for (const item of basketItems) {
                    await item.destroy();
                }
                return res.json({ message: 'Items deleted!' });
            } else {
                return res.json({ message: 'No items in basket to delete' });
            }
        } catch (error) {
            return next(ApiError.internal('Internal server error: ' + error.message));
        }
    }
}

module.exports = new BasketController();