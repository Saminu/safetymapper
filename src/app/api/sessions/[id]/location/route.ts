import { NextRequest, NextResponse } from "next/server";
import { sessions } from "../../route";
import { mappers } from "../../../mappers/route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { location, speed, timestamp } = await request.json();
    const session = sessions.get(id);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Update current location and add to route
    session.currentLocation = location;
    session.route = session.route || [];
    session.route.push({
      lat: location.lat,
      lon: location.lon,
      timestamp,
      speed,
    });

    // Calculate distance (simple approximation)
    if (session.route.length > 1) {
      const prevPoint = session.route[session.route.length - 2];
      const R = 6371; // Earth's radius in km
      const dLat = ((location.lat - prevPoint.lat) * Math.PI) / 180;
      const dLon = ((location.lon - prevPoint.lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((prevPoint.lat * Math.PI) / 180) *
          Math.cos((location.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      session.distance += distance;
    }

    sessions.set(id, session);

    // Update mapper's current location
    const mapper = mappers.get(session.mapperId);
    if (mapper) {
      mapper.currentLocation = location;
      mappers.set(session.mapperId, mapper);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
