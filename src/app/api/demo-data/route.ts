import { NextRequest, NextResponse } from "next/server";
import { mappers } from "../mappers/route";
import { sessions } from "../sessions/route";
import { Mapper, MappingSession } from "@/types/mapper";

// Lagos coordinates for demo data
const LAGOS_LOCATIONS = [
  { lat: 6.5244, lon: 3.3792, name: "Victoria Island" },
  { lat: 6.4541, lon: 3.3947, name: "Lekki" },
  { lat: 6.6018, lon: 3.3515, name: "Ikeja" },
  { lat: 6.4698, lon: 3.5852, name: "Ajah" },
  { lat: 6.4281, lon: 3.4219, name: "Ikoyi" },
];

export async function POST(request: NextRequest) {
  try {
    // Clear existing data
    mappers.clear();
    sessions.clear();

    // Create 5 demo mappers
    const demoMappers: Mapper[] = [
      {
        id: "mapper_demo_1",
        name: "Chukwudi Okafor",
        phone: "+234 803 123 4567",
        email: "chukwudi@example.com",
        vehicleType: "OKADA_MOTORCYCLE",
        vehicleNumber: "LAG-452-XY",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalEarnings: 45000,
        totalDistance: 128.5,
        totalDuration: 360,
        isLive: true,
        currentLocation: LAGOS_LOCATIONS[0],
      },
      {
        id: "mapper_demo_2",
        name: "Amina Bello",
        phone: "+234 805 234 5678",
        vehicleType: "TAXI_MAX_RIDES",
        vehicleNumber: "LAG-789-AB",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        totalEarnings: 78500,
        totalDistance: 245.3,
        totalDuration: 680,
        isLive: true,
        currentLocation: LAGOS_LOCATIONS[1],
      },
      {
        id: "mapper_demo_3",
        name: "Tunde Adeleke",
        phone: "+234 806 345 6789",
        vehicleType: "DANFO_BUS",
        vehicleNumber: "LAG-123-CD",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        totalEarnings: 125000,
        totalDistance: 432.8,
        totalDuration: 1240,
        isLive: false,
      },
      {
        id: "mapper_demo_4",
        name: "Blessing Nwankwo",
        phone: "+234 807 456 7890",
        vehicleType: "KEKE_NAPEP",
        vehicleNumber: "LAG-456-EF",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        totalEarnings: 32000,
        totalDistance: 95.2,
        totalDuration: 280,
        isLive: true,
        currentLocation: LAGOS_LOCATIONS[2],
      },
      {
        id: "mapper_demo_5",
        name: "Ibrahim Yusuf",
        phone: "+234 808 567 8901",
        vehicleType: "BOLT_UBER",
        vehicleNumber: "LAG-789-GH",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalEarnings: 156000,
        totalDistance: 567.9,
        totalDuration: 1580,
        isLive: false,
      },
    ];

    // Add mappers to storage
    demoMappers.forEach((mapper) => mappers.set(mapper.id, mapper));

    // Create active sessions for live mappers
    const activeSessions: MappingSession[] = [
      {
        id: "session_demo_1",
        mapperId: "mapper_demo_1",
        startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        status: "ACTIVE",
        startLocation: LAGOS_LOCATIONS[0],
        currentLocation: LAGOS_LOCATIONS[0],
        route: [
          {
            lat: LAGOS_LOCATIONS[0].lat,
            lon: LAGOS_LOCATIONS[0].lon,
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            speed: 25,
          },
          {
            lat: LAGOS_LOCATIONS[0].lat + 0.01,
            lon: LAGOS_LOCATIONS[0].lon + 0.01,
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            speed: 30,
          },
          {
            lat: LAGOS_LOCATIONS[0].lat + 0.02,
            lon: LAGOS_LOCATIONS[0].lon + 0.015,
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            speed: 28,
          },
        ],
        distance: 5.8,
        duration: 45,
        tokensEarned: 1350,
        gridConfidence: 98.2,
      },
      {
        id: "session_demo_2",
        mapperId: "mapper_demo_2",
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: "ACTIVE",
        startLocation: LAGOS_LOCATIONS[1],
        currentLocation: LAGOS_LOCATIONS[1],
        route: [
          {
            lat: LAGOS_LOCATIONS[1].lat,
            lon: LAGOS_LOCATIONS[1].lon,
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            speed: 20,
          },
          {
            lat: LAGOS_LOCATIONS[1].lat + 0.008,
            lon: LAGOS_LOCATIONS[1].lon - 0.008,
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            speed: 22,
          },
        ],
        distance: 3.5,
        duration: 30,
        tokensEarned: 900,
        gridConfidence: 97.8,
      },
      {
        id: "session_demo_3",
        mapperId: "mapper_demo_4",
        startTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        status: "ACTIVE",
        startLocation: LAGOS_LOCATIONS[2],
        currentLocation: LAGOS_LOCATIONS[2],
        route: [
          {
            lat: LAGOS_LOCATIONS[2].lat,
            lon: LAGOS_LOCATIONS[2].lon,
            timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
            speed: 18,
          },
        ],
        distance: 2.2,
        duration: 20,
        tokensEarned: 600,
        gridConfidence: 98.5,
      },
    ];

    // Add completed sessions
    const completedSessions: MappingSession[] = [
      {
        id: "session_demo_4",
        mapperId: "mapper_demo_3",
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "COMPLETED",
        startLocation: LAGOS_LOCATIONS[3],
        currentLocation: LAGOS_LOCATIONS[4],
        route: [],
        distance: 12.5,
        duration: 60,
        tokensEarned: 1800,
        gridConfidence: 98.0,
      },
      {
        id: "session_demo_5",
        mapperId: "mapper_demo_5",
        startTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: "COMPLETED",
        startLocation: LAGOS_LOCATIONS[4],
        currentLocation: LAGOS_LOCATIONS[0],
        route: [],
        distance: 18.3,
        duration: 75,
        tokensEarned: 2250,
        gridConfidence: 97.5,
      },
    ];

    // Add sessions to storage
    [...activeSessions, ...completedSessions].forEach((session) =>
      sessions.set(session.id, session)
    );

    return NextResponse.json({
      success: true,
      message: "Demo data created successfully",
      data: {
        mappers: demoMappers.length,
        activeSessions: activeSessions.length,
        completedSessions: completedSessions.length,
      },
    });
  } catch (error) {
    console.error("Demo data creation error:", error);
    return NextResponse.json(
      { error: "Failed to create demo data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear all data
    mappers.clear();
    sessions.clear();

    return NextResponse.json({
      success: true,
      message: "All demo data cleared",
    });
  } catch (error) {
    console.error("Demo data deletion error:", error);
    return NextResponse.json(
      { error: "Failed to clear demo data" },
      { status: 500 }
    );
  }
}
