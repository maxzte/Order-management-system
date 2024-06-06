const Router = require('express')
const router = new Router()
const orderController = require('../controllers/orderController')
const checkRole = require('../middleware/checkRole')

router.post('/:userId', orderController.create)
router.get('/', checkRole('ADMIN'), orderController.getAll)
router.get('/all/:id', orderController.getAllById)
router.get('/:id', orderController.getOne)
router.patch('/:userId', checkRole('ADMIN'), orderController.updateOrder)
router.patch('/updStatus/:orderId', checkRole('ADMIN'), orderController.updateStatus)

router.delete('/:id', orderController.deleteOne)

module.exports = router