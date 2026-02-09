import { NextRequest, NextResponse } from "next/server";
import { mappers } from "../mappers/route";
import { sessions } from "../sessions/route";
import { Mapper, MappingSession } from "@/types/mapper";

// Sync endpoint to receive data from client localStorage
export async function POST(request: NextRequest) {
  try {
    const { mappers: clientMappers, sessions: clientSessions } = await request.json();

    // Merge client data into server storage
    if (Array.isArray(clientMappers)) {
      clientMappers.forEach((mapper: Mapper) => {
        mappers.set(mapper.id, mapper);
      });
    }

    if (Array.isArray(clientSessions)) {
      clientSessions.forEach((session: MappingSession) => {
        sessions.set(session.id, session);
      });
    }

    return NextResponse.json({
      success: true,
      synced: {
        mappers: clientMappers?.length || 0,
        sessions: clientSessions?.length || 0,
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync data" },
      { status: 500 }
    );
  }
}

// Get all server data for client sync
export async function GET(request: NextRequest) {
  try {
    const allMappers = Array.from(mappers.values());
    const allSessions = Array.from(sessions.values());

    return NextResponse.json({
      mappers: allMappers,
      sessions: allSessions,
    });
  } catch (error) {
    console.error("Sync fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync data" },
      { status: 500 }
    );
  }
}
