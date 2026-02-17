import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  category: string;
  customCategory?: string; // When category is "OTHER"
  title: string;
  description: string;
  location: {
    lat: number;
    lon: number;
    address?: string;
  };
  severity: string;
  status: string;
  videoUrl?: string;
  videoKey?: string; // GridFS file ID or storage key
  thumbnailUrl?: string;
  reporterId: mongoose.Types.ObjectId;
  reporterName: string;
  reporterRole: 'mapper' | 'user';
  verified: boolean;
  updates: Array<{
    updaterId: mongoose.Types.ObjectId;
    updaterName: string;
    updaterRole: 'mapper' | 'user';
    status: string;
    comment: string;
    videoUrl?: string;
    videoKey?: string;
    timestamp: Date;
  }>;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const eventUpdateSchema = new Schema(
  {
    updaterId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'updates.updaterRole',
    },
    updaterName: {
      type: String,
      required: true,
    },
    updaterRole: {
      type: String,
      enum: ['mapper', 'user'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLEARED', 'UPDATED'],
      required: true,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500,
    },
    videoUrl: String,
    videoKey: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const eventSchema = new Schema<IEvent>(
  {
    category: {
      type: String,
      enum: [
        'ACCIDENT',
        'FLOOD',
        'RAIN',
        'TRAFFIC',
        'POLICE',
        'HAZARD',
        'ROAD_WORK',
        'FIRE',
        'PROTEST',
        'SOS',
        'OTHER',
      ],
      required: [true, 'Event category is required'],
    },
    customCategory: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: 1000,
    },
    location: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
      },
      lon: {
        type: Number,
        required: [true, 'Longitude is required'],
      },
      address: String,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLEARED', 'UPDATED'],
      default: 'ACTIVE',
    },
    videoUrl: String,
    videoKey: String,
    thumbnailUrl: String,
    reporterId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    reporterRole: {
      type: String,
      enum: ['mapper', 'user'],
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    updates: [eventUpdateSchema],
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for querying
eventSchema.index({ 'location.lat': 1, 'location.lon': 1 });
eventSchema.index({ status: 1, createdAt: -1 });
eventSchema.index({ category: 1 });
eventSchema.index({ reporterId: 1 });

const Event = mongoose.model<IEvent>('Event', eventSchema);
export default Event;
