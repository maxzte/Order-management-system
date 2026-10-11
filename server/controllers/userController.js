const { User, Basket, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateJwt = (id, email, role) => {
    return jwt.sign(
        { id, email, role },
        process.env.SECRET_KEY,
        { expiresIn: '24h' }
    );
};

class UserController {
    async reg(req, res, next) {
        let transaction;
        try {
            const { email, password, name, role } = req.body;
            if (!email || !password) {
                return next(ApiError.badRequest('Email and password are required!'));
            }

            const candidate = await User.findOne({ where: { email } });
            if (candidate) {
                return next(ApiError.badRequest('User with this email already exists!'));
            }

            transaction = await sequelize.transaction();
            const hashPassword = await bcrypt.hash(password, 10);
            const user = await User.create({ name: name || '', email, password: hashPassword, role: 'USER' }, { transaction });
            await Basket.create({ userId: user.id }, { transaction });
            await transaction.commit();

            const token = generateJwt(user.id, user.email, user.role);
            return res.json({ token, id: user.id, role: user.role });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal('Registration error: ' + e.message));
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return next(ApiError.badRequest('Email and password are required!'));
            }

            const user = await User.findOne({ where: { email } });
            if (!user) {
                return next(ApiError.badRequest('User not found!'));
            }

            const comparePassword = bcrypt.compareSync(password, user.password);
            if (!comparePassword) {
                return next(ApiError.badRequest('Wrong password!'));
            }

            const token = generateJwt(user.id, user.email, user.role);
            return res.json({ token, id: user.id, role: user.role });
        } catch (e) {
            return next(ApiError.internal('Login error: ' + e.message));
        }
    }

    async authCheck(req, res, next) {
        try {
            const token = generateJwt(req.user.id, req.user.email, req.user.role);
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