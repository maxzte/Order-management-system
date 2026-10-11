const Router = require('express')
const router = new Router()
const orderController = require('../controllers/orderController')
const checkRole = require('../middleware/checkRole')
const optionalAuth = require('../middleware/optionalAuth')

router.post('/:userId', optionalAuth, orderController.create)
router.get('/', checkRole('ADMIN'), orderController.getAll)
router.get('/all/:id', optionalAuth, orderController.getAllById)
router.get('/:id', optionalAuth, orderController.getOne)
router.patch('/:userId', checkRole('ADMIN'), orderController.updateOrder)
router.patch('/updStatus/:orderId', checkRole('ADMIN'), orderController.updateStatus)

router.delete('/:id', checkRole('ADMIN'), orderController.deleteOne)

module.exports = router