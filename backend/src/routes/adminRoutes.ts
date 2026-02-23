import express from 'express';
import {
  getDashboardStats,
  getAllMappers,
  updateMapperStatus,
  getAllEvents,
  deleteEvent,
  updateEventStatus,
} from '../controllers/adminController';
import { authenticate, adminOnly } from '../middleware/auth';

const router = express.Router();

// Apply authentication and admin-only middleware to all routes
router.use(authenticate, adminOnly);

// Stats & Dashboard
router.get('/stats', getDashboardStats);

// Mappers Mgt
router.get('/mappers', getAllMappers);
router.patch('/mappers/:id/status', updateMapperStatus);

// Events Mgt
router.get('/events', getAllEvents);
router.delete('/events/:id', deleteEvent);
router.patch('/events/:id/status', updateEventStatus);

export default router;
