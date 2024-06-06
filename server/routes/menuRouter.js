const Router = require('express')
const router = new Router()
const menuController = require('../controllers/menuController')
const checkRole = require('../middleware/checkRole')

router.post('/', checkRole('ADMIN'), menuController.create)
router.get('/', menuController.getAll)
router.get('/:id', menuController.getOne)
router.patch('/:id', checkRole('ADMIN'), menuController.updateMenu)
router.delete('/:id', checkRole('ADMIN'), menuController.deleteOne)

module.exports = router