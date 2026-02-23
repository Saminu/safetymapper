import { Request, Response } from 'express';
import Mapper from '../models/Mapper';
import Event from '../models/Event';
import User from '../models/User';
import mongoose from 'mongoose';

/**
 * Get overall dashboard stats
 * Total mappers, total events, total earnings, active mappers
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalMappers = await Mapper.countDocuments();
    const activeMappersCount = await Mapper.countDocuments({ status: 'ACTIVE' });
    const totalEventsCount = await Event.countDocuments();

    // Calculate total earnings across all mappers
    const result = await Mapper.aggregate([
      { $group: { _id: null, totalEarned: { $sum: '$totalEarnings' } } }
    ]);

    const totalEarned = result.length > 0 ? result[0].totalEarned : 0;

    res.status(200).json({
      success: true,
      data: {
        totalMappers,
        activeMappersCount,
        totalEvents: totalEventsCount,
        totalEarned
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * Get list of all mappers
 */
export const getAllMappers = async (req: Request, res: Response): Promise<void> => {
  try {
    const mappers = await Mapper.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: mappers.length,
      data: mappers
    });
  } catch (error) {
    console.error('Error fetching mappers:', error);
    res.status(500).json({ error: 'Failed to fetch mappers' });
  }
};

/**
 * Update mapper status (restrict temporarily, suspend, activate)
 */
export const updateMapperStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }

    const mapper = await Mapper.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!mapper) {
      res.status(404).json({ error: 'Mapper not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Mapper status updated to ${status}`,
      data: mapper
    });
  } catch (error) {
    console.error('Error updating mapper status:', error);
    res.status(500).json({ error: 'Failed to update mapper status' });
  }
};

/**
 * Delete a specific event
 */
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

/**
 * Change event status
 */
export const updateEventStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'CLEARED', 'UPDATED', 'CLOSED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status value' });
      return;
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Event status updated to ${status}`,
      data: event
    });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
};

/**
 * Get all events (for admin panel)
 */
export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};
