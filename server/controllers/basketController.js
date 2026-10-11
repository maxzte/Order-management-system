const ApiError = require('../error/apiError');
const basketService = require('../services/basketService');

class BasketController {
    async create(req, res, next) {
        const { userId } = req.params;
        try {
            if (!Number(userId)) {
                return next(ApiError.badRequest('Invalid user id'));
            }

            if (req.user && req.user.role !== 'ADMIN' && String(req.user.id) !== String(userId)) {
                return next(ApiError.forbidden('Forbidden: Cannot modify basket of another user'));
            }

            const basket = await basketService.getOrCreateBasket(userId);
            return res.json(basket);
        } catch (e) {
            return next(e);
        }
    }

    async addItemToBasket(req, res, next) {
        const { userId } = req.params;
        const { dishId, quantity } = req.body;

        if (req.user && req.user.role !== 'ADMIN' && String(req.user.id) !== String(userId)) {
            return next(ApiError.forbidden('Forbidden: Cannot add item to basket of another user'));
        }

        try {
            const basketItem = await basketService.addItem(userId, dishId, quantity);
            return res.json(basketItem);
        } catch (e) {
            return next(e);
        }
    }

    async getAll(req, res, next) {
        try {
            const { Basket, BasketItem, Dish } = require('../models/models');
            const baskets = await Basket.findAll({
                include: [{ model: BasketItem, include: [Dish] }]
            });
            return res.json(baskets);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async getAllItemsFromBasket(req, res, next) {
        const { id } = req.params;
        const { dir, limit, page } = req.query;

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid id'));
        }

        try {
            const { basket, basketItems } = await basketService.getItems(id, { page, limit, dir });

            if (req.user && req.user.role !== 'ADMIN' && String(req.user.id) !== String(basket.userId)) {
                return next(ApiError.forbidden('Forbidden: Cannot view basket of another user'));
            }

            return res.json(basketItems);
        } catch (e) {
            return next(e);
        }
    }

    async getOneItemFromBasket(req, res, next) {
        const { id } = req.params;
        try {
            const item = await basketService.getItemById(id);
            return res.json(item);
        } catch (e) {
            return next(e);
        }
    }

    async updBasketItems(req, res, next) {
        const { id } = req.params;
        const basketItemsArr = req.body;

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid id'));
        }

        if (!Array.isArray(basketItemsArr) || !basketItemsArr.length) {
            return next(ApiError.badRequest('Basket items array is empty or not valid'));
        }

        try {
            const basket = await basketService.findBasketByIdOrUserId(id);
            if (!basket) {
                return next(ApiError.notFound('Basket not found'));
            }

            const { BasketItem } = require('../models/models');
            for (const item of basketItemsArr) {
                const { basketItemId, dishId, quantity } = item;
                const basketItem = await BasketItem.findOne({
                    where: { id: basketItemId, basketId: basket.id }
                });

                if (!basketItem) {
                    return next(ApiError.notFound(`Basket item with id ${basketItemId} not found`));
                }

                if (dishId) basketItem.dishId = dishId;
                if (quantity !== undefined) {
                    const q = Number(quantity);
                    if (q <= 0) {
                        await basketItem.destroy();
                        continue;
                    }
                    basketItem.quantity = q;
                }
                await basketItem.save();
            }

            return res.json({ message: 'Basket items updated successfully' });
        } catch (error) {
            return next(ApiError.internal('Internal server error: ' + error.message));
        }
    }

    async deleteOneItemFromBasket(req, res, next) {
        const { id } = req.params;
        try {
            const result = await basketService.deleteItem(id);
            return res.json(result);
        } catch (e) {
            return next(e);
        }
    }

    async deleteAllItemsFromBasket(req, res, next) {
        try {
            const basketId = req.body?.basketId || (req.user ? req.user.id : null);
            if (basketId) {
                const result = await basketService.clearBasket(basketId);
                return res.json(result);
            }
            const { Basket, BasketItem } = require('../models/models');
            await BasketItem.destroy({ where: {} });
            await Basket.update({ totalAmount: 0 }, { where: {} });
            return res.json({ message: 'Items deleted!' });
        } catch (error) {
            return next(ApiError.internal('Internal server error: ' + error.message));
        }
    }
}

module.exports = new BasketController();