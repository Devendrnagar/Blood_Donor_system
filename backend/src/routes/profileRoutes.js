import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/avatar', uploadAvatar);
router.delete('/avatar', deleteAvatar);

export default router;
