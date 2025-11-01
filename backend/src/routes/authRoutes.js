import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  validate, 
  registerValidation, 
  loginValidation,
  changePasswordValidation,
  updateProfileValidation
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/verify-email/:token', verifyEmail);

// Protected routes
router.use(protect); // All routes below this middleware are protected

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', validate(updateProfileValidation), updateProfile);
router.put('/change-password', validate(changePasswordValidation), changePassword);
router.post('/resend-verification', resendVerification);

export default router;
