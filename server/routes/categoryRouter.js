const Router = require('express')
const router = new Router()
const categoryController = require('../controllers/categoryController')
const checkRole = require('../middleware/checkRole')

router.post('/', checkRole('ADMIN'), categoryController.create)
router.get('/', categoryController.getAll)
router.get('/:id', categoryController.getOne)
router.patch('/:id', checkRole('ADMIN'), categoryController.updateCategory)
router.delete('/:id', checkRole('ADMIN'), categoryController.deleteOne)


module.exports = router