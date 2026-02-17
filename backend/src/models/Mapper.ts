import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IMapper extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'mapper';
  vehicleType: string;
  vehicleNumber?: string;
  status: string;
  avatar?: string;
  currentLocation?: {
    lat: number;
    lon: number;
  };
  isLive: boolean;
  totalEarnings: number;
  totalDistance: number;
  totalDuration: number;
  totalEvents: number;
  agreedToTerms: boolean;
  bankAccount?: string;
  bankName?: string;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const mapperSchema = new Schema<IMapper>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['mapper'],
      default: 'mapper',
    },
    vehicleType: {
      type: String,
      enum: [
        'TAXI_MAX_RIDES',
        'OKADA_MOTORCYCLE',
        'DANFO_BUS',
        'BOLT_UBER',
        'BOX_TRUCK',
        'PRIVATE_CAR',
        'KEKE_NAPEP',
        'OTHER',
      ],
      required: [true, 'Vehicle type is required'],
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'],
      default: 'ACTIVE',
    },
    avatar: String,
    currentLocation: {
      lat: Number,
      lon: Number,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalDistance: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    totalEvents: {
      type: Number,
      default: 0,
    },
    agreedToTerms: {
      type: Boolean,
      default: false,
    },
    bankAccount: String,
    bankName: String,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
mapperSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
mapperSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
mapperSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lon': 1 });
mapperSchema.index({ status: 1, isLive: 1 });

const Mapper = mongoose.model<IMapper>('Mapper', mapperSchema);
export default Mapper;
