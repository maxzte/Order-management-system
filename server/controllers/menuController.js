const { Menu, Category, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const uuid = require('uuid');
const path = require('path');
const { deleteStaticFile, DEFAULT_IMAGE } = require('../utils/fileHelper');

class MenuController {
    async create(req, res, next) {
        let { name, description } = req.body;
        let fileName = DEFAULT_IMAGE;
        let transaction;

        if (!name) {
            return next(ApiError.badRequest('Name is required!'));
        }

        try {
            if (req.files && req.files.img) {
                const img = req.files.img;
                fileName = uuid.v4() + path.extname(img.name || '.jpg');
                await img.mv(path.resolve(__dirname, '..', 'static', fileName));
            }

            transaction = await sequelize.transaction();
            const menu = await Menu.create({
                name,
                description: description || '',
                img: fileName
            }, { transaction });

            await transaction.commit();
            return res.json({ menu });
        } catch (e) {
            if (transaction) await transaction.rollback();
            if (fileName !== DEFAULT_IMAGE) await deleteStaticFile(fileName);
            return next(ApiError.internal('Failed to create menu: ' + e.message));
        }
    }

    async getAll(req, res, next) {
        try {
            let { limit, page } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 9;
            let offset = page * limit - limit;

            const menus = await Menu.findAndCountAll({
                limit,
                offset,
                include: [{ model: Category, attributes: ['id', 'name'] }]
            });

            return res.json(menus);
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
            const menu = await Menu.findOne({
                where: { id },
                include: [{
                    model: Category,
                    attributes: ['id', 'name', 'description', 'img']
                }]
            });

            if (!menu) {
                return next(ApiError.notFound('Menu not found'));
            }

            return res.json(menu);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async updateMenu(req, res, next) {
        const { id } = req.params;
        let { name, description } = req.body;
        let transaction;

        if (!Number(id)) {
            return next(ApiError.badRequest('Invalid ID'));
        }

        try {
            transaction = await sequelize.transaction();
            const existingMenu = await Menu.findOne({ where: { id }, transaction });
            if (!existingMenu) {
                await transaction.rollback();
                return next(ApiError.notFound('Menu not found!'));
            }

            const oldImage = existingMenu.img;
            let newImage = oldImage;

            if (req.files && req.files.img) {
                const img = req.files.img;
                newImage = uuid.v4() + path.extname(img.name || '.jpg');
                await img.mv(path.resolve(__dirname, '..', 'static', newImage));
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (newImage !== undefined) updateData.img = newImage;

            await existingMenu.update(updateData, { transaction });
            await transaction.commit();

            if (newImage !== oldImage) {
                await deleteStaticFile(oldImage);
            }

            const updatedMenu = await Menu.findByPk(id, {
                include: [{ model: Category }]
            });

            return res.json(updatedMenu);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Failed to update menu: ' + e.message));
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
            const menu = await Menu.findOne({ where: { id }, transaction });
            if (!menu) {
                await transaction.rollback();
                return next(ApiError.notFound('Menu not found'));
            }

            const imageToDelete = menu.img;
            await menu.destroy({ transaction });
            await transaction.commit();

            await deleteStaticFile(imageToDelete);

            return res.json({ message: 'Menu deleted successfully' });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Error deleting menu: ' + e.message));
        }
    }
}

module.exports = new MenuController();