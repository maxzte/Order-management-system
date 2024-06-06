const Router = require('express')
const router = new Router()
const basketController = require('../controllers/basketController')
const checkRole = require('../middleware/checkRole')

router.get('/', checkRole('ADMIN'), basketController.getAll)
router.post('/:userId', basketController.create)
router.post('/addDishes/:userId', basketController.addItemToBasket)
router.get('/allItems/:id', basketController.getAllItemsFromBasket)
router.get('/:id', basketController.getOneItemFromBasket)
router.patch('/:id', basketController.updBasketItems)
router.delete('/:id', basketController.deleteOneItemFromBasket)
router.delete('/', basketController.deleteAllItemsFromBasket)

module.exports = router