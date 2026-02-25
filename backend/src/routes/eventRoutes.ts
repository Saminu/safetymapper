import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getActiveEvents,
  getRecentEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  streamVideo,
  serveImage,
} from '../controllers/eventController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { videoUpload, mediaUpload } from '../middleware/upload';

const router = Router();

// ── Public Routes ──────────────────────────────────────
router.get('/', optionalAuth, getEvents);
router.get('/active', getActiveEvents);
router.get('/recent', getRecentEvents);
router.get('/:id', getEventById);

// ── Protected Routes ───────────────────────────────────
router.post('/', authenticate, mediaUpload.array('media', 5), createEvent);
router.post('/:id/update', authenticate, videoUpload.single('video'), updateEvent);
router.delete('/:id', authenticate, deleteEvent);

export default router;

// ── Video streaming route (exported separately) ────────
export const videoRouter = Router();
videoRouter.get('/:filename', streamVideo);

// ── Image serving route (exported separately) ──────────
export const imageRouter = Router();
imageRouter.get('/:filename', serveImage);
