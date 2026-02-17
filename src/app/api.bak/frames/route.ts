import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";

const FRAMES_DIR = join(tmpdir(), "video-frames");

function getFrameHash(url: string, timestamp: number, width: number): string {
  return createHash("md5")
    .update(`${url}-${timestamp}-${width}`)
    .digest("hex");
}

function ensureFramesDir(): void {
  if (!existsSync(FRAMES_DIR)) {
    mkdirSync(FRAMES_DIR, { recursive: true });
  }
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toFixed(3).padStart(6, "0")}`;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const timestampParam = request.nextUrl.searchParams.get("timestamp") || "0";
  const widthParam = request.nextUrl.searchParams.get("width") || "1280";

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const timestamp = parseFloat(timestampParam);
  const width = parseInt(widthParam, 10);

  if (isNaN(timestamp) || timestamp < 0) {
    return NextResponse.json(
      { error: "Invalid timestamp" },
      { status: 400 }
    );
  }

  if (isNaN(width) || width < 100 || width > 3840) {
    return NextResponse.json(
      { error: "Width must be between 100 and 3840" },
      { status: 400 }
    );
  }

  try {
    ensureFramesDir();

    const hash = getFrameHash(url, timestamp, width);
    const framePath = join(FRAMES_DIR, `${hash}.jpg`);

    // Check cache first
    if (existsSync(framePath)) {
      const imageBuffer = readFileSync(framePath);
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=3600",
          "X-Frame-Timestamp": timestamp.toString(),
          "X-Frame-Width": width.toString(),
        },
      });
    }

    // Generate frame using FFmpeg
    // -ss: seek to position (before input for faster seeking)
    // -i: input URL
    // -vframes 1: extract only 1 frame
    // -q:v 2: JPEG quality (2-5 is good, lower is better quality)
    // -vf scale: resize to specified width, maintaining aspect ratio
    const timeFormatted = formatTimestamp(timestamp);
    const ffmpegCommand = `ffmpeg -ss ${timeFormatted} -i "${url}" -vframes 1 -q:v 2 -vf "scale=${width}:-1" -f image2 "${framePath}" -y 2>/dev/null`;

    try {
      execSync(ffmpegCommand, { timeout: 30000 });
    } catch {
      return NextResponse.json(
        { error: "Failed to extract frame" },
        { status: 500 }
      );
    }

    // Verify the file was created
    if (!existsSync(framePath)) {
      return NextResponse.json(
        { error: "Frame extraction failed" },
        { status: 500 }
      );
    }

    const imageBuffer = readFileSync(framePath);
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        "X-Frame-Timestamp": timestamp.toString(),
        "X-Frame-Width": width.toString(),
      },
    });
  } catch (error) {
    console.error("Frame extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract frame" },
      { status: 500 }
    );
  }
}
