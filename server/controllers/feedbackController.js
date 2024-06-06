const { Feedback, Dish, User, sequelize } = require('../models/models');
const ApiError = require('../error/apiError');
const router = require('../routes/feedbackRouter');

class feedbackController {
    async create(req, res) {
        const { userId } = req.params;
        const { dishId, text } = req.body;
        if (!Number(userId))
            return res.json(ApiError.badRequest('Invalid id!'));

        const feedback = await Feedback.create({ userId, dishId, text });
        if (!feedback)
            return res.json(ApiError.badRequest('User or dish not found!'))

        return res.json(feedback)
    }

    async getAll(req, res) {
        let feedbacks;
        try {
            feedbacks = await Feedback.findAndCountAll({
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'email'],
                }, {
                    model: Dish,
                    attributes: ['id', 'name'],
                }]
            });
            if (feedbacks.count === 0)
                return res.json(ApiError.badRequest('Not found!'));

            return res.json(feedbacks);
        } catch (e) {
            return res.json(ApiError.badRequest('Something went wrong: ' + e.message));
        }
    }

    async getAllById(req, res) {
        const { dishId } = req.params;
        let feedbacks;
        try {
            if (!dishId) return res.json('Invalid dishId!')
            else {
                feedbacks = await Feedback.findAndCountAll({
                    where: { dishId },
                    include: [{
                        model: User,
                        attributes: ['id', 'name', 'email'],
                    }, {
                        model: Dish
                    }]
                });
            }
            if (feedbacks.count === 0)
                return res.json(ApiError.badRequest('Not found!'));

            return res.json(feedbacks);
        } catch (e) {
            return res.json(ApiError.badRequest('Something went wrong: ' + e.message));
        }
    }

    async updateComment(req, res) {
        const { userId } = req.params;
        const { dishId, text } = req.body;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            const feedback = await Feedback.findOne({
                where: { userId, dishId },
                transaction,
            });
            if (!feedback) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Feedback not found!'));
            }
            await feedback.update({ text }, { transaction });
            const updatedFeedback = await Feedback.findOne({
                where: { userId, dishId },
                transaction,
            });
            await transaction.commit();

            return res.json(updatedFeedback);
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(ApiError.badRequest(e.message));
        }
    }

    async deleteOne(req, res) {
        const { userId } = req.params;
        const { dishId } = req.body;
        let transaction;
        try {
            transaction = await sequelize.transaction();
            const feedback = await Feedback.findOne({ where: { userId, dishId } });
            if (!feedback) {
                await transaction.rollback();
                return res.json(ApiError.badRequest('Feedback not found!'))
            }
            await feedback.destroy({ transaction });
            await transaction.commit();

            return res.json('Feedback was deleted')
        } catch (e) {
            if (transaction) await transaction.rollback();
            return res.json(e);
        }
    }
}

module.exports = new feedbackController();