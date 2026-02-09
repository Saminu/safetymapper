"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MappingSession, Mapper } from "@/types/mapper";
import {
  Play,
  MapPin,
  Clock,
  Coins,
  User,
  Calendar,
  TrendingUp,
  Video,
  RefreshCw,
} from "lucide-react";
import { getAllMappers, getAllSessions, syncToServer } from "@/lib/storage";

export default function RecordingsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<MappingSession[]>([]);
  const [mappers, setMappers] = useState<Map<string, Mapper>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<MappingSession | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get local data first
      const localMappers = getAllMappers();
      const localSessions = getAllSessions();
      
      // Sync to server
      await syncToServer();
      
      // Fetch server data
      const [sessionsRes, mappersRes] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/mappers"),
      ]);

      const sessionsData = await sessionsRes.json();
      const mappersData = await mappersRes.json();

      // Merge local and server data
      const mergedMappers = [...localMappers];
      (mappersData.mappers || []).forEach((serverMapper: Mapper) => {
        if (!mergedMappers.find(m => m.id === serverMapper.id)) {
          mergedMappers.push(serverMapper);
        }
      });
      
      const mergedSessions = [...localSessions];
      (sessionsData.sessions || []).forEach((serverSession: MappingSession) => {
        if (!mergedSessions.find(s => s.id === serverSession.id)) {
          mergedSessions.push(serverSession);
        }
      });

      // Create mapper lookup map
      const mapperMap = new Map<string, Mapper>();
      mergedMappers.forEach((m: Mapper) => {
        mapperMap.set(m.id, m);
      });

      setMappers(mapperMap);
      setSessions(mergedSessions);
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handlePlayVideo = (session: MappingSession) => {
    setSelectedSession(session);
  };

  const closeVideoPlayer = () => {
    setSelectedSession(null);
  };

  const completedSessions = sessions.filter((s) => s.status === "COMPLETED");
  const sessionsWithVideo = completedSessions.filter((s) => s.videoUrl);
  
  // Show all completed sessions, not just those with videos
  const displaySessions = completedSessions;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              SAFETY<span className="text-orange-500">MAP</span>
            </h1>
            <span className="text-sm text-muted-foreground">RECORDINGS</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">RECORDINGS</span>
            </div>
            <div className="text-2xl font-bold">{sessionsWithVideo.length}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">TOTAL TIME</span>
            </div>
            <div className="text-2xl font-bold">
              {formatDuration(
                completedSessions.reduce((sum, s) => sum + s.duration, 0)
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">DISTANCE</span>
            </div>
            <div className="text-2xl font-bold">
              {completedSessions
                .reduce((sum, s) => sum + s.distance, 0)
                .toFixed(1)}{" "}
              km
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">TOKENS EARNED</span>
            </div>
            <div className="text-2xl font-bold">
              {completedSessions
                .reduce((sum, s) => sum + s.tokensEarned, 0)
                .toFixed(0)}
            </div>
          </Card>
        </div>

        {/* Recordings List */}
        <h2 className="text-xl font-bold mb-4">All Recordings</h2>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading recordings...</p>
          </div>
        ) : displaySessions.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-bold mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start mapping to create your first session
            </p>
            <Button
              onClick={() => router.push("/live-map")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Start Mapping
            </Button>
          </Card>
        ) : (
          <>
            {sessionsWithVideo.length === 0 && displaySessions.length > 0 && (
              <Card className="p-6 mb-4 bg-orange-500/10 border-orange-500/20 col-span-full">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Videos Not Available</p>
                    <p className="text-muted-foreground">
                      Videos cannot be stored on Vercel's serverless platform. Your sessions were recorded but videos aren't persisted. 
                      For production with video storage, integrate cloud storage like AWS S3 or Cloudflare R2.
                    </p>
                  </div>
                </div>
              </Card>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displaySessions.map((session) => {
              const mapper = mappers.get(session.mapperId);
              const hasVideo = Boolean(session.videoUrl);

              return (
                <Card key={session.id} className="overflow-hidden">
                  {/* Video Thumbnail / Placeholder */}
                  <div className="relative aspect-video bg-zinc-900 flex items-center justify-center">
                    {hasVideo ? (
                      <>
                        <Video className="w-12 h-12 text-white/50" />
                        <Button
                          onClick={() => handlePlayVideo(session)}
                          size="icon"
                          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600"
                        >
                          <Play className="w-8 h-8" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Video className="w-12 h-12 text-white/30 mx-auto mb-2" />
                        <p className="text-xs text-white/50">No video available</p>
                      </div>
                    )}
                  </div>

                  {/* Session Info */}
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold">
                          {mapper?.name || "Unknown Mapper"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mapper?.vehicleType.replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(session.startTime)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(session.duration)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{session.distance.toFixed(2)} km</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Coins className="w-4 h-4 text-orange-500" />
                        <span className="font-bold text-orange-500">
                          {session.tokensEarned.toFixed(2)} tokens
                        </span>
                      </div>
                    </div>

                    {hasVideo ? (
                      <Button
                        onClick={() => handlePlayVideo(session)}
                        className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Watch Recording
                      </Button>
                    ) : (
                      <div className="mt-4 p-3 bg-muted rounded text-center text-xs text-muted-foreground">
                        Session recorded • Video not available
                      </div>
                    )}
                  </div>
                </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeVideoPlayer}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={closeVideoPlayer}
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/10"
            >
              ✕
            </Button>

            <Card className="overflow-hidden">
              {selectedSession.videoUrl ? (
                <video
                  src={selectedSession.videoUrl}
                  controls
                  autoPlay
                  className="w-full aspect-video bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                  <p className="text-white">Video not available</p>
                </div>
              )}

              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">
                  {mappers.get(selectedSession.mapperId)?.name || "Unknown Mapper"}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Date</div>
                    <div className="font-medium">
                      {formatDate(selectedSession.startTime)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Duration</div>
                    <div className="font-medium">
                      {formatDuration(selectedSession.duration)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Distance</div>
                    <div className="font-medium">
                      {selectedSession.distance.toFixed(2)} km
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
