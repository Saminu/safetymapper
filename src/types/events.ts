export type AIEventType =
  | "HARSH_BRAKING"
  | "AGGRESSIVE_ACCELERATION"
  | "SWERVING"
  | "HIGH_SPEED"
  | "HIGH_G_FORCE"
  | "STOP_SIGN_VIOLATION"
  | "TRAFFIC_LIGHT_VIOLATION"
  | "TAILGATING"
  | "MANUAL_REQUEST"
  | "UNKNOWN";

export interface AIEventLocation {
  lat: number;
  lon: number;
}

export interface GnssDataPoint {
  lat: number;
  lon: number;
  alt: number;
  timestamp: number;
}

export interface ImuDataPoint {
  timestamp: number;
  accelerometer?: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface AIEvent {
  id: string;
  type: AIEventType;
  timestamp: string;
  location: AIEventLocation;
  metadata?: Record<string, unknown>;
  videoUrl: string;
  gnssData?: GnssDataPoint[];
  imuData?: ImuDataPoint[];
}

export interface AIEventsResponse {
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  events: AIEvent[];
}

export interface AIEventsRequest {
  startDate: string;
  endDate: string;
  types?: AIEventType[];
  polygon?: [number, number][]; // Array of [lon, lat] coordinates forming a closed polygon
  limit?: number;
  offset?: number;
}

export interface Region {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  eventCount: number;
  country?: string;
}
