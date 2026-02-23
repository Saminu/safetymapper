import { Request } from 'express';

export interface AuthPayload {
  id: string;
  email: string;
  role: 'mapper' | 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export type VehicleType =
  | 'TAXI_MAX_RIDES'
  | 'OKADA_MOTORCYCLE'
  | 'DANFO_BUS'
  | 'BOLT_UBER'
  | 'BOX_TRUCK'
  | 'PRIVATE_CAR'
  | 'KEKE_NAPEP'
  | 'OTHER';

export type MapperStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type EventCategory =
  | 'ACCIDENT'
  | 'FLOOD'
  | 'RAIN'
  | 'TRAFFIC'
  | 'POLICE'
  | 'HAZARD'
  | 'ROAD_WORK'
  | 'FIRE'
  | 'PROTEST'
  | 'SOS'
  | 'OTHER';

export type EventStatus = 'ACTIVE' | 'CLEARED' | 'UPDATED' | 'CLOSED';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TransactionType = 'MAPPING' | 'BONUS' | 'REFERRAL' | 'WITHDRAWAL' | 'EVENT_REPORT';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface LocationPoint {
  lat: number;
  lon: number;
}

export interface RoutePoint extends LocationPoint {
  timestamp: string;
  speed?: number;
}
