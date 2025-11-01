import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getBloodInventory,
  createBloodInventory,
  updateBloodInventory,
  deleteBloodInventory,
  getInventoryAlerts,
  generateInventoryReport
} from '../controllers/inventoryController.js';

const router = express.Router();

// Public routes (with optional auth)
router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/alerts', protect, getInventoryAlerts);
router.get('/report', protect, generateInventoryReport);

// Inventory CRUD routes
router.route('/')
  .get(protect, getBloodInventory)
  .post(protect, admin, createBloodInventory);

router.route('/:id')
  .put(protect, admin, updateBloodInventory)
  .delete(protect, admin, deleteBloodInventory);

export default router;
