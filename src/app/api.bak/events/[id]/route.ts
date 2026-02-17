import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiKey = request.headers.get("Authorization");

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      );
    }

    // Use Basic auth for base64-encoded API keys
    const authHeader = apiKey.startsWith("Basic ") ? apiKey : `Basic ${apiKey}`;

    // Build URL with optional query parameters for GNSS and IMU data
    const url = new URL(`${API_BASE_URL}/${id}`);
    const searchParams = request.nextUrl.searchParams;

    if (searchParams.get("includeGnssData") === "true") {
      url.searchParams.set("includeGnssData", "true");
    }
    if (searchParams.get("includeImuData") === "true") {
      url.searchParams.set("includeImuData", "true");
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (typeof errorJson === "string") {
          errorMessage = errorJson;
        } else if (errorJson.message) {
          errorMessage =
            typeof errorJson.message === "string"
              ? errorJson.message
              : JSON.stringify(errorJson.message);
        } else if (errorJson.error) {
          errorMessage =
            typeof errorJson.error === "string"
              ? errorJson.error
              : JSON.stringify(errorJson.error);
        }
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
