const { Dish, Category, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const { saveStaticFile, DEFAULT_IMAGE } = require('../utils/fileHelper');
const { getPagination } = require('../utils/paginationHelper');
const cacheService = require('./cacheService');

class DishService {
    /**
     * Creates a new dish with optional image upload.
     */
    async createDish({ name, price, description, rating, categoryId }, file) {
        if (!name || !price || !categoryId) {
            throw ApiError.badRequest('Name, price and categoryId are required');
        }

        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice <= 0) {
            throw ApiError.badRequest('Price must be greater than 0');
        }

        let fileName = DEFAULT_IMAGE;
        if (file) {
            fileName = await saveStaticFile(file);
        }

        const transaction = await sequelize.transaction();
        try {
            const dish = await Dish.create({
                name,
                price: numPrice,
                description: description || '',
                rating: rating || 0,
                img: fileName,
                categoryId
            }, { transaction });

            await transaction.commit();

            // Invalidate dishes cache
            await cacheService.del('dishes:*');
            await cacheService.del('categories:*');

            return dish;
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw ApiError.internal('Failed to create dish: ' + error.message);
        }
    }

    /**
     * Fetches paginated dishes with sorting.
     */
    async getAllDishes({ sort, dir, limit, page }) {
        const cacheKey = `dishes:all:${sort || 'default'}:${dir || 'asc'}:${page || 1}:${limit || 10}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const { limit: queryLimit, offset } = getPagination(page, limit);

        let order = [];
        if (sort === 'price') {
            order.push(['price', dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']);
        } else if (sort === 'rating') {
            order.push(['rating', dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
        } else {
            order.push(['id', 'ASC']);
        }

        const dishes = await Dish.findAndCountAll({
            order,
            limit: queryLimit,
            offset,
            include: [{ model: Category }]
        });

        // Cache for 15 minutes
        await cacheService.set(cacheKey, dishes, 900);
        return dishes;
    }

    /**
     * Fetches a single dish by ID.
     */
    async getDishById(id) {
        if (!Number(id)) {
            throw ApiError.badRequest('Invalid ID');
        }

        const cacheKey = `dishes:item:${id}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        const dish = await Dish.findOne({
            where: { id },
            include: [{ model: Category }]
        });

        if (!dish) {
            throw ApiError.notFound('Dish not found');
        }

        await cacheService.set(cacheKey, dish, 900);
        return dish;
    }

    /**
     * Updates an existing dish with optional new image.
     */
    async updateDish(id, { name, price, description, rating, categoryId }, file) {
        if (!Number(id)) {
            throw ApiError.badRequest('Invalid ID');
        }

        const transaction = await sequelize.transaction();
        try {
            const existingDish = await Dish.findByPk(id, { transaction });
            if (!existingDish) {
                await transaction.rollback();
                throw ApiError.notFound('Dish not found!');
            }

            let newImage = existingDish.img;
            if (file) {
                newImage = await saveStaticFile(file);
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
                    throw ApiError.badRequest('Price must be greater than 0');
                }
                updateData.price = numPrice;
            }

            await existingDish.update(updateData, { transaction });
            await transaction.commit();

            // Invalidate cache
            await cacheService.del('dishes:*');
            await cacheService.del('categories:*');

            return await Dish.findByPk(id, { include: [{ model: Category }] });
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Soft deletes a dish.
     */
    async deleteDish(id) {
        if (!Number(id)) {
            throw ApiError.badRequest('Invalid ID');
        }

        const dish = await Dish.findByPk(id);
        if (!dish) {
            throw ApiError.notFound('Dish not found');
        }

        await dish.destroy();

        // Invalidate cache
        await cacheService.del('dishes:*');
        await cacheService.del('categories:*');

        return { message: 'Dish deleted successfully' };
    }
}

module.exports = new DishService();
