const { User, Basket, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const authService = require('../services/authService');
const { getPagination } = require('../utils/paginationHelper');

class UserController {
    async reg(req, res, next) {
        try {
            const { email, password, name } = req.body;
            const result = await authService.register({ email, password, name });
            return res.json(result);
        } catch (e) {
            return next(e);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login({ email, password });
            return res.json(result);
        } catch (e) {
            return next(e);
        }
    }

    async authCheck(req, res, next) {
        try {
            const token = authService.generateToken(req.user.id, req.user.email, req.user.role);
            return res.json({ token, id: req.user.id, role: req.user.role });
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async getAllUsers(req, res, next) {
        try {
            const users = await User.findAndCountAll({
                attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
            });
            return res.json(users);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async getOneUser(req, res, next) {
        try {
            const { id } = req.params;
            if (!Number(id)) {
                return next(ApiError.badRequest('Invalid ID!'));
            }

            const user = await User.findOne({
                where: { id },
                attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
            });

            if (!user) {
                return next(ApiError.notFound('User not found!'));
            }

            return res.json(user);
        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async delete(req, res, next) {
        const { userId } = req.params;
        let transaction;
        try {
            if (!Number(userId)) {
                return next(ApiError.badRequest('UserId is not valid!'));
            }

            transaction = await sequelize.transaction();
            const user = await User.findOne({ where: { id: userId }, transaction });
            if (!user) {
                await transaction.rollback();
                return next(ApiError.notFound('User not found!'));
            }

            await user.destroy({ transaction });
            await transaction.commit();

            return res.json({ message: 'User was deleted!' });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Something went wrong: ' + e.message));
        }
    }
}

module.exports = new UserController();