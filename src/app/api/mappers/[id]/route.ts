import { NextRequest, NextResponse } from "next/server";
import { mappers } from "../route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mapper = mappers.get(id);

    if (!mapper) {
      return NextResponse.json(
        { error: "Mapper not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ mapper });
  } catch (error) {
    console.error("Mapper fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mapper" },
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
    const mapper = mappers.get(id);

    if (!mapper) {
      return NextResponse.json(
        { error: "Mapper not found" },
        { status: 404 }
      );
    }

    // Update mapper
    const updatedMapper = {
      ...mapper,
      ...updates,
    };

    mappers.set(id, updatedMapper);

    return NextResponse.json({ mapper: updatedMapper });
  } catch (error) {
    console.error("Mapper update error:", error);
    return NextResponse.json(
      { error: "Failed to update mapper" },
      { status: 500 }
    );
  }
}
