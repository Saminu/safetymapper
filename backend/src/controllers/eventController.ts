import { Request, Response } from 'express';
import Event from '../models/Event';
import Mapper from '../models/Mapper';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../types';
import { isWithinRadius } from '../utils/helpers';
import path from 'path';
import fs from 'fs';
import { videosDir } from '../middleware/upload';

/**
 * Create a new event (with optional video upload) 
 * POST /api/events
 */
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { category, customCategory, title, description, lat, lon, address, severity } = req.body;

    // Validate required fields
    if (!category || !title || !description || lat === undefined || lon === undefined) {
      res.status(400).json({
        success: false,
        error: 'Category, title, description, latitude, and longitude are required',
      });
      return;
    }

    // If category is OTHER, customCategory is required
    if (category === 'OTHER' && !customCategory) {
      res.status(400).json({
        success: false,
        error: 'Custom category name is required when category is "OTHER"',
      });
      return;
    }

    // Get reporter name
    let reporterName = 'Unknown';
    if (req.user.role === 'mapper') {
      const mapper = await Mapper.findById(req.user.id);
      if (mapper) reporterName = mapper.name;
    } else {
      const User = (await import('../models/User')).default;
      const user = await User.findById(req.user.id);
      if (user) reporterName = user.name;
    }

    // Handle video file
    let videoUrl: string | undefined;
    let videoKey: string | undefined;
    if (req.file) {
      videoKey = req.file.filename;
      videoUrl = `/api/videos/${req.file.filename}`;
    }

    const event = await Event.create({
      category,
      customCategory: category === 'OTHER' ? customCategory : undefined,
      title,
      description,
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        address,
      },
      severity: severity || 'MEDIUM',
      status: 'ACTIVE',
      videoUrl,
      videoKey,
      reporterId: req.user.id,
      reporterName,
      reporterRole: req.user.role,
      verified: req.user.role === 'mapper', // Auto-verify mapper reports
    });

    // Award tokens to mapper for reporting events
    if (req.user.role === 'mapper') {
      const mapper = await Mapper.findById(req.user.id);
      if (mapper) {
        mapper.totalEvents += 1;
        mapper.totalEarnings += 5; // 5 tokens per event report
        await mapper.save();

        // Create transaction record
        await Transaction.create({
          mapperId: req.user.id,
          eventId: event._id,
          amount: 5,
          type: 'EVENT_REPORT',
          status: 'COMPLETED',
          description: `Event report: ${title}`,
        });
      }
    }

    res.status(201).json({
      success: true,
      event: {
        id: event._id,
        category: event.category,
        customCategory: event.customCategory,
        title: event.title,
        description: event.description,
        location: event.location,
        severity: event.severity,
        status: event.status,
        videoUrl: event.videoUrl,
        reporterName: event.reporterName,
        reporterRole: event.reporterRole,
        verified: event.verified,
        createdAt: event.createdAt,
      },
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
};

/**
 * Get all events (with filters)
 * GET /api/events
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      category,
      lat,
      lon,
      radius,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (category) query.category = category;

    // Sort
    const sortOptions: any = {};
    sortOptions[sortBy as string] = order === 'asc' ? 1 : -1;

    let events = await Event.find(query)
      .sort(sortOptions)
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string))
      .lean();

    // Filter by radius if location provided
    if (lat && lon && radius) {
      const centerLat = parseFloat(lat as string);
      const centerLon = parseFloat(lon as string);
      const radiusKm = parseFloat(radius as string);

      events = events.filter((event) =>
        isWithinRadius(centerLat, centerLon, event.location.lat, event.location.lon, radiusKm)
      );
    }

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      events,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + events.length < total,
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
};

/**
 * Get active events (for the map display)
 * GET /api/events/active
 */
export const getActiveEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lon, radius = '50' } = req.query;

    const query: any = { status: 'ACTIVE' };

    let events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Filter by radius if location provided
    if (lat && lon) {
      const centerLat = parseFloat(lat as string);
      const centerLon = parseFloat(lon as string);
      const radiusKm = parseFloat(radius as string);

      events = events.filter((event) =>
        isWithinRadius(centerLat, centerLon, event.location.lat, event.location.lon, radiusKm)
      );
    }

    res.json({
      success: true,
      events: events.map((event) => ({
        id: event._id,
        category: event.category,
        customCategory: event.customCategory,
        title: event.title,
        description: event.description,
        location: event.location,
        severity: event.severity,
        status: event.status,
        videoUrl: event.videoUrl,
        reporterName: event.reporterName,
        verified: event.verified,
        updatesCount: event.updates?.length || 0,
        createdAt: event.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get active events error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active events' });
  }
};

/**
 * Get recent events (timeline view)
 * GET /api/events/recent
 */
export const getRecentEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lon, radius = '50', limit = '20' } = req.query;

    // Get events from the last 24 hours
    const since = new Date();
    since.setHours(since.getHours() - 24);

    let events = await Event.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string) * 2) // Fetch extra to account for radius filtering
      .lean();

    // Filter by radius if location provided
    if (lat && lon) {
      const centerLat = parseFloat(lat as string);
      const centerLon = parseFloat(lon as string);
      const radiusKm = parseFloat(radius as string);

      events = events.filter((event) =>
        isWithinRadius(centerLat, centerLon, event.location.lat, event.location.lon, radiusKm)
      );
    }

    // Limit after filtering
    events = events.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      events: events.map((event) => ({
        id: event._id,
        category: event.category,
        customCategory: event.customCategory,
        title: event.title,
        description: event.description,
        location: event.location,
        severity: event.severity,
        status: event.status,
        videoUrl: event.videoUrl,
        reporterName: event.reporterName,
        reporterRole: event.reporterRole,
        verified: event.verified,
        updatesCount: event.updates?.length || 0,
        createdAt: event.createdAt,
        timeAgo: getTimeAgo(event.createdAt),
      })),
    });
  } catch (error) {
    console.error('Get recent events error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent events' });
  }
};

