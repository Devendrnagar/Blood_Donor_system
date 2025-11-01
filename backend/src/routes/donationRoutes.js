import express from 'express';
import {
  createDonation,
  getDonations,
  getDonation,
  updateDonation,
  deleteDonation,
  getMyDonations,
  completeDonation,
  addTestResults,
  getDonationStats,
  generateCertificate
} from '../controllers/donationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validate, donationValidation } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// General protected routes
router.get('/my-donations', getMyDonations);
router.get('/stats', getDonationStats);
router.get('/:id', getDonation);
router.post('/:id/generate-certificate', generateCertificate);

// Admin routes
router.get('/', admin, getDonations);
router.post('/', admin, validate(donationValidation), createDonation);
router.put('/:id', admin, updateDonation);
router.delete('/:id', admin, deleteDonation);
router.put('/:id/complete', admin, completeDonation);
router.put('/:id/test-results', admin, addTestResults);

export default router;
