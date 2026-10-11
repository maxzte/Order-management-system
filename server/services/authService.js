const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Basket, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const config = require('../config');

class AuthService {
    generateToken(id, email, role) {
        return jwt.sign(
            { id, email, role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
    }

    /**
     * Registers a new user with hashed password and initial basket.
     */
    async register({ email, password, name }) {
        if (!email || !password) {
            throw ApiError.badRequest('Email and password are required!');
        }

        const candidate = await User.findOne({ where: { email } });
        if (candidate) {
            throw ApiError.badRequest('User with this email already exists!');
        }

        const transaction = await sequelize.transaction();
        try {
            const hashPassword = await bcrypt.hash(password, 10);
            const user = await User.create(
                { name: name || '', email, password: hashPassword, role: 'USER' },
                { transaction }
            );
            await Basket.create({ userId: user.id }, { transaction });
            await transaction.commit();

            const token = this.generateToken(user.id, user.email, user.role);
            return { token, id: user.id, role: user.role };
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            throw ApiError.internal('Registration error: ' + error.message);
        }
    }

    /**
     * Authenticates user using non-blocking asynchronous bcrypt comparison.
     */
    async login({ email, password }) {
        if (!email || !password) {
            throw ApiError.badRequest('Email and password are required!');
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw ApiError.badRequest('User not found!');
        }

        // Non-blocking async password comparison prevents event loop lag
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw ApiError.badRequest('Wrong password!');
        }

        const token = this.generateToken(user.id, user.email, user.role);
        return { token, id: user.id, role: user.role };
    }
}

module.exports = new AuthService();
