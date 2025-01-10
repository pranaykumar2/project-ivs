const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
    validateRegistration,
    validateLogin,
    validateForgotPassword,
    validateResetPassword
} = require('../middlewares/validation');

const { verifyToken } = require('../middlewares/auth');

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/logout', verifyToken, authController.logout);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

module.exports = router;