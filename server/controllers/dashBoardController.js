const { Order, User, sequelize } = require('../models/models');
const Sequelize = require('sequelize');
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek);
const Op = Sequelize.Op;

class DashBoardController {
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
        const isSqlite = sequelize.getDialect() === 'sqlite';

        switch (period) {
            case 'Day':
                startDate = dayjs(date || Date.now()).startOf('day');
                endDate = dayjs(date || Date.now()).endOf('day');
                attributes = [
                    isSqlite
                        ? [sequelize.fn('strftime', '%Y-%m-%d', sequelize.col('createdAt')), 'date']
                        : [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d'), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('MIN', sequelize.col('createdAt')), 'createdAt'],
                ];
                groupBy = ['date'];
                break;
            case 'Week':
                startDate = dayjs(date || Date.now()).startOf('isoWeek');
                endDate = dayjs(date || Date.now()).endOf('isoWeek');
                attributes = [
                    isSqlite
                        ? [sequelize.fn('strftime', '%Y-%W', sequelize.col('createdAt')), 'week']
                        : [sequelize.fn('YEARWEEK', sequelize.col('createdAt'), 1), 'week'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('MIN', sequelize.col('createdAt')), 'createdAt'],
                ];
                groupBy = ['week'];
                break;
            case 'Month':
                startDate = dayjs(date || Date.now()).startOf('month');
                endDate = dayjs(date || Date.now()).endOf('month');
                attributes = [
                    isSqlite
                        ? [sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt')), 'month']
                        : [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('MIN', sequelize.col('createdAt')), 'createdAt'],
                ];
                groupBy = ['month'];
                break;
            case 'Year':
                startDate = dayjs(date || Date.now()).startOf('year');
                endDate = dayjs(date || Date.now()).endOf('year');
                attributes = [
                    isSqlite
                        ? [sequelize.fn('strftime', '%Y', sequelize.col('createdAt')), 'year']
                        : [sequelize.fn('YEAR', sequelize.col('createdAt')), 'year'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('MIN', sequelize.col('createdAt')), 'createdAt'],
                ];
                groupBy = ['year'];
                break;
            default:
                startDate = dayjs(date || Date.now()).startOf('day');
                endDate = dayjs(date || Date.now()).endOf('day');
                attributes = [
                    isSqlite
                        ? [sequelize.fn('strftime', '%Y-%m-%d', sequelize.col('createdAt')), 'date']
                        : [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-%d'), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('MIN', sequelize.col('createdAt')), 'createdAt'],
                ];
                groupBy = ['date'];
                break;
        }
        try {
            const salesData = await Order.findAll({
                attributes,
                where: {
                    createdAt: {
                        [Op.between]: [startDate.toDate(), endDate.toDate()]
                    },
                },
                group: groupBy,
                order: [[groupBy[0], 'ASC']],
            });

            return res.json(salesData);
        } catch (e) {
            return res.status(500).json({ message: 'Error retrieving sales data: ' + e.message });
        }
    }
}

module.exports = new DashBoardController();