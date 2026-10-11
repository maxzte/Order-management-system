const dishService = require('../services/dishService');

class DishController {
    async create(req, res, next) {
        try {
            const dish = await dishService.createDish(req.body, req.files?.img);
            return res.json({ dish });
        } catch (e) {
            return next(e);
        }
    }

    async getAll(req, res, next) {
        try {
            const dishes = await dishService.getAllDishes(req.query);
            return res.json(dishes);
        } catch (e) {
            return next(e);
        }
    }

    async getOne(req, res, next) {
        try {
            const dish = await dishService.getDishById(req.params.id);
            return res.json(dish);
        } catch (e) {
            return next(e);
        }
    }

    async updateDish(req, res, next) {
        try {
            const updated = await dishService.updateDish(req.params.id, req.body, req.files?.img);
            return res.json(updated);
        } catch (e) {
            return next(e);
        }
    }

    async updateCategory(req, res, next) {
        return this.updateDish(req, res, next);
    }

    async deleteOne(req, res, next) {
        try {
            const result = await dishService.deleteDish(req.params.id);
            return res.json(result);
        } catch (e) {
            return next(e);
        }
    }
}

module.exports = new DishController();