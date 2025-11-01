import express from 'express';
import {
  createBloodRequest,
  getBloodRequests,
  getBloodRequest,
  updateBloodRequest,
  deleteBloodRequest,
  getNearbyRequests,
  getMyRequests,
  respondToRequest,
  getRequestResponses,
  searchRequests,
  getRequestStats
} from '../controllers/requestController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { validate, bloodRequestValidation } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes (with optional auth)
router.get('/', optionalAuth, getBloodRequests);
router.get('/nearby', optionalAuth, getNearbyRequests);
router.get('/search', optionalAuth, searchRequests);
router.get('/stats', getRequestStats);
router.get('/:id', optionalAuth, getBloodRequest);

// Protected routes
router.use(protect);

router.post('/', validate(bloodRequestValidation), createBloodRequest);
router.get('/user/my-requests', getMyRequests);
router.put('/:id', updateBloodRequest);
router.delete('/:id', deleteBloodRequest);
router.post('/:id/respond', respondToRequest);
router.get('/:id/responses', getRequestResponses);

export default router;
