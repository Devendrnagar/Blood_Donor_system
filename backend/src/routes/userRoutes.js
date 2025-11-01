import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
  searchUsers
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Public user routes (authenticated users)
router.get('/search', searchUsers);
router.get('/stats', getUserStats);

// Admin only routes
router.use(admin);
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
