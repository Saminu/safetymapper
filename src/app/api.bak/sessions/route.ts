import { NextRequest, NextResponse } from "next/server";
import { MappingSession } from "@/types/mapper";
import { mappers } from "../mappers/route";

// In-memory storage for MVP (replace with database in production)
const sessions: Map<string, MappingSession> = new Map();

export async function POST(request: NextRequest) {
  try {
    const { mapperId, startLocation } = await request.json();

    if (!mapperId || !startLocation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session object
    const session: MappingSession = {
      id: sessionId,
      mapperId,
      startTime: new Date().toISOString(),
      status: "ACTIVE",
      startLocation,
      currentLocation: startLocation,
      route: [
        {
          lat: startLocation.lat,
          lon: startLocation.lon,
          timestamp: new Date().toISOString(),
        },
      ],
      distance: 0,
      duration: 0,
      tokensEarned: 0,
      gridConfidence: 98.2, // Default confidence
    };

    // Store session
    sessions.set(sessionId, session);

    // Update mapper to mark as live with current location
    const mapper = mappers.get(mapperId);
    if (mapper) {
      mapper.isLive = true;
      mapper.currentLocation = startLocation;
      mappers.set(mapperId, mapper);
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mapperId = searchParams.get("mapperId");
    const status = searchParams.get("status");

    let filteredSessions = Array.from(sessions.values());

    // Apply filters
    if (mapperId) {
      filteredSessions = filteredSessions.filter((s) => s.mapperId === mapperId);
    }
    if (status) {
      filteredSessions = filteredSessions.filter((s) => s.status === status);
    }

    // Sort by start time (most recent first)
    filteredSessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    return NextResponse.json({
      sessions: filteredSessions,
      total: filteredSessions.length,
    });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// Export storage for other API routes
export { sessions };
