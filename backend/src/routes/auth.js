const express = require('express');
const router = express.Router();
const { register, login, getMe, createAdmin, resetPassword, sendOtp, verifyOtp, changeCredentials } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/create-admin', createAdmin);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.put('/change-credentials', protect, changeCredentials);

module.exports = router;
