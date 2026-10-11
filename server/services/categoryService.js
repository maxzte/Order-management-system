const { Category, Dish, Menu, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const { deleteStaticFile, saveStaticFile, DEFAULT_IMAGE } = require('../utils/fileHelper');
const { getPagination } = require('../utils/paginationHelper');
const cacheService = require('./cacheService');

class CategoryService {
    async createCategory({ name, menuId, description }, file) {
        if (!name || !menuId) {
            throw ApiError.badRequest('Name and menuId are required!');
        }

        let fileName = DEFAULT_IMAGE;
        let transaction;
        try {
            if (file) {
                fileName = await saveStaticFile(file);
            }

            transaction = await sequelize.transaction();
            const category = await Category.create({
                name,
                menuId,
                description: description || '',
                img: fileName
            }, { transaction });

            await transaction.commit();

            // Invalidate categories cache
            await cacheService.del('categories:*');

            return category;
        } catch (e) {
            if (transaction) await transaction.rollback();
            if (fileName !== DEFAULT_IMAGE) await deleteStaticFile(fileName);
            throw ApiError.internal('Failed to create category: ' + e.message);
        }
    }

    async getAllCategories({ page, limit }) {
        const cacheKey = `categories:all:${page || 1}:${limit || 10}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const { limit: queryLimit, offset } = getPagination(page, limit);
        const categories = await Category.findAndCountAll({
            limit: queryLimit,
            offset,
            include: [{ model: Menu }]
        });

        // Cache for 1 hour
        await cacheService.set(cacheKey, categories, 3600);
        return categories;
    }

    async getCategoryById(id, { sort, dir, limit, page }) {
        if (!Number(id)) {
            throw ApiError.badRequest('Invalid ID');
        }

        const cacheKey = `categories:${id}:${sort || 'default'}:${dir || 'asc'}:${page || 1}:${limit || 10}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const category = await Category.findOne({ where: { id } });
        if (!category) {
            throw ApiError.notFound('Category not found');
        }

        const { limit: queryLimit, offset } = getPagination(page, limit);
        let order = [];
        if (sort) order.push([sort, dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);

        const dishes = await Dish.findAndCountAll({
            where: { categoryId: id },
            order,
            limit: queryLimit,
            offset,
            attributes: ['id', 'name', 'price', 'description', 'rating', 'img'],
        });

        const result = {
            category,
            dishes: dishes.rows,
            count: dishes.count
        };

        await cacheService.set(cacheKey, result, 600);
        return result;
    }

    async updateCategory(id, { name, menuId, description }, file) {
        if (!Number(id)) {
            throw ApiError.badRequest('Invalid ID');
        }

        let transaction;
        try {
            transaction = await sequelize.transaction();
            const existingCategory = await Category.findByPk(id, { transaction });
            if (!existingCategory) {
                await transaction.rollback();
                throw ApiError.notFound('Category not found!');
            }

            const oldImage = existingCategory.img;
            let newImage = oldImage;

            if (file) {
                newImage = await saveStaticFile(file);
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

            // Invalidate cache
            await cacheService.del('categories:*');

            return await Category.findByPk(id, { include: [{ model: Menu }] });
        } catch (e) {
            if (transaction && !transaction.finished) await transaction.rollback();
            throw e;
        }
    }

    async deleteCategory(id) {
        if (!Number(id)) {
            throw ApiError.badRequest('Invalid ID');
        }

        let transaction;
        try {
            transaction = await sequelize.transaction();
            const category = await Category.findOne({ where: { id }, transaction });
            if (!category) {
                await transaction.rollback();
                throw ApiError.notFound('Category not found');
            }

            await category.destroy({ transaction });
            await transaction.commit();

            // Invalidate cache
            await cacheService.del('categories:*');

            return { message: 'Category deleted successfully' };
        } catch (e) {
            if (transaction && !transaction.finished) await transaction.rollback();
            throw e;
        }
    }
}

module.exports = new CategoryService();
