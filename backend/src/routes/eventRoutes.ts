import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
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

/**
 * Multer error handling wrapper
 * Catches multer-specific errors (file too large, too many files, wrong type)
 * and returns proper JSON responses instead of plain text
 */
const handleMulterError = (uploadMiddleware: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        // Multer-specific errors
        let message = 'File upload error';
        let statusCode = 400;

        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            statusCode = 413;
            message = 'File is too large. Maximum file size is 100MB per file.';
            break;
          case 'LIMIT_FILE_COUNT':
            statusCode = 400;
            message = 'Too many files. Maximum 5 files allowed per event.';
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            statusCode = 400;
            message = 'Unexpected file field. Use "media" as the field name.';
            break;
          default:
            message = `Upload error: ${err.message}`;
        }

        return res.status(statusCode).json({ success: false, error: message });
      } else if (err) {
        // Non-multer errors (e.g., file filter rejections)
        return res.status(400).json({ success: false, error: err.message || 'File upload failed' });
      }
      next();
    });
  };
};

// ── Public Routes ──────────────────────────────────────
router.get('/', optionalAuth, getEvents);
router.get('/active', getActiveEvents);
router.get('/recent', getRecentEvents);
router.get('/:id', getEventById);

// ── Protected Routes ───────────────────────────────────
router.post('/', authenticate, handleMulterError(mediaUpload.array('media', 5)), createEvent);
router.post('/:id/update', authenticate, handleMulterError(videoUpload.single('video')), updateEvent);
router.delete('/:id', authenticate, deleteEvent);

export default router;

// ── Video streaming route (exported separately) ────────
export const videoRouter = Router();
videoRouter.get('/:filename', streamVideo);

// ── Image serving route (exported separately) ──────────
export const imageRouter = Router();
imageRouter.get('/:filename', serveImage);
