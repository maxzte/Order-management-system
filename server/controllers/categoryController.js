const { Category, Dish, Menu, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const { deleteStaticFile, saveStaticFile, DEFAULT_IMAGE } = require('../utils/fileHelper');
const { getPagination } = require('../utils/paginationHelper');

class CategoryController {
    async create(req, res, next) {
        let { name, menuId, description } = req.body;
        let fileName = DEFAULT_IMAGE;
        let transaction;

        if (!name || !menuId) {
            return next(ApiError.badRequest('Name and menuId are required!'));
        }

        try {
            if (req.files && req.files.img) {
                fileName = await saveStaticFile(req.files.img);
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
            if (fileName !== DEFAULT_IMAGE) await deleteStaticFile(fileName);
            return next(ApiError.internal('Failed to create category: ' + e.message));
        }
    }

    async getAll(req, res, next) {
        try {
            const { limit, page } = req.query;
            const { limit: queryLimit, offset } = getPagination(page, limit);

            const categories = await Category.findAndCountAll({
                limit: queryLimit,
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
        const { sort, dir, limit, page } = req.query;
        const { limit: queryLimit, offset } = getPagination(page, limit);

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
                limit: queryLimit,
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

            const oldImage = existingCategory.img;
            let newImage = oldImage;

            if (req.files && req.files.img) {
                newImage = await saveStaticFile(req.files.img);
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (menuId !== undefined) updateData.menuId = menuId;
            if (description !== undefined) updateData.description = description;
            if (newImage !== undefined) updateData.img = newImage;

            await existingCategory.update(updateData, { transaction });
            await transaction.commit();

            if (newImage !== oldImage) {
                await deleteStaticFile(oldImage);
            }

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

            const imageToDelete = category.img;
            await category.destroy({ transaction });
            await transaction.commit();

            await deleteStaticFile(imageToDelete);

            return res.json({ message: 'Category deleted successfully' });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Error deleting category: ' + e.message));
        }
    }
}

module.exports = new CategoryController();