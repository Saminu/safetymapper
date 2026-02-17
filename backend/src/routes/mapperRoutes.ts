import { Router } from 'express';
import {
  getMapperProfile,
  updateMapperProfile,
  getAllMappers,
  getMapperEarnings,
  requestWithdrawal,
  getTransactions,
  updateLocation,
} from '../controllers/mapperController';
import { authenticate, mapperOnly } from '../middleware/auth';

const router = Router();

// ── Public Routes ──────────────────────────────────────
router.get('/', getAllMappers);

// ── Protected Mapper Routes ────────────────────────────
router.get('/profile', authenticate, mapperOnly, getMapperProfile);
router.put('/profile', authenticate, mapperOnly, updateMapperProfile);
router.get('/earnings', authenticate, mapperOnly, getMapperEarnings);
router.post('/withdraw', authenticate, mapperOnly, requestWithdrawal);
router.get('/transactions', authenticate, mapperOnly, getTransactions);
router.put('/location', authenticate, mapperOnly, updateLocation);

export default router;
