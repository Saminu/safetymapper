import { Request, Response } from 'express';
import MappingSession from '../models/MappingSession';
import Mapper from '../models/Mapper';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../types';
import path from 'path';
import fs from 'fs';
import { videosDir } from '../middleware/upload';

/**
 * Create a new mapping session
 * POST /api/sessions
 */
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    const { startLocation } = req.body;

    if (!startLocation || !startLocation.lat || !startLocation.lon) {
      res.status(400).json({ success: false, error: 'Start location is required' });
      return;
    }

    // Check if mapper already has an active session
    const activeSession = await MappingSession.findOne({
      mapperId: req.user.id,
      status: 'ACTIVE',
    });

    if (activeSession) {
      res.status(409).json({
        success: false,
        error: 'You already have an active session. Please end it before starting a new one.',
        activeSessionId: activeSession._id,
      });
      return;
    }

    const session = await MappingSession.create({
      mapperId: req.user.id,
      startLocation,
      currentLocation: startLocation,
      route: [{ ...startLocation, timestamp: new Date().toISOString(), speed: 0 }],
      status: 'ACTIVE',
    });

    // Set mapper as live
    await Mapper.findByIdAndUpdate(req.user.id, {
      isLive: true,
      currentLocation: startLocation,
    });

    res.status(201).json({
      success: true,
      session: {
        id: session._id,
        mapperId: session.mapperId,
        startTime: session.startTime,
        status: session.status,
        startLocation: session.startLocation,
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, error: 'Failed to start mapping session' });
  }
};

/**
 * Get all sessions (with filters)
 * GET /api/sessions
 */
export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mapperId, status, limit = '50', offset = '0' } = req.query;

    const query: any = {};
    if (mapperId) query.mapperId = mapperId;
    if (status) query.status = status;

    const sessions = await MappingSession.find(query)
      .sort({ startTime: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string))
      .populate('mapperId', 'name vehicleType')
      .lean();

    const total = await MappingSession.countDocuments(query);

    res.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s._id,
        mapperId: (s.mapperId as any)?._id || s.mapperId,
        mapperName: (s.mapperId as any)?.name,
        mapperVehicle: (s.mapperId as any)?.vehicleType,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        startLocation: s.startLocation,
        currentLocation: s.currentLocation,
        distance: s.distance,
        duration: s.duration,
        tokensEarned: s.tokensEarned,
        videoUrl: s.videoUrl,
        gridConfidence: s.gridConfidence,
        createdAt: s.createdAt,
      })),
      pagination: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
};

/**
 * Get a single session
 * GET /api/sessions/:id
 */
export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await MappingSession.findById(req.params.id)
      .populate('mapperId', 'name vehicleType phone')
      .lean();

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
};

/**
 * Update session location (live tracking)
 * POST /api/sessions/:id/location
 */
export const updateSessionLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    const { location, speed, timestamp } = req.body;

    if (!location || !location.lat || !location.lon) {
      res.status(400).json({ success: false, error: 'Location is required' });
      return;
    }

    const session = await MappingSession.findOne({
      _id: req.params.id,
      mapperId: req.user.id,
      status: 'ACTIVE',
    });

    if (!session) {
      res.status(404).json({ success: false, error: 'Active session not found' });
      return;
    }

    // Add to route
    session.route.push({
      lat: location.lat,
      lon: location.lon,
      timestamp: timestamp || new Date().toISOString(),
      speed: speed || 0,
    });

    session.currentLocation = location;
    await session.save();

    // Also update mapper's current location
    await Mapper.findByIdAndUpdate(req.user.id, {
      currentLocation: location,
    });

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('Update session location error:', error);
    res.status(500).json({ success: false, error: 'Failed to update location' });
  }
};

/**
 * End/update a session
 * PATCH /api/sessions/:id
 */
export const updateSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    const session = await MappingSession.findOne({
      _id: req.params.id,
      mapperId: req.user.id,
    });

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const { status, distance, duration, tokensEarned, endTime } = req.body;

    if (status) session.status = status;
    if (distance !== undefined) session.distance = distance;
    if (duration !== undefined) session.duration = duration;
    if (tokensEarned !== undefined) session.tokensEarned = tokensEarned;
    if (endTime) session.endTime = new Date(endTime);

    await session.save();

    // If session completed, update mapper stats
    if (status === 'COMPLETED') {
      const mapper = await Mapper.findById(req.user.id);
      if (mapper) {
        mapper.isLive = false;
        mapper.totalDistance += distance || 0;
        mapper.totalDuration += duration || 0;
        mapper.totalEarnings += tokensEarned || 0;
        await mapper.save();

        // Create earning transaction
        if (tokensEarned && tokensEarned > 0) {
          await Transaction.create({
            mapperId: req.user.id,
            sessionId: session._id,
            amount: tokensEarned,
            type: 'MAPPING',
            status: 'COMPLETED',
            description: `Mapping session: ${distance?.toFixed(2) || 0}km, ${duration || 0}min`,
          });
        }
      }
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, error: 'Failed to update session' });
  }
};

/**
 * Upload video for a session
 * POST /api/sessions/:id/upload
 */
export const uploadSessionVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Mapper access required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No video file provided' });
      return;
    }

    const session = await MappingSession.findOne({
      _id: req.params.id,
      mapperId: req.user.id,
    });

    if (!session) {
      // Clean up uploaded file
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    // Delete old video if exists
    if (session.videoKey) {
      const oldPath = path.join(videosDir, session.videoKey);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    session.videoUrl = `/api/videos/${req.file.filename}`;
    session.videoKey = req.file.filename;
    await session.save();

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      videoUrl: session.videoUrl,
    });
  } catch (error) {
    console.error('Upload session video error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload video' });
  }
};

/**
 * Get network stats
 * GET /api/network-stats
 */
export const getNetworkStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalMappers = await Mapper.countDocuments({ isActive: true });
    const activeMappers = await Mapper.countDocuments({ isActive: true, isLive: true });
    const verifiedStreams = await MappingSession.countDocuments({ status: 'ACTIVE' });

    // Aggregate stats
    const earningsAgg = await Mapper.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$totalEarnings' },
          totalDistance: { $sum: '$totalDistance' },
        },
      },
    ]);

    const totalPaid = earningsAgg[0]?.totalPaid || 0;
    const totalDistance = earningsAgg[0]?.totalDistance || 0;

    // Calculate grid confidence (simulated metric)
    const activeSessions = await MappingSession.countDocuments({ status: 'ACTIVE' });
    const gridConfidence = Math.min(98.5, 50 + totalMappers * 0.5 + activeSessions * 5);

    res.json({
      success: true,
      stats: {
        totalMappers,
        activeMappers,
        verifiedStreams,
        totalPaid: totalPaid * 100, // Convert tokens to NGN
        totalDistance,
        gridConfidence,
      },
    });
  } catch (error) {
    console.error('Get network stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch network stats' });
  }
};
