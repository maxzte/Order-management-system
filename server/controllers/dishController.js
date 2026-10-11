const { Dish, sequelize, Category } = require('../models/models');
const ApiError = require('../error/apiError');
const { deleteStaticFile, saveStaticFile, DEFAULT_IMAGE } = require('../utils/fileHelper');
const { getPagination } = require('../utils/paginationHelper');

class DishController {
    async create(req, res, next) {
        let { name, price, description, rating, categoryId } = req.body;
        let fileName = DEFAULT_IMAGE;
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
                fileName = await saveStaticFile(req.files.img);
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
            if (fileName !== DEFAULT_IMAGE) await deleteStaticFile(fileName);
            return next(ApiError.internal('Failed to create dish: ' + e.message));
        }
    }

    async getAll(req, res, next) {
        try {
            const { sort, dir, limit, page } = req.query;
            const { limit: queryLimit, offset } = getPagination(page, limit);

            let order = [];
            if (sort === 'price') order.push(['price', dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']);
            else if (sort === 'rating') order.push(['rating', dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
            else order.push(['id', 'ASC']);

            const dishes = await Dish.findAndCountAll({
                order,
                limit: queryLimit,
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

            const oldImage = existingDish.img;
            let newImage = oldImage;

            if (req.files && req.files.img) {
                newImage = await saveStaticFile(req.files.img);
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (rating !== undefined) updateData.rating = rating;
            if (categoryId !== undefined) updateData.categoryId = categoryId;
            if (newImage !== undefined) updateData.img = newImage;

            if (price !== undefined) {
                const numPrice = Number(price);
                if (isNaN(numPrice) || numPrice <= 0) {
                    await transaction.rollback();
                    if (newImage !== oldImage) await deleteStaticFile(newImage);
                    return next(ApiError.badRequest('Price must be greater than 0'));
                }
                updateData.price = numPrice;
            }

            await existingDish.update(updateData, { transaction });
            await transaction.commit();

            // Clean up old image if replaced
            if (newImage !== oldImage) {
                await deleteStaticFile(oldImage);
            }

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

            const imageToDelete = dish.img;
            await dish.destroy({ transaction });
            await transaction.commit();

            // Clean up file from disk
            await deleteStaticFile(imageToDelete);

            return res.json({ message: 'Dish deleted successfully' });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Failed to delete dish: ' + e.message));
        }
    }
}

module.exports = new DishController();