const { Order, User, sequelize } = require('../models/models');
// const { User } = require('./userController');
const Sequelize = require('sequelize');
const moment = require('moment');
const Op = Sequelize.Op;

class CategoryController {
    async getBasicInfo(req, res) {
        let basicInfo = {};
        try {
            const usersCount = await User.count();
            basicInfo.usersCount = usersCount;

            const ordersCount = await Order.count();
            basicInfo.ordersCount = ordersCount;

            const completedStatus = 'Оплачено';
            const salesCount = await Order.count({ where: { status: completedStatus } });
            basicInfo.salesCount = salesCount;

            return res.json(basicInfo);
        } catch (e) {
            return res.status(500).json({ message: 'Error retrieving information' + e });
        }
    }

    async getDataForChart(req, res) {
        const { date, period } = req.query;
        let startDate, endDate, attributes, groupBy;
        switch (period) {
            case 'Day':
                startDate = moment(date || Date.now()).startOf('day');
                endDate = moment(date || Date.now()).endOf('day');
                attributes = [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d'), 'date'],
                    [sequelize.fn('COUNT', '*'), 'count'],
                    [sequelize.col('createdAt'), 'createdAt'],
                ];
                groupBy = ['date', 'createdAt'];
                break;
            case 'Week':
                startDate = moment(date || Date.now()).startOf('isoWeek');
                endDate = moment(date || Date.now()).endOf('isoWeek');
                attributes = [
                    [sequelize.fn('YEARWEEK', sequelize.col('createdAt'), 1), 'week'],
                    [sequelize.fn('COUNT', '*'), 'count'],
                    [sequelize.col('createdAt'), 'createdAt'],
                ];
                groupBy = ['week', 'createdAt'];
                break;
            case 'Month':
                startDate = moment(date || Date.now()).startOf('month');
                endDate = moment(date || Date.now()).endOf('month');
                attributes = [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
                    [sequelize.fn('COUNT', '*'), 'count'],
                    [sequelize.col('createdAt'), 'createdAt'],
                ];
                groupBy = ['month', 'createdAt'];
                break;
            case 'Year':
                startDate = moment(date || Date.now()).startOf('year');
                endDate = moment(date || Date.now()).endOf('year');
                attributes = [
                    [sequelize.fn('YEAR', sequelize.col('createdAt')), 'year'],
                    [sequelize.fn('COUNT', 1), 'count'],
                    [sequelize.col('createdAt'), 'createdAt'],
                ];
                groupBy = ['year', 'createdAt'];
                break;
            default:
                startDate = moment(date).startOf('day');
                endDate = moment(date).endOf('day');
                attributes = [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d'), 'date'],
                    [sequelize.fn('COUNT', '*'), 'count'],
                    [sequelize.col('createdAt'), 'createdAt'],
                ];
                groupBy = ['date', 'createdAt'];
                break;
        }
        try {
            const salesData = await Order.findAll({
                attributes,
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                        // [Op.like]: `${date}%`
                    },
                    // status: 'Оплачено'
                },
                group: groupBy,
                order: [[groupBy[0], 'ASC']],
            });

            return res.json(salesData);
        } catch (e) {
            return res.status(500).json({ message: 'Error retrieving sales data: ' + e });
        }
    }
}

module.exports = new CategoryController();