const { Feedback, Dish, User, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');

class FeedbackController {
    async create(req, res, next) {
        const { userId } = req.params;
        const { dishId, text } = req.body;

        if (!Number(userId) || !Number(dishId) || !text || !text.trim()) {
            return next(ApiError.badRequest('Invalid input data!'));
        }

        try {
            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.notFound('User not found!'));
            }

            const dish = await Dish.findByPk(dishId);
            if (!dish) {
                return next(ApiError.notFound('Dish not found!'));
            }

            const feedback = await Feedback.create({ userId, dishId, text: text.trim() });
            return res.json(feedback);
        } catch (e) {
            return next(ApiError.internal('Failed to create feedback: ' + e.message));
        }
    }

    async getAll(req, res, next) {
        try {
            const feedbacks = await Feedback.findAndCountAll({
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email'],
                }, {
                    model: Dish,
                    attributes: ['id', 'name'],
                }],
                order: [['createdAt', 'DESC']]
            });

            return res.json(feedbacks);
        } catch (e) {
            return next(ApiError.internal('Something went wrong: ' + e.message));
        }
    }

    async getAllById(req, res, next) {
        const { dishId } = req.params;
        if (!dishId || !Number(dishId)) {
            return next(ApiError.badRequest('Invalid dishId!'));
        }

        try {
            const feedbacks = await Feedback.findAndCountAll({
                where: { dishId },
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email'],
                }, {
                    model: Dish,
                    attributes: ['id', 'name'],
                }],
                order: [['createdAt', 'DESC']]
            });

            return res.json(feedbacks);
        } catch (e) {
            return next(ApiError.internal('Something went wrong: ' + e.message));
        }
    }

    async updateComment(req, res, next) {
        const { userId } = req.params;
        const { dishId, text } = req.body;
        let transaction;

        if (!Number(userId) || !Number(dishId) || !text) {
            return next(ApiError.badRequest('Invalid input data!'));
        }

        try {
            transaction = await sequelize.transaction();
            const feedback = await Feedback.findOne({
                where: { userId, dishId },
                transaction,
            });

            if (!feedback) {
                await transaction.rollback();
                return next(ApiError.notFound('Feedback not found!'));
            }

            await feedback.update({ text: text.trim() }, { transaction });
            await transaction.commit();

            const updatedFeedback = await Feedback.findOne({
                where: { userId, dishId },
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email']
                }, {
                    model: Dish,
                    attributes: ['id', 'name']
                }]
            });

            return res.json(updatedFeedback);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal(e.message));
        }
    }

    async deleteOne(req, res, next) {
        const { userId } = req.params;
        const { dishId } = req.body;
        let transaction;

        if (!Number(userId) || !Number(dishId)) {
            return next(ApiError.badRequest('Invalid parameters!'));
        }

        try {
            transaction = await sequelize.transaction();
            const feedback = await Feedback.findOne({
                where: { userId, dishId },
                transaction
            });

            if (!feedback) {
                await transaction.rollback();
                return next(ApiError.notFound('Feedback not found!'));
            }

            await feedback.destroy({ transaction });
            await transaction.commit();

            return res.json({ message: 'Feedback was deleted' });
        } catch (e) {
            if (transaction) await transaction.rollback();
            return next(ApiError.internal(e.message));
        }
    }
}

module.exports = new FeedbackController();