const Router = require('express');
const router = new Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const createRateLimiter = require('../middleware/rateLimiter');

// Protect registration and login from brute-force attempts
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Забагато спроб входу/реєстрації. Спробуйте пізніше.'
});

router.post('/reg', authLimiter, userController.reg);
router.post('/login', authLimiter, userController.login);
router.get('/auth', authMiddleware, userController.authCheck);
router.get('/', checkRole('ADMIN'), userController.getAllUsers);
router.get('/:id', checkRole('ADMIN'), userController.getOneUser);
router.delete('/:userId', checkRole('ADMIN'), userController.delete);

module.exports = router;