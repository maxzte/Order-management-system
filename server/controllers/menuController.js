const { Menu, Category, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const uuid = require('uuid');
const path = require('path');

class MenuController {
    async create(req, res) {
        let { name, description } = req.body;
        const { img } = req.files;
        let fileName;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            if (img) {
                fileName = uuid.v4() + '.jpg'
                img.mv(path.resolve(__dirname, '..', 'static', fileName))
            }
            if (!name) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Name is empty!'));
            }
            const menu = await Menu.create({ name, description, img: fileName }, { transaction });
            await transaction.commit();

            return res.json({ menu });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(ApiError.badRequest('Failed to create menu.' + e));
        }
    }

    async getAll(req, res) {
        let { limit, page } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 9;
        let offset = page * limit - limit;

        const menus = await Menu.findAndCountAll({
            limit,
            offset,
            include: [{ model: Category, attributes: ['name'] }]
        });

        return res.json(menus);
    }

    async getOne(req, res) {
        const { id } = req.params
        if (!Number(id))
            return res.json(ApiError.badRequest('Invalid ID'));

        const menu = await Menu.findOne({
            where: { id }, include: [{
                model: Category,
                attributes: [ 'id', 'name', 'description', 'img']
            }]
        });
        if (menu === null)
            return res.json(ApiError.badRequest('Not found'));

        return res.json(menu)
    }

    async updateMenu(req, res) {
        const { id } = req.params;
        let { name, description } = req.body;
        const img = req.files ? req.files.img : null;
        // const { img } = req.files.img;
        let fileName;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            if (img) {
                fileName = uuid.v4() + '.jpg'
                img.mv(path.resolve(__dirname, '..', 'static', fileName))
            }
            
            const menu = await Menu.findOne({ where: { id }, transaction });
            if (!menu) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Menu not found!'));
            }
            const updateData = { name, description };
            if (fileName) {
                updateData.img = fileName;
            }
            const updMenu = await Menu.update(
                updateData,
                { where: { id }, transaction }
            );
            // const updMenu = await Menu.update(
            //     { name, description, img: fileName },
            //     { where: { id }, transaction }
            // );
            await transaction.commit();

            return res.json(updMenu);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(e);
        }
    }

    async deleteOne(req, res) {
        const { id } = req.params;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            if (!Number(id)) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Invalid ID'));
            }
            const menu = await Menu.findOne({ where: { id } });
            if (!menu) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Menu not found'));
            }
            await menu.destroy();
            await transaction.commit();

            return res.json('Menu deleted successfully');
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(ApiError.badRequest('Not found or' + e));
        }
    }
}

module.exports = new MenuController()