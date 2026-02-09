import { NextRequest, NextResponse } from "next/server";
import { mappers } from "../mappers/route";
import { sessions } from "../sessions/route";
import { NetworkStats } from "@/types/mapper";

export async function GET(request: NextRequest) {
  try {
    const allMappers = Array.from(mappers.values());
    const allSessions = Array.from(sessions.values());

    // Calculate stats
    const activeMappers = allMappers.filter(m => m.isLive).length;
    const activeSessions = allSessions.filter(s => s.status === "ACTIVE");
    
    // Use mapper totals for cumulative stats (more accurate)
    const totalDistance = allMappers.reduce((sum, m) => sum + m.totalDistance, 0);
    const totalPaid = allMappers.reduce((sum, m) => sum + m.totalEarnings, 0);
    
    const stats: NetworkStats = {
      totalMappers: allMappers.length,
      activeMappers,
      verifiedStreams: activeSessions.length,
      totalPaid,
      totalDistance,
      gridConfidence: 98.2, // Calculate based on coverage
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
