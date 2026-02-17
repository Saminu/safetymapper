import { Router } from 'express';
import {
  userSignup,
  userLogin,
  mapperSignup,
  mapperLogin,
  refreshToken,
  getMe,
  deleteAccount,
  changePassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// ── User Auth ──────────────────────────────────────────
router.post('/user/signup', userSignup);
router.post('/user/login', userLogin);

// ── Mapper Auth ────────────────────────────────────────
router.post('/mapper/signup', mapperSignup);
router.post('/mapper/login', mapperLogin);

// ── Token Refresh ──────────────────────────────────────
router.post('/refresh', refreshToken);

// ── Protected Routes ───────────────────────────────────
router.get('/me', authenticate, getMe);
router.delete('/account', authenticate, deleteAccount);
router.put('/password', authenticate, changePassword);

export default router;
