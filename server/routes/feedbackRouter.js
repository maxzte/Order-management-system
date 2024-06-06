const Router = require('express')
const router = new Router()
const feedbackController = require('../controllers/feedbackController')
const checkRole = require('../middleware/checkRole')

router.post('/:userId', feedbackController.create)
router.get('/', checkRole('ADMIN'), feedbackController.getAll)
router.get('/:dishId', feedbackController.getAllById)
router.patch('/:userId', feedbackController.updateComment)
router.delete('/:userId', feedbackController.deleteOne)


module.exports = router