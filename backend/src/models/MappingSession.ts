import mongoose, { Schema, Document } from 'mongoose';

export interface IMappingSession extends Document {
  _id: mongoose.Types.ObjectId;
  mapperId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  status: string;
  startLocation: {
    lat: number;
    lon: number;
  };
  currentLocation?: {
    lat: number;
    lon: number;
  };
  route: Array<{
    lat: number;
    lon: number;
    timestamp: string;
    speed?: number;
  }>;
  distance: number;
  duration: number;
  tokensEarned: number;
  videoUrl?: string;
  videoKey?: string;
  thumbnailUrl?: string;
  gridConfidence: number;
  createdAt: Date;
  updatedAt: Date;
}

const mappingSessionSchema = new Schema<IMappingSession>(
  {
    mapperId: {
      type: Schema.Types.ObjectId,
      ref: 'Mapper',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    startLocation: {
      lat: {
        type: Number,
        required: true,
      },
      lon: {
        type: Number,
        required: true,
      },
    },
    currentLocation: {
      lat: Number,
      lon: Number,
    },
    route: [
      {
        lat: Number,
        lon: Number,
        timestamp: String,
        speed: Number,
        _id: false,
      },
    ],
    distance: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    tokensEarned: {
      type: Number,
      default: 0,
    },
    videoUrl: String,
    videoKey: String,
    thumbnailUrl: String,
    gridConfidence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mappingSessionSchema.index({ status: 1, startTime: -1 });
mappingSessionSchema.index({ mapperId: 1, status: 1 });

const MappingSession = mongoose.model<IMappingSession>('MappingSession', mappingSessionSchema);
export default MappingSession;
