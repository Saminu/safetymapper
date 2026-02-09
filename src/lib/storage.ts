// Client-side storage helper for MVP
// This keeps data persistent in the browser
// For production, replace with a real database

import { Mapper, MappingSession } from "@/types/mapper";

const STORAGE_KEYS = {
  MAPPERS: "safety_map_mappers",
  SESSIONS: "safety_map_sessions",
  CURRENT_SESSION: "safety_map_current_session",
};

// Mapper Storage
export const saveMapper = (mapper: Mapper) => {
  if (typeof window === "undefined") return;
  
  const mappers = getAllMappers();
  const index = mappers.findIndex(m => m.id === mapper.id);
  
  if (index >= 0) {
    mappers[index] = mapper;
  } else {
    mappers.push(mapper);
  }
  
  localStorage.setItem(STORAGE_KEYS.MAPPERS, JSON.stringify(mappers));
};

export const getAllMappers = (): Mapper[] => {
  if (typeof window === "undefined") return [];
  
  const data = localStorage.getItem(STORAGE_KEYS.MAPPERS);
  return data ? JSON.parse(data) : [];
};

export const getMapper = (id: string): Mapper | null => {
  const mappers = getAllMappers();
  return mappers.find(m => m.id === id) || null;
};

// Session Storage
export const saveSession = (session: MappingSession) => {
  if (typeof window === "undefined") return;
  
  const sessions = getAllSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

export const getAllSessions = (): MappingSession[] => {
  if (typeof window === "undefined") return [];
  
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const getSession = (id: string): MappingSession | null => {
  const sessions = getAllSessions();
  return sessions.find(s => s.id === id) || null;
};

export const getActiveSessions = (): MappingSession[] => {
  return getAllSessions().filter(s => s.status === "ACTIVE");
};

export const getCompletedSessions = (): MappingSession[] => {
  return getAllSessions().filter(s => s.status === "COMPLETED");
};

// Current Session (for active mapping)
export const setCurrentSession = (sessionId: string | null) => {
  if (typeof window === "undefined") return;
  
  if (sessionId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
};

export const getCurrentSessionId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
};

// Sync data to server (for multi-device support in future)
export const syncToServer = async () => {
  if (typeof window === "undefined") return;
  
  const mappers = getAllMappers();
  const sessions = getAllSessions();
  
  try {
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mappers, sessions }),
    });
  } catch (error) {
    console.error("Sync error:", error);
  }
};
