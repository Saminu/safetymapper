import { NextRequest, NextResponse } from "next/server";

const ROAD_CLASS_LABELS: Record<string, string> = {
  motorway: "Highway",
  motorway_link: "Highway Ramp",
  trunk: "Major Road",
  trunk_link: "Major Road Ramp",
  primary: "Primary Road",
  primary_link: "Primary Road Ramp",
  secondary: "Secondary Road",
  secondary_link: "Secondary Road Ramp",
  tertiary: "Local Road",
  tertiary_link: "Local Road Ramp",
  street: "Residential",
  street_limited: "Residential",
  service: "Service Road",
  path: "Path/Trail",
  pedestrian: "Pedestrian",
  track: "Track",
};

export interface RoadTypeResponse {
  class: string | null;
  classLabel: string | null;
  structure: string | null;
  toll: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const lat = request.nextUrl.searchParams.get("lat");
    const lon = request.nextUrl.searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "lat and lon are required" },
        { status: 400 }
      );
    }

    const mapboxToken = request.nextUrl.searchParams.get("token") || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      return NextResponse.json(
        { error: "Mapbox token not configured" },
        { status: 500 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid lat/lon values" },
        { status: 400 }
      );
    }

    // Query Mapbox Tilequery API for road features
    const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json?layers=road&radius=10&limit=1&access_token=${mapboxToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mapbox Tilequery API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Mapbox API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract road properties from the first feature
    const feature = data.features?.[0];
    if (!feature) {
      return NextResponse.json({
        class: null,
        classLabel: null,
        structure: null,
        toll: false,
      } as RoadTypeResponse);
    }

    const properties = feature.properties || {};
    const roadClass = properties.class || null;
    const classLabel = roadClass ? (ROAD_CLASS_LABELS[roadClass] || roadClass) : null;
    const structure = properties.structure || null;
    const toll = properties.toll === true;

    return NextResponse.json({
      class: roadClass,
      classLabel,
      structure,
      toll,
    } as RoadTypeResponse);
  } catch (error) {
    console.error("Road type API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
