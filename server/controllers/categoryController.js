const { Category, Dish, Menu, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const uuid = require('uuid');
const path = require('path');

class CategoryController {
    async create(req, res) {
        let { name, menuId, description } = req.body;
        const { img } = req.files
        let fileName = uuid.v4() + '.jpg'
        let transaction;
        try {
            transaction = await sequelize.transaction();
            img.mv(path.resolve(__dirname, '..', 'static', fileName))
            if (!name || !menuId) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Name or menuId is empty!'));
            }
            const category = await Category.create({ name, menuId, description, img: fileName }, { transaction })
            await transaction.commit();

            return res.json({ category })
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(ApiError.badRequest('Failed to create category.' + e));
        }
    }

    async getAll(req, res) {
        let { limit, page } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 9;
        let offset = page * limit - limit;

        const categories = await Category.findAndCountAll({
            limit,
            offset,
            include: [{ model: Menu }]
        });
        if (!categories)
            return res.json(ApiError.badRequest('Categories is empty!'));

        return res.json(categories);
    }

    async getOne(req, res) {
        const { id } = req.params;
        let { sort, dir, limit, page } = req.query
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 9;
        let offset = page * limit - limit;

        if (!Number(id)) return res.json(ApiError.badRequest('Invalid ID'));

        let order = [];
        if (sort) order.push([{ model: Dish }, sort, dir || 'DESC']);

        let category = await Category.findOne({ where: { id } });
        if (!category) return res.json(ApiError.badRequest('Not found'));

        let dishes = await Dish.findAndCountAll({
            where: { categoryId: id },
            order,
            limit,
            offset,
            attributes: [ 'id', 'name', 'price', 'description', 'rating', 'img'],
        });
        // category = await Category.findAndCountAll({
        //     where: { id },
        //     order,
        //     limit,
        //     offset,
        //     include: [{
        //         model: Dish,
        //         attributes: ['name', 'price', 'description', 'rating', 'img'],
        //     }],
        // });
        if (!category) return res.json(ApiError.badRequest('Not found'));

        return res.json({
            category,
            dishes: dishes.rows,
            count: dishes.count
        });
        // return res.json(category)
    }

    async updateCategory(req, res) {
        const { id } = req.params;
        const { name, menuId, description } = req.body;
        const img = req.files ? req.files.img : null;
        let fileName;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            if (img) {
                fileName = uuid.v4() + '.jpg'
                img.mv(path.resolve(__dirname, '..', 'static', fileName))
            }
            const category = await Category.update(
                { name, menuId, description, img: fileName },
                { where: { id } },
                { transaction }
            );
            if (!category) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Category not found!'))
            }
            await transaction.commit();
            const updCategory = await Category.findByPk(id);

            return res.json(updCategory)
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(e);
        }
    }

    async deleteOne(req, res, next) {
        const { id } = req.params;
        try {
            if (!Number(id)) return next(ApiError.badRequest('Invalid ID'));

            const category = await Category.findOne({ where: { id } });
            if (!category) return next(ApiError.notFound('Category not found'));
            await category.destroy();

            return res.status(200).json({ message: 'Category deleted successfully' });
        } catch (e) {
            console.error('Error deleting category:', e);
            return next(e);
        }
    }
}

module.exports = new CategoryController()