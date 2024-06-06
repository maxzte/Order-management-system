
const { Basket, BasketItem, Dish, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');

class BasketController {
    async create(req, res) {
        const { userId } = req.params;
        let transaction;
        try {
            if (!Number(userId))
                return res.json(ApiError.badRequest('not valid id'));

            transaction = await sequelize.transaction();
            const basket = await Basket.findOrCreate({ where: { userId } }, { transaction })
            await transaction.commit();

            return res.json(basket);
        } catch (e) {
            if (transaction)
                await transaction.rollback();

            return res.json(ApiError.badRequest('something went wrong. ' + e));
        }
    }

    async addItemToBasket(req, res) {
        const { userId } = req.params;
        const { dishId, quantity } = req.body;

        if (!Number(userId) || !Number(dishId) || !Number(quantity))
            return res.json(ApiError.badRequest('Invalid input data'));

        const basket = await Basket.findOne({ where: { userId } });
        if (!basket)
            return res.json(ApiError.badRequest('Basket not found for this user'));

        const dish = await Dish.findByPk(dishId);
        if (!dish)
            return res.json(ApiError.badRequest('Dish not found'));

        const [basketItem, created] = await BasketItem.findOrCreate({
            where: { basketId: basket.id, dishId },
            defaults: { quantity, price: dish.price }
        });

        if (!created) {
            basketItem.quantity += quantity;
            await basketItem.save();
        }

        return res.json(basketItem);
    }

    async getAll(req, res) {
        const baskets = await Basket.findAndCountAll()
        if (!baskets)
            return res.json(ApiError.badRequest('baskets not found'))

        return res.json(baskets)
    }

    async getAllItemsFromBasket(req, res) {
        const { id } = req.params;
        let { dir, limit, page } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 9;
        let offset = page * limit - limit;
        let order = [];

        if (!Number(id)) return res.json(ApiError.badRequest('not valid id'));

        const basket = await Basket.findOne({ where: { id } });
        if (!basket)
            return res.json(ApiError.badRequest('Basket not found for this user'));

        if (dir) order.push(['createdAt', dir || 'DESC']);

        const basketItems = await BasketItem.findAndCountAll({
            where: { basketId: basket.id },
            order,
            limit,
            offset,
            include: [{
                model: Dish
            }]
        });

        if (!basketItems) return res.json(ApiError.badRequest('Not found'));

        return res.json(basketItems);
    }

    async getOneItemFromBasket(req, res) {
        const { id } = req.params;
        if (!Number(id))
            return res.json(ApiError.badRequest('not valid id'));

        const basketItem = await BasketItem.findOne({
            where: { id },
            include: [{
                model: Dish,
                attributes: ['name', 'price', 'img']
            }]
        })
        if (!basketItem)
            return res.json(ApiError.badRequest('Not found!'))

        return res.json(basketItem);
    }

    async updBasketItems(req, res) {
        const { id } = req.params;
        const basketItemsArr = req.body;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            const basket = await Basket.findOne({ where: { id } });
            if (!basket)
                return res.json(ApiError.badRequest('Basket not found for this user'));

            if (!Array.isArray(basketItemsArr) || !basketItemsArr.length) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Basket items array is empty or not valid'));
            }

            for (const item of basketItemsArr) {
                const { basketItemId, dishId, quantity } = item;

                const basketItem = await BasketItem.findOne({
                    where: { id: basketItemId, basketId: id },
                    transaction
                });
                if (basketItem) {
                    basketItem.dishId = dishId;
                    basketItem.quantity = quantity;
                    await basketItem.save({ transaction });
                } else {
                    await transaction.rollback();
                    return res.json(ApiError.badRequest(`Basket item with id ${basketItemId} not found`));
                }
            }
            await transaction.commit();

            return res.json({ message: 'Basket items updated successfully' });
        } catch (error) {
            if (transaction) await transaction.rollback();
            return res.status(500).json({ message: 'Internal server error', error });
        }
    }


    async deleteOneItemFromBasket(req, res) {
        const { id } = req.params;
        if (!Number(id))
            return res.json(ApiError.badRequest('not valid id'));

        const basketItem = await BasketItem.findOne({ where: { id } })

        if (basketItem) {
            basketItem.destroy();
            return res.json(ApiError.badRequest('Item deleted!'))
        } else return res.json(ApiError.badRequest('Item not exist!'))
    }

    async deleteAllItemsFromBasket(req, res) {
        const basketItems = await BasketItem.findAll()

        if (basketItems.length > 0) {
            for (const item of basketItems) {
                await item.destroy();
            }
            return res.json({ message: 'Items deleted!' });
        } else return res.json(ApiError.badRequest('Items not exist!'))

    } catch(error) {
        console.error("Error deleting items from basket:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = new BasketController()