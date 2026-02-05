import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://beemaps.com/api/developer";

// Create a polygon approximating a circle around a point
function createCirclePolygon(lat: number, lon: number, radiusMeters: number, numPoints: number = 32): number[][] {
  const coords: number[][] = [];
  const earthRadius = 6371000; // meters

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const dLat = (radiusMeters / earthRadius) * Math.cos(angle);
    const dLon = (radiusMeters / (earthRadius * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);

    coords.push([
      lon + (dLon * 180 / Math.PI),
      lat + (dLat * 180 / Math.PI)
    ]);
  }

  return coords;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("Authorization");
    const lat = request.nextUrl.searchParams.get("lat");
    const lon = request.nextUrl.searchParams.get("lon");
    const radius = request.nextUrl.searchParams.get("radius") || "200";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      );
    }

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "lat and lon are required" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusMeters = parseFloat(radius);

    // Create a polygon approximating a circle
    const polygonCoords = createCirclePolygon(latitude, longitude, radiusMeters);

    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;

    const response = await fetch(`${API_BASE_URL}/map-data`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Map features API error:", response.status, errorText);
      return NextResponse.json(
        { error: `API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Map data API response:", JSON.stringify(data, null, 2));

    // Transform response to expected format
    // The /map-data endpoint returns { mapFeatureResults: { data: [...] } }
    const features = data.mapFeatureResults?.data || [];

    return NextResponse.json({ features, raw: data });
  } catch (error) {
    console.error("Map features proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
