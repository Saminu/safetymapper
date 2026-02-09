import { NextRequest, NextResponse } from "next/server";
import { Mapper, OnboardingData } from "@/types/mapper";

// In-memory storage for MVP (replace with database in production)
const mappers: Map<string, Mapper> = new Map();

export async function POST(request: NextRequest) {
  try {
    const data: OnboardingData = await request.json();

    // Validate required fields
    if (!data.name || !data.phone || !data.vehicleType || !data.agreedToTerms) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate mapper ID
    const mapperId = `mapper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create mapper object
    const mapper: Mapper = {
      id: mapperId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      vehicleType: data.vehicleType,
      vehicleNumber: data.vehicleNumber,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      totalEarnings: 0,
      totalDistance: 0,
      totalDuration: 0,
      isLive: false,
    };

    // Store mapper
    mappers.set(mapperId, mapper);

    return NextResponse.json({ mapper }, { status: 201 });
  } catch (error) {
    console.error("Mapper creation error:", error);
    return NextResponse.json(
      { error: "Failed to create mapper" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const isLive = searchParams.get("isLive");

    let filteredMappers = Array.from(mappers.values());

    // Apply filters
    if (status) {
      filteredMappers = filteredMappers.filter((m) => m.status === status);
    }
    if (isLive !== null) {
      const liveFilter = isLive === "true";
      filteredMappers = filteredMappers.filter((m) => m.isLive === liveFilter);
    }

    return NextResponse.json({
      mappers: filteredMappers,
      total: filteredMappers.length,
    });
  } catch (error) {
    console.error("Mappers fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mappers" },
      { status: 500 }
    );
  }
}

// Export storage for other API routes
export { mappers };
