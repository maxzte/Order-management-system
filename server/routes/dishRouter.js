const Router = require('express')
const router = new Router()
const dishController = require('../controllers/dishController')
const checkRole = require('../middleware/checkRole')

router.post('/', checkRole('ADMIN'), dishController.create)
router.get('/', dishController.getAll)
router.get('/:id', dishController.getOne)
router.patch('/:id', checkRole('ADMIN'), dishController.updateDish)
router.delete('/:id', checkRole('ADMIN'), dishController.deleteOne)

module.exports = router