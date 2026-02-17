import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { sessions } from "../route";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const video = formData.get("video") as File;
    const sessionId = formData.get("sessionId") as string;

    console.log("Video upload attempt:", { sessionId, videoSize: video?.size });

    if (!video || !sessionId) {
      return NextResponse.json(
        { error: "Missing video or session ID" },
        { status: 400 }
      );
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // NOTE: Vercel serverless functions have read-only filesystem
    // Videos cannot be saved permanently to /public
    // For production, use cloud storage (S3, R2, etc.)
    
    // For now, just mark the session as having a video recorded
    // In production, you would upload to S3/R2 here
    const filename = `${sessionId}.webm`;
    
    // Simulate successful upload for demo purposes
    // In production: const uploadUrl = await uploadToS3(video, filename);
    session.videoUrl = `/uploads/sessions/${filename}`;
    session.thumbnailUrl = `/api/thumbnail?session=${sessionId}`;
    sessions.set(sessionId, session);

    console.log("Video recorded (not persisted):", {
      sessionId,
      size: video.size,
      type: video.type,
    });

    return NextResponse.json({
      success: true,
      videoUrl: session.videoUrl,
      message: "Video recorded. Note: Videos are not persisted on Vercel's free tier. Use cloud storage for production.",
    });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
