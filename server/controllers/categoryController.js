const categoryService = require('../services/categoryService');

class CategoryController {
    async create(req, res, next) {
        try {
            const category = await categoryService.createCategory(req.body, req.files?.img);
            return res.json({ category });
        } catch (e) {
            return next(e);
        }
    }

    async getAll(req, res, next) {
        try {
            const categories = await categoryService.getAllCategories(req.query);
            return res.json(categories);
        } catch (e) {
            return next(e);
        }
    }

    async getOne(req, res, next) {
        try {
            const result = await categoryService.getCategoryById(req.params.id, req.query);
            return res.json(result);
        } catch (e) {
            return next(e);
        }
    }

    async updateCategory(req, res, next) {
        try {
            const updated = await categoryService.updateCategory(req.params.id, req.body, req.files?.img);
            return res.json(updated);
        } catch (e) {
            return next(e);
        }
    }

    async deleteOne(req, res, next) {
        try {
            const result = await categoryService.deleteCategory(req.params.id);
            return res.json(result);
        } catch (e) {
            return next(e);
        }
    }
}

module.exports = new CategoryController();