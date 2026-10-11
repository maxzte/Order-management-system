const { Category, Dish, Menu, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const uuid = require('uuid');
const path = require('path');

class CategoryController {
    async create(req, res, next) {
        let { name, menuId, description } = req.body;
        let fileName = '';
        let transaction;

        if (!name || !menuId) {
            return next(ApiError.badRequest('Name and menuId are required!'));
        }

        try {
            if (req.files && req.files.img) {
                const img = req.files.img;
                fileName = uuid.v4() + path.extname(img.name || '.jpg');
                await img.mv(path.resolve(__dirname, '..', 'static', fileName));
            }

            transaction = await sequelize.transaction();
            const category = await Category.create({
                name,
                menuId,
                description: description || '',
                img: fileName
            }, { transaction });

            await transaction.commit();
            return res.json({ category });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Failed to create category: ' + e.message));
        }
    }

    async getAll(req, res, next) {
        try {
            let { limit, page } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 9;
            let offset = page * limit - limit;

            const categories = await Category.findAndCountAll({
                limit,
                offset,
                include: [{ model: Menu }]
            });

            return res.json(categories);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async getOne(req, res, next) {
        const { id } = req.params;
        let { sort, dir, limit, page } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 9;
        let offset = page * limit - limit;

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid ID'));
        }

        try {
            const category = await Category.findOne({ where: { id } });
            if (!category) {
                return next(ApiError.notFound('Category not found'));
            }

            let order = [];
            if (sort) order.push([sort, dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);

            const dishes = await Dish.findAndCountAll({
                where: { categoryId: id },
                order,
                limit,
                offset,
                attributes: ['id', 'name', 'price', 'description', 'rating', 'img'],
            });

            return res.json({
                category,
                dishes: dishes.rows,
                count: dishes.count
            });
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async updateCategory(req, res, next) {
        const { id } = req.params;
        const { name, menuId, description } = req.body;
        let transaction;

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid ID'));
        }

        try {
            transaction = await sequelize.transaction();
            const existingCategory = await Category.findByPk(id, { transaction });
            if (!existingCategory) {
                await transaction.rollback();
                return next(ApiError.notFound('Category not found!'));
            }

            let fileName = existingCategory.img;
            if (req.files && req.files.img) {
                const img = req.files.img;
                fileName = uuid.v4() + path.extname(img.name || '.jpg');
                await img.mv(path.resolve(__dirname, '..', 'static', fileName));
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (menuId !== undefined) updateData.menuId = menuId;
            if (description !== undefined) updateData.description = description;
            if (fileName !== undefined) updateData.img = fileName;

            await existingCategory.update(updateData, { transaction });
            await transaction.commit();

            const updatedCategory = await Category.findByPk(id, { include: [{ model: Menu }] });
            return res.json(updatedCategory);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Failed to update category: ' + e.message));
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
            const category = await Category.findOne({ where: { id }, transaction });
            if (!category) {
                await transaction.rollback();
                return next(ApiError.notFound('Category not found'));
            }

            await category.destroy({ transaction });
            await transaction.commit();

            return res.json({ message: 'Category deleted successfully' });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Error deleting category: ' + e.message));
        }
    }
}

module.exports = new CategoryController();