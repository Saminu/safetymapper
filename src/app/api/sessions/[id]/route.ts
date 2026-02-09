import { NextRequest, NextResponse } from "next/server";
import { sessions } from "../route";
import { mappers } from "../../mappers/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = sessions.get(id);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const session = sessions.get(id);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Update session
    const updatedSession = {
      ...session,
      ...updates,
      endTime: updates.status === "COMPLETED" ? new Date().toISOString() : session.endTime,
    };

    sessions.set(id, updatedSession);

    // If session is completed, update mapper stats and mark as not live
    if (updates.status === "COMPLETED") {
      const mapper = mappers.get(session.mapperId);
      if (mapper) {
        mapper.isLive = false;
        mapper.totalEarnings += updates.tokensEarned || session.tokensEarned || 0;
        mapper.totalDistance += updates.distance || session.distance || 0;
        mapper.totalDuration += updates.duration || session.duration || 0;
        mappers.set(session.mapperId, mapper);
      }
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
