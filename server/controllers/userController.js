const { User, Basket, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { transaction } = require('../dataBase');


const generateJwt = (id, email, role) => {
    return jwt.sign(
        { id, email, role },
        process.env.SECRET_KEY,
        { expiresIn: '24h' }
    )
}

class UserController {
    async reg(req, res) {
        const { email, password, name, role } = req.body
        if (!email || !password)
            return res.json(ApiError.badRequest('not valid password or email!'))

        const candidate = await User.findOne({ where: { email } })
        if (candidate)
            return res.json(ApiError.badRequest('user with this email already exist!'))

        const hashPassword = await bcrypt.hash(password, 5)
        const user = await User.create({ name, email, password: hashPassword, role })
        const basket = await Basket.create({ userId: user.id })
        const token = generateJwt(user.id, user.email, user.role)

        return res.json({ token })
    }

    async login(req, res) {
        const { email, password } = req.body
        const user = await User.findOne({ where: { email } })
        if (!user)
            return res.json(ApiError.internal('User not found!'))

        let comparePassword = bcrypt.compareSync(password, user.password)
        if (!comparePassword)
            return res.json(ApiError.internal('Wrong password!'))

        const token = generateJwt(user.id, user.email, user.role)
        const id = user.id
        const role = user.role;
        
        return res.json({ token, id, role })
    }

    async authCheck(req, res, next) {
        const token = generateJwt(req.user.id, req.user.email, req.user.role)

        return res.json({ token })
    }

    async getAllUsers(req, res) {
        const users = await User.findAndCountAll();

        return res.json(users);
    }

    async getOneUser(req, res) {
        const { id } = req.params;
        if (!Number(id))
            return res.json(ApiError.badRequest('invalid id!'))

        const user = await User.findOne({ where: { id } });

        return res.json(user);
    }

    async delete(req, res) {
        const { userId } = req.params;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            if (!userId) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('UserId is not valid!'));
            }
            const user = await User.findOne({ where: { userId } })
            if (!user) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('User not found!'));
            }
            await user.destroy();
            await transaction.commit();

            return res.json('User was deleted!');
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(ApiError.badRequest('Something went wrong: ' + e));
        }
    }

}
module.exports = new UserController()