/**
 * Get a single event by ID
 * GET /api/events/:id
 */
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }

    // Increment view count
    event.viewCount += 1;
    await event.save();

    res.json({ success: true, event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
};

/**
 * Update an event (mapper marks it as cleared/updated with evidence)
 * POST /api/events/:id/update
 */
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Only mappers can update events
    if (req.user.role !== 'mapper') {
      res.status(403).json({ success: false, error: 'Only mappers can update events' });
      return;
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }

    const { status, comment } = req.body;

    if (!status || !comment) {
      res.status(400).json({
        success: false,
        error: 'Status and comment are required',
      });
      return;
    }

    if (!['ACTIVE', 'CLEARED', 'UPDATED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status. Use ACTIVE, CLEARED, or UPDATED' });
      return;
    }

    // Get updater name
    const mapper = await Mapper.findById(req.user.id);
    if (!mapper) {
      res.status(404).json({ success: false, error: 'Mapper not found' });
      return;
    }

    // Handle video evidence
    let videoUrl: string | undefined;
    let videoKey: string | undefined;
    if (req.file) {
      videoKey = req.file.filename;
      videoUrl = `/api/videos/${req.file.filename}`;
    }

    // Add update to the event
    event.updates.push({
      updaterId: mapper._id,
      updaterName: mapper.name,
      updaterRole: 'mapper',
      status,
      comment,
      videoUrl,
      videoKey,
      timestamp: new Date(),
    });

    // Update event status
    event.status = status;

    await event.save();

    // Award tokens for updating events
    mapper.totalEarnings += 3; // 3 tokens for updating an event
    await mapper.save();

    await Transaction.create({
      mapperId: req.user.id,
      eventId: event._id,
      amount: 3,
      type: 'EVENT_REPORT',
      status: 'COMPLETED',
      description: `Event update: ${event.title} - ${status}`,
    });

    res.json({
      success: true,
      message: `Event ${status === 'CLEARED' ? 'marked as cleared' : 'updated'} successfully`,
      event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
};

/**
 * Stream/serve a video file
 * GET /api/videos/:filename
 */
export const streamVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename as string;
    const filePath = path.join(videosDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header for streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      file.pipe(res);
    } else {
      // No range, send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Video stream error:', error);
    res.status(500).json({ success: false, error: 'Failed to stream video' });
  }
};

/**
 * Delete an event (only the reporter or admin can delete)
 * DELETE /api/events/:id
 */
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }

    // Only the reporter can delete their own event
    if (event.reporterId.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: 'You can only delete your own events' });
      return;
    }

    // Delete associated video file
    if (event.videoKey) {
      const filePath = path.join(videosDir, event.videoKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete update videos
    if (event.updates) {
      for (const update of event.updates) {
        if (update.videoKey) {
          const filePath = path.join(videosDir, update.videoKey);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
};

// Helper to format relative time
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
