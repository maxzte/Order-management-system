const { Dish, sequelize, Category } = require('../models/models');
const ApiError = require('../error/apiError');
const uuid = require('uuid');
const path = require('path');


class DishController {
    async create(req, res) {
        let { name, price, description, rating, categoryId } = req.body
        const { img } = req.files
        let fileName = uuid.v4() + '.jpg'
        let transaction;
        try {
            transaction = await sequelize.transaction();
            img.mv(path.resolve(__dirname, '..', 'static', fileName))
            if (price <= 0) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Price cannot be <= 0'));
            }

            const dish = await Dish.create({
                name, price, description, rating, img: fileName, categoryId
            },
                { transaction })
            await transaction.commit();

            return res.json({ dish })
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(ApiError.badRequest(e));
        }
    }

    async getAll(req, res) {
        let { sort, dir, limit, page } = req.query
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 9;
        let offset = page * limit - limit;

        let order = [];
        if (sort === 'price') order.push(['price', dir || 'ASC']);
        else if (sort === 'rating') order.push(['rating', dir || 'DESC']);

        const dishes = await Dish.findAndCountAll({
            order,
            limit,
            offset,
            include: [{ model: Category }]
        });
        if (!dishes) return res.json(ApiError.badRequest('Dishes is empty!'));

        return res.json(dishes);
    }

    async getOne(req, res) {
        const { id } = req.params
        if (!Number(id)) return next(ApiError.badRequest('not valid id'))

        const dish = await Dish.findOne({ where: { id } })

        return res.json(dish)
    }

    async updateDish(req, res) {
        const { id } = req.params;
        let { name, price, description, rating, categoryId } = req.body
        const img = req.files ? req.files.img : null;
        let fileName
        let transaction;
        try {
            // if(!rating) rating = 0;
            transaction = await sequelize.transaction();
            const existingDish = await Dish.findByPk(id);
            if (!existingDish) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Dish not found!'));
            }

            if (img) {
                fileName = uuid.v4() + '.jpg'
                img.mv(path.resolve(__dirname, '..', 'static', fileName))
            } else {
                fileName = existingDish.img; 
            }
            if (price <= 0) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Price cannot be <= 0'));
            }

            const dish = await Dish.update(
                { name, price, description, rating, img: fileName, categoryId },
                { where: { id }, transaction },
            )
            if (!dish) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Dish not found!'))
            }
            await transaction.commit();
            const updDish = await Dish.findByPk(id);

            return res.json(updDish)
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(e);
        }
    }

    async deleteOne(req, res) {
        const { id } = req.params
        let transaction;
        try {
            transaction = await sequelize.transaction();
            if (!Number(id)) {
                await transaction.rollback();
                return next(ApiError.badRequest('not valid id'))
            }

            const dish = await Dish.findOne({ where: { id } })
            if (!dish) {
                await transaction.rollback();
                return next(ApiError.badRequest('not found'))
            }
            await dish.destroy()
            await transaction.commit();

            return res.json('Deleting is completed');
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(e);
        }
    }
}

module.exports = new DishController()