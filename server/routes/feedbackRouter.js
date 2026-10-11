const Router = require('express')
const router = new Router()
const feedbackController = require('../controllers/feedbackController')
const checkRole = require('../middleware/checkRole')
const auth = require('../middleware/auth')

router.post('/:userId', auth, feedbackController.create)
router.get('/', checkRole('ADMIN'), feedbackController.getAll)
router.get('/:dishId', feedbackController.getAllById)
router.patch('/:userId', auth, feedbackController.updateComment)
router.delete('/:userId', auth, feedbackController.deleteOne)


module.exports = router