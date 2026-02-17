import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSession,
  updateSessionLocation,
  updateSession,
  uploadSessionVideo,
  getNetworkStats,
} from '../controllers/sessionController';
import { authenticate, mapperOnly } from '../middleware/auth';
import { videoUpload } from '../middleware/upload';

const router = Router();

// ── Public Routes ──────────────────────────────────────
router.get('/', getSessions);
router.get('/network-stats', getNetworkStats);
router.get('/:id', getSession);

// ── Protected Mapper Routes ────────────────────────────
router.post('/', authenticate, mapperOnly, createSession);
router.post('/:id/location', authenticate, mapperOnly, updateSessionLocation);
router.patch('/:id', authenticate, mapperOnly, updateSession);
router.post('/:id/upload', authenticate, mapperOnly, videoUpload.single('video'), uploadSessionVideo);

export default router;
