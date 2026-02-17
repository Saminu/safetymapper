import { Request, Response } from 'express';
import User from '../models/User';
import Mapper from '../models/Mapper';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { AuthPayload, AuthRequest } from '../types';

/**
 * Register a new normal user
 * POST /api/auth/user/signup
 */
export const userSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'An account with this email already exists' });
      return;
    }

    // Also check mapper collection
    const existingMapper = await Mapper.findOne({ email: email.toLowerCase() });
    if (existingMapper) {
      res.status(409).json({ success: false, error: 'An account with this email already exists as a mapper' });
      return;
    }

    // Create user
    const user = await User.create({ name, email, password, phone, role: 'user' });

    // Generate tokens
    const payload: AuthPayload = {
      id: user._id.toString(),
      email: user.email,
      role: 'user',
    };
    const tokens = generateTokenPair(payload);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      ...tokens,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }
    console.error('User signup error:', error);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
};

/**
 * Login an existing normal user
 * POST /api/auth/user/login
 */
export const userLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // Generate tokens
    const payload: AuthPayload = {
      id: user._id.toString(),
      email: user.email,
      role: 'user',
    };
    const tokens = generateTokenPair(payload);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
};

/**
 * Register a new mapper
 * POST /api/auth/mapper/signup
 */
export const mapperSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, vehicleType, vehicleNumber, agreedToTerms } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !vehicleType) {
      res.status(400).json({
        success: false,
        error: 'Name, email, password, phone, and vehicle type are required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }

    if (!agreedToTerms) {
      res.status(400).json({ success: false, error: 'You must agree to the terms and conditions' });
      return;
    }

    // Check if mapper already exists
    const existingMapper = await Mapper.findOne({ email: email.toLowerCase() });
    if (existingMapper) {
      res.status(409).json({ success: false, error: 'An account with this email already exists' });
      return;
    }

    // Also check user collection
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'An account with this email already exists as a regular user' });
      return;
    }

    // Create mapper
    const mapper = await Mapper.create({
      name,
      email,
      password,
      phone,
      vehicleType,
      vehicleNumber,
      agreedToTerms,
      role: 'mapper',
      status: 'ACTIVE',
    });

    // Generate tokens
    const payload: AuthPayload = {
      id: mapper._id.toString(),
      email: mapper.email,
      role: 'mapper',
    };
    const tokens = generateTokenPair(payload);

    // Update last login
    mapper.lastLogin = new Date();
    await mapper.save();

    res.status(201).json({
      success: true,
      mapper: {
        id: mapper._id,
        name: mapper.name,
        email: mapper.email,
        phone: mapper.phone,
        vehicleType: mapper.vehicleType,
        vehicleNumber: mapper.vehicleNumber,
        role: mapper.role,
        status: mapper.status,
        totalEarnings: mapper.totalEarnings,
        totalDistance: mapper.totalDistance,
        totalDuration: mapper.totalDuration,
        createdAt: mapper.createdAt,
      },
      ...tokens,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }
    console.error('Mapper signup error:', error);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
};

/**
 * Login an existing mapper
 * POST /api/auth/mapper/login
 */
export const mapperLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    // Find mapper with password field
    const mapper = await Mapper.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
    if (!mapper) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    if (mapper.status === 'SUSPENDED') {
      res.status(403).json({ success: false, error: 'Your account has been suspended. Please contact support.' });
      return;
    }

    // Compare password
    const isMatch = await mapper.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // Generate tokens
    const payload: AuthPayload = {
      id: mapper._id.toString(),
      email: mapper.email,
      role: 'mapper',
    };
    const tokens = generateTokenPair(payload);

    // Update last login
    mapper.lastLogin = new Date();
    await mapper.save();

    res.json({
      success: true,
      mapper: {
        id: mapper._id,
        name: mapper.name,
        email: mapper.email,
        phone: mapper.phone,
        vehicleType: mapper.vehicleType,
        vehicleNumber: mapper.vehicleNumber,
        role: mapper.role,
        status: mapper.status,
        isLive: mapper.isLive,
        totalEarnings: mapper.totalEarnings,
        totalDistance: mapper.totalDistance,
        totalDuration: mapper.totalDuration,
        totalEvents: mapper.totalEvents,
        createdAt: mapper.createdAt,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Mapper login error:', error);
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'Refresh token is required' });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Check if user/mapper still exists and is active
    let account;
    if (decoded.role === 'mapper') {
      account = await Mapper.findById(decoded.id);
    } else {
      account = await User.findById(decoded.id);
    }

    if (!account || !account.isActive) {
      res.status(401).json({ success: false, error: 'Account not found or deactivated' });
      return;
    }

    // Generate new token pair
    const payload: AuthPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    const tokens = generateTokenPair(payload);

    res.json({
      success: true,
      ...tokens,
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid refresh token. Please login again.' });
  }
};

/**
 * Get current authenticated user/mapper profile
 * GET /api/auth/me
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    let profile;
    if (req.user.role === 'mapper') {
      profile = await Mapper.findById(req.user.id);
    } else {
      profile = await User.findById(req.user.id);
    }

    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    res.json({ success: true, profile, role: req.user.role });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

/**
 * Delete user account
 * DELETE /api/auth/account
 */
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { password } = req.body;

    if (!password) {
      res.status(400).json({ success: false, error: 'Password is required to delete your account' });
      return;
    }

    let account;
    if (req.user.role === 'mapper') {
      account = await Mapper.findById(req.user.id).select('+password');
    } else {
      account = await User.findById(req.user.id).select('+password');
    }

    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    // Verify password before deletion
    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Incorrect password' });
      return;
    }

    // Soft delete - mark as inactive
    account.isActive = false;
    await account.save();

    // If mapper, also set offline
    if (req.user.role === 'mapper') {
      (account as any).isLive = false;
      (account as any).status = 'INACTIVE';
      await account.save();
    }

    res.json({
      success: true,
      message: 'Account has been permanently deactivated. Your data will be removed within 30 days.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account. Please try again.' });
  }
};

/**
 * Change password
 * PUT /api/auth/password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      return;
    }

    let account;
    if (req.user.role === 'mapper') {
      account = await Mapper.findById(req.user.id).select('+password');
    } else {
      account = await User.findById(req.user.id).select('+password');
    }

    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    const isMatch = await account.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    account.password = newPassword;
    await account.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
};
