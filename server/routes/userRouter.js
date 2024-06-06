const Router = require('express')
const router = new Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/auth')
const checkRole = require('../middleware/checkRole')

router.get('/', checkRole('ADMIN'), userController.getAllUsers)
router.get('/:id', checkRole('ADMIN'), userController.getOneUser)
router.post('/reg', userController.reg)
router.post('/login', userController.login)
router.get('/auth', authMiddleware, userController.authCheck)
router.delete('/:userId', checkRole('ADMIN'), userController.delete)

module.exports = router