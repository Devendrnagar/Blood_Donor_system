import express from 'express';
import {
  getCertificates,
  getCertificate,
  getMyCertificates,
  downloadCertificate,
  verifyCertificate,
  regenerateCertificate,
  shareCertificate,
  getCertificateStats,
  sendCertificateEmailEndpoint
} from '../controllers/certificateController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/verify/:verificationCode', verifyCertificate);

// Routes with optional auth
router.get('/stats', optionalAuth, getCertificateStats);

// Protected routes
router.use(protect);

router.get('/', getCertificates);
router.get('/my-certificates', getMyCertificates);
router.get('/:id', getCertificate);
router.get('/:id/download', downloadCertificate);
router.post('/:id/regenerate', regenerateCertificate);
router.post('/:id/share', shareCertificate);
router.post('/:id/send-email', sendCertificateEmailEndpoint);

export default router;
