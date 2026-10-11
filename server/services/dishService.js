const { Dish, Category, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const { saveStaticFile, DEFAULT_IMAGE } = require('../utils/fileHelper');
const { getPagination } = require('../utils/paginationHelper');

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
        const { limit: queryLimit, offset } = getPagination(page, limit);

        let order = [];
        if (sort === 'price') {
            order.push(['price', dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']);
        } else if (sort === 'rating') {
            order.push(['rating', dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
        } else {
            order.push(['id', 'ASC']);
        }

        return await Dish.findAndCountAll({
            order,
            limit: queryLimit,
            offset,
            include: [{ model: Category }]
        });
    }

    /**
     * Fetches a single dish by ID.
     */
    async getDishById(id) {
        if (!Number(id)) {
            throw ApiError.badRequest('Invalid ID');
        }

        const dish = await Dish.findOne({
            where: { id },
            include: [{ model: Category }]
        });

        if (!dish) {
            throw ApiError.notFound('Dish not found');
        }

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
        return { message: 'Dish deleted successfully' };
    }
}

module.exports = new DishService();
