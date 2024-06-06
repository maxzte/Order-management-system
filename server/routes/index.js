const Router = require('express')
const router = new Router()
const userRouter = require('./userRouter');
const menuRouter = require('./menuRouter');
const categoryRouter = require('./categoryRouter');
const dishRouter = require('./dishRouter');
const basketRouter = require('./basketRouter');
const orderRouter = require('./orderRouter');
const feedbackRouter = require('./feedbackRouter');
const dashBoardRouter = require('./dashBoardRouter');

router.use('/user', userRouter)
router.use('/menu', menuRouter)
router.use('/category', categoryRouter)
router.use('/dish', dishRouter)
router.use('/basket', basketRouter)
router.use('/order', orderRouter)
router.use('/feedback', feedbackRouter)
router.use('/dashboard', dashBoardRouter)

module.exports = router