import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/constants";

const MAP_API_BASE_URL = "https://beemaps.com/api/developer";

interface MapFeature {
  class: string;
  position: { lon: number; lat: number };
  properties?: Record<string, unknown>;
}

interface LabeledFeature {
  class: string;
  distance: number;
  position: { lat: number; lon: number };
  speedLimit?: number;
  unit?: string;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Create a polygon approximating a circle around a point
function createCirclePolygon(
  lat: number,
  lon: number,
  radiusMeters: number,
  numPoints: number = 32
): number[][] {
  const coords: number[][] = [];
  const earthRadius = 6371000; // meters

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const dLat = (radiusMeters / earthRadius) * Math.cos(angle);
    const dLon =
      (radiusMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))) *
      Math.sin(angle);

    coords.push([lon + (dLon * 180) / Math.PI, lat + (dLat * 180) / Math.PI]);
  }

  return coords;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("Authorization");
    const eventId = request.nextUrl.searchParams.get("eventId");
    const timestampParam = request.nextUrl.searchParams.get("timestamp") || "0";
    const widthParam = request.nextUrl.searchParams.get("width") || "1280";
    const radiusParam = request.nextUrl.searchParams.get("radius") || "100";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    const timestamp = parseFloat(timestampParam);
    const width = parseInt(widthParam, 10);
    const radius = parseInt(radiusParam, 10);

    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;

    // Fetch event details
    const eventResponse = await fetch(`${API_BASE_URL}/${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      return NextResponse.json(
        { error: `Failed to fetch event: ${errorText}` },
        { status: eventResponse.status }
      );
    }

    const event = await eventResponse.json();

    // Query map features API for nearby signs
    const polygonCoords = createCirclePolygon(
      event.location.lat,
      event.location.lon,
      radius
    );

    const mapFeaturesResponse = await fetch(`${MAP_API_BASE_URL}/map-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        type: ["mapFeatures"],
        geometry: {
          type: "Polygon",
          coordinates: [polygonCoords],
        },
      }),
    });

    let features: LabeledFeature[] = [];

    if (mapFeaturesResponse.ok) {
      const mapData = await mapFeaturesResponse.json();
      const rawFeatures = (mapData.mapFeatureResults?.data ||
        []) as MapFeature[];

      // Transform features and calculate distances
      features = rawFeatures
        .filter((f) => f.class && f.position)
        .map((f) => {
          const distance = calculateDistance(
            event.location.lat,
            event.location.lon,
            f.position.lat,
            f.position.lon
          );

          const labeled: LabeledFeature = {
            class: f.class,
            distance: Math.round(distance),
            position: {
              lat: f.position.lat,
              lon: f.position.lon,
            },
          };

          // Include speed limit info for speed signs
          if (f.properties?.speedLimit) {
            labeled.speedLimit = f.properties.speedLimit as number;
            labeled.unit = (f.properties.unit as string) || "mph";
          }

          return labeled;
        })
        .sort((a, b) => a.distance - b.distance);
    }

    // Build frame URL
    const frameUrl = `/api/frames?url=${encodeURIComponent(
      event.videoUrl
    )}&timestamp=${timestamp}&width=${width}`;

    // Build response
    const response = {
      frame: {
        url: frameUrl,
        timestamp,
        width,
      },
      location: {
        lat: event.location.lat,
        lon: event.location.lon,
      },
      features,
      event: {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        videoUrl: event.videoUrl,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Labeled frame API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
