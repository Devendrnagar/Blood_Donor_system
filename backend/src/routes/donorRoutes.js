import express from 'express';
import {
  registerDonor,
  getDonors,
  getDonor,
  updateDonor,
  deleteDonor,
  getNearbyDonors,
  getDonorProfile,
  updateDonorAvailability,
  getDonorStats,
  searchDonors
} from '../controllers/donorController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { validate, donorValidation } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes (with optional auth)
router.get('/', optionalAuth, getDonors);
router.get('/nearby', optionalAuth, getNearbyDonors);
router.get('/search', optionalAuth, searchDonors);
router.get('/stats', getDonorStats);
router.get('/:id', optionalAuth, getDonor);

// Protected routes
router.use(protect);

router.post('/register', validate(donorValidation), registerDonor);
router.get('/profile/me', getDonorProfile);
router.put('/profile', updateDonor);
router.put('/availability', updateDonorAvailability);
router.delete('/profile', deleteDonor);

export default router;
