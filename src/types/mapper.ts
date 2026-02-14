export type VehicleType =
  | "TAXI_MAX_RIDES"
  | "OKADA_MOTORCYCLE"
  | "DANFO_BUS"
  | "BOLT_UBER"
  | "BOX_TRUCK"
  | "PRIVATE_CAR"
  | "KEKE_NAPEP"
  | "OTHER";

export type MapperStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

export interface Mapper {
  id: string;
  name: string;
  email?: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  status: MapperStatus;
  createdAt: string;
  totalEarnings: number;
  totalDistance: number; // in kilometers
  totalDuration: number; // in minutes
  currentLocation?: {
    lat: number;
    lon: number;
  };
  isLive: boolean;
}

export type SessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export interface MappingSession {
  id: string;
  mapperId: string;
  mapper?: Mapper;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  startLocation: {
    lat: number;
    lon: number;
  };
  currentLocation?: {
    lat: number;
    lon: number;
  };
  route?: Array<{
    lat: number;
    lon: number;
    timestamp: string;
    speed?: number; // km/h
  }>;
  distance: number; // in kilometers
  duration: number; // in minutes
  tokensEarned: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  gridConfidence: number; // percentage
}

export interface RewardTransaction {
  id: string;
  mapperId: string;
  sessionId: string;
  amount: number;
  type: "MAPPING" | "BONUS" | "REFERRAL" | "WITHDRAWAL";
  status: "PENDING" | "COMPLETED" | "FAILED";
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NetworkStats {
  totalMappers: number;
  activeMappers: number;
  verifiedStreams: number;
  totalPaid: number; // in NGN or tokens
  totalDistance: number; // in kilometers
  gridConfidence: number; // percentage
}

export interface OnboardingData {
  name: string;
  phone: string;
  email?: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  agreedToTerms: boolean;
}

export type MapEventType =
  | "ACCIDENT"
  | "TRAFFIC"
  | "POLICE"
  | "HAZARD"
  | "ROAD_WORK"
  | "SOS";

export interface MapEvent {
  id: string;
  type: MapEventType;
  location: {
    lat: number;
    lon: number;
  };
  description: string;
  timestamp: string;
  reporterId?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  verified: boolean;
  imageUrl?: string;
}
