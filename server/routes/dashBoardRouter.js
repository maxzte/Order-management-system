const Router = require('express')
const router = new Router()
const dashBoardController = require('../controllers/dashBoardController')
const checkRole = require('../middleware/checkRole')

router.get('/', checkRole('ADMIN'), dashBoardController.getBasicInfo);
router.post('/', checkRole('ADMIN'), dashBoardController.getDataForChart);

module.exports = router