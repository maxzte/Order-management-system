const Router = require('express')
const router = new Router()
const basketController = require('../controllers/basketController')
const checkRole = require('../middleware/checkRole')
const optionalAuth = require('../middleware/optionalAuth')

router.get('/', checkRole('ADMIN'), basketController.getAll)
router.post('/:userId', optionalAuth, basketController.create)
router.post('/addDishes/:userId', optionalAuth, basketController.addItemToBasket)
router.get('/allItems/:id', optionalAuth, basketController.getAllItemsFromBasket)
router.get('/:id', optionalAuth, basketController.getOneItemFromBasket)
router.patch('/:id', optionalAuth, basketController.updBasketItems)
router.delete('/:id', optionalAuth, basketController.deleteOneItemFromBasket)
router.delete('/', optionalAuth, basketController.deleteAllItemsFromBasket)

module.exports = router