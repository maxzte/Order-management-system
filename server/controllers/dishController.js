const { Dish, sequelize, Category } = require('../models/models');
const ApiError = require('../error/apiError');
const uuid = require('uuid');
const path = require('path');

class DishController {
    async create(req, res, next) {
        let { name, price, description, rating, categoryId } = req.body;
        let fileName = '';
        let transaction;

        if (!name || !price || !categoryId) {
            return next(ApiError.badRequest('Name, price and categoryId are required'));
        }

        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice <= 0) {
            return next(ApiError.badRequest('Price must be greater than 0'));
        }

        try {
            if (req.files && req.files.img) {
                const img = req.files.img;
                fileName = uuid.v4() + path.extname(img.name || '.jpg');
                await img.mv(path.resolve(__dirname, '..', 'static', fileName));
            }

            transaction = await sequelize.transaction();
            const dish = await Dish.create({
                name,
                price: numPrice,
                description: description || '',
                rating: rating || 0,
                img: fileName,
                categoryId
            }, { transaction });

            await transaction.commit();
            return res.json({ dish });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Failed to create dish: ' + e.message));
        }
    }

    async getAll(req, res, next) {
        try {
            let { sort, dir, limit, page } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 9;
            let offset = page * limit - limit;

            let order = [];
            if (sort === 'price') order.push(['price', dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']);
            else if (sort === 'rating') order.push(['rating', dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
            else order.push(['id', 'ASC']);

            const dishes = await Dish.findAndCountAll({
                order,
                limit,
                offset,
                include: [{ model: Category }]
            });

            return res.json(dishes);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async getOne(req, res, next) {
        const { id } = req.params;
        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid ID'));
        }

        try {
            const dish = await Dish.findOne({
                where: { id },
                include: [{ model: Category }]
            });

            if (!dish) {
                return next(ApiError.notFound('Dish not found'));
            }

            return res.json(dish);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async updateDish(req, res, next) {
        const { id } = req.params;
        let { name, price, description, rating, categoryId } = req.body;
        let transaction;

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid ID'));
        }

        try {
            transaction = await sequelize.transaction();
            const existingDish = await Dish.findByPk(id, { transaction });
            if (!existingDish) {
                await transaction.rollback();
                return next(ApiError.notFound('Dish not found!'));
            }

            let fileName = existingDish.img;
            if (req.files && req.files.img) {
                const img = req.files.img;
                fileName = uuid.v4() + path.extname(img.name || '.jpg');
                await img.mv(path.resolve(__dirname, '..', 'static', fileName));
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (rating !== undefined) updateData.rating = rating;
            if (categoryId !== undefined) updateData.categoryId = categoryId;
            if (fileName !== undefined) updateData.img = fileName;

            if (price !== undefined) {
                const numPrice = Number(price);
                if (isNaN(numPrice) || numPrice <= 0) {
                    await transaction.rollback();
                    return next(ApiError.badRequest('Price must be greater than 0'));
                }
                updateData.price = numPrice;
            }

            await existingDish.update(updateData, { transaction });
            await transaction.commit();

            const updated = await Dish.findByPk(id, { include: [{ model: Category }] });
            return res.json(updated);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Failed to update dish: ' + e.message));
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
            const dish = await Dish.findOne({ where: { id }, transaction });
            if (!dish) {
                await transaction.rollback();
                return next(ApiError.notFound('Dish not found'));
            }

            await dish.destroy({ transaction });
            await transaction.commit();

            return res.json({ message: 'Dish deleted successfully' });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Failed to delete dish: ' + e.message));
        }
    }
}

module.exports = new DishController();