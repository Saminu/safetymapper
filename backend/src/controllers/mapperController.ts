import { Request, Response } from 'express';
import Mapper from '../models/Mapper';
import MappingSession from '../models/MappingSession';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../types';
import { startOfToday, startOfWeek } from '../utils/helpers';

/**
 * Get mapper profile
 * GET /api/mappers/profile
 */
export const getMapperProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    const mapper = await Mapper.findById(req.user.id);
    if (!mapper) {
      res.status(404).json({ success: false, error: 'Mapper not found' });
      return;
    }

    res.json({
      success: true,
      mapper: {
        id: mapper._id,
        name: mapper.name,
        email: mapper.email,
        phone: mapper.phone,
        vehicleType: mapper.vehicleType,
        vehicleNumber: mapper.vehicleNumber,
        status: mapper.status,
        isLive: mapper.isLive,
        currentLocation: mapper.currentLocation,
        totalEarnings: mapper.totalEarnings,
        totalDistance: mapper.totalDistance,
        totalDuration: mapper.totalDuration,
        totalEvents: mapper.totalEvents,
        createdAt: mapper.createdAt,
      },
    });
  } catch (error) {
    console.error('Get mapper profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

/**
 * Update mapper profile
 * PUT /api/mappers/profile
 */
export const updateMapperProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    const allowedUpdates = ['name', 'phone', 'vehicleType', 'vehicleNumber', 'bankAccount', 'bankName'];
    const updates: any = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const mapper = await Mapper.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });

    if (!mapper) {
      res.status(404).json({ success: false, error: 'Mapper not found' });
      return;
    }

    res.json({ success: true, mapper });
  } catch (error) {
    console.error('Update mapper profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

/**
 * Get all mappers (public listing, optionally filtered)
 * GET /api/mappers
 */
export const getAllMappers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isLive, status, limit = '50', offset = '0' } = req.query;

    const query: any = { isActive: true };
    if (isLive) query.isLive = isLive === 'true';
    if (status) query.status = status;

    const mappers = await Mapper.find(query)
      .select('-password -bankAccount -bankName -email')
      .sort({ isLive: -1, createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string))
      .lean();

    const total = await Mapper.countDocuments(query);

    res.json({
      success: true,
      mappers: mappers.map((m) => ({
        id: m._id,
        name: m.name,
        phone: m.phone,
        vehicleType: m.vehicleType,
        status: m.status,
        isLive: m.isLive,
        currentLocation: m.currentLocation,
        totalEarnings: m.totalEarnings,
        totalDistance: m.totalDistance,
        totalDuration: m.totalDuration,
        totalEvents: m.totalEvents,
        createdAt: m.createdAt,
      })),
      pagination: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    console.error('Get mappers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch mappers' });
  }
};

/**
 * Get mapper earnings stats (daily, weekly, total)
 * GET /api/mappers/earnings
 */
export const getMapperEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    const mapper = await Mapper.findById(req.user.id);
    if (!mapper) {
      res.status(404).json({ success: false, error: 'Mapper not found' });
      return;
    }

    const today = startOfToday();
    const weekStart = startOfWeek();

    // Get today's earnings
    const todayTransactions = await Transaction.find({
      mapperId: req.user.id,
      createdAt: { $gte: today },
      status: 'COMPLETED',
      type: { $ne: 'WITHDRAWAL' },
    });
    const dailyEarnings = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Get this week's earnings
    const weekTransactions = await Transaction.find({
      mapperId: req.user.id,
      createdAt: { $gte: weekStart },
      status: 'COMPLETED',
      type: { $ne: 'WITHDRAWAL' },
    });
    const weeklyEarnings = weekTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Get total paid (completed withdrawals)
    const withdrawals = await Transaction.find({
      mapperId: req.user.id,
      type: 'WITHDRAWAL',
      status: 'COMPLETED',
    });
    const totalPaid = withdrawals.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Get today's sessions
    const todaySessions = await MappingSession.find({
      mapperId: req.user.id,
      startTime: { $gte: today },
    });

    // Get this week's sessions
    const weekSessions = await MappingSession.find({
      mapperId: req.user.id,
      startTime: { $gte: weekStart },
    });

    // Recent 10 transactions
    const recentTransactions = await Transaction.find({ mapperId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      earnings: {
        daily: {
          amount: dailyEarnings,
          amountNGN: dailyEarnings * 100,
          sessions: todaySessions.length,
          distance: todaySessions.reduce((s, sess) => s + sess.distance, 0),
        },
        weekly: {
          amount: weeklyEarnings,
          amountNGN: weeklyEarnings * 100,
          sessions: weekSessions.length,
          distance: weekSessions.reduce((s, sess) => s + sess.distance, 0),
        },
        total: {
          amount: mapper.totalEarnings,
          amountNGN: mapper.totalEarnings * 100,
          paid: totalPaid,
          paidNGN: totalPaid * 100,
          balance: mapper.totalEarnings - totalPaid,
          balanceNGN: (mapper.totalEarnings - totalPaid) * 100,
        },
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch earnings' });
  }
};

/**
 * Request a withdrawal
 * POST /api/mappers/withdraw
 */
export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    const { amount, bankAccount, bankName } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid withdrawal amount' });
      return;
    }

    if (!bankAccount) {
      res.status(400).json({ success: false, error: 'Bank account is required' });
      return;
    }

    const mapper = await Mapper.findById(req.user.id);
    if (!mapper) {
      res.status(404).json({ success: false, error: 'Mapper not found' });
      return;
    }

    // Calculate available balance
    const totalWithdrawals = await Transaction.aggregate([
      {
        $match: {
          mapperId: mapper._id,
          type: 'WITHDRAWAL',
          status: { $in: ['PENDING', 'COMPLETED'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalWithdrawn = totalWithdrawals[0]?.total || 0;
    const availableBalance = mapper.totalEarnings - Math.abs(totalWithdrawn);

    if (amount > availableBalance) {
      res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${availableBalance.toFixed(2)} tokens`,
      });
      return;
    }

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      mapperId: req.user.id,
      amount: -amount, // Negative for withdrawals
      type: 'WITHDRAWAL',
      status: 'PENDING',
      description: `Withdrawal of ${amount} tokens to ${bankAccount}`,
      bankAccount,
      bankName: bankName || 'Unknown',
      reference: `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    // Update mapper bank details
    if (bankAccount) mapper.bankAccount = bankAccount;
    if (bankName) mapper.bankName = bankName;
    await mapper.save();

    res.json({
      success: true,
      message: `Withdrawal of ${amount} tokens (₦${(amount * 100).toFixed(2)}) initiated successfully`,
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        reference: transaction.reference,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Withdrawal request failed' });
  }
};

/**
 * Get mapper's transaction history
 * GET /api/mappers/transactions
 */
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    const { type, status, limit = '20', offset = '0' } = req.query;

    const query: any = { mapperId: req.user.id };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string))
      .lean();

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      pagination: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
};

/**
 * Update mapper live status / location
 * PUT /api/mappers/location
 */
export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    const { lat, lon, isLive } = req.body;

    const update: any = {};
    if (lat !== undefined && lon !== undefined) {
      update.currentLocation = { lat, lon };
    }
    if (isLive !== undefined) {
      update.isLive = isLive;
    }

    const mapper = await Mapper.findByIdAndUpdate(req.user.id, update, { new: true });

    if (!mapper) {
      res.status(404).json({ success: false, error: 'Mapper not found' });
      return;
    }

    res.json({ success: true, mapper: { id: mapper._id, isLive: mapper.isLive, currentLocation: mapper.currentLocation } });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, error: 'Failed to update location' });
  }
};
