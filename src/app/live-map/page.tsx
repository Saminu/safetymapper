"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Video,
  VideoOff,
  Navigation,
  Play,
  Pause,
  Square,
  Clock,
  MapPin,
  TrendingUp,
  Coins,
  Settings,
  Info,
  CheckCircle,
} from "lucide-react";
import { SessionStatus, MappingSession } from "@/types/mapper";
import { saveSession, saveMapper, getMapper, syncToServer } from "@/lib/storage";

export default function LiveMapPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [mapperId, setMapperId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("COMPLETED");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load mapper ID from localStorage
  useEffect(() => {
    const id = localStorage.getItem("mapperId");
    if (!id) {
      router.push("/onboarding");
    } else {
      setMapperId(id);
    }
  }, [router]);

  // Initialize camera and geolocation
  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Camera access error:", error);
        alert("Unable to access camera. Please grant camera permissions.");
      }
    };

    const initLocation = () => {
      if ("geolocation" in navigator) {
        // Get initial location and start watching
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            };
            setLocation(newLocation);
            setSpeed(position.coords.speed ? position.coords.speed * 3.6 : 0);
          },
          (error) => {
            console.error("Initial location error:", error);
            alert("Unable to get GPS location. Please make sure location services are enabled and you're outdoors.");
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
          }
        );

        // Also start watching for updates
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            };
            const currentSpeed = position.coords.speed ? position.coords.speed * 3.6 : 0;
            setLocation(newLocation);
            setSpeed(currentSpeed);
          },
          (error) => {
            console.error("Location watch error:", error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000,
          }
        );
      } else {
        alert("Geolocation is not supported by your device.");
      }
    };

    initCamera();
    initLocation();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Send location updates to server and localStorage when session is active
  useEffect(() => {
    if (sessionId && status === "ACTIVE" && location) {
      const updateLocation = async () => {
        // Update server
        await fetch(`/api/sessions/${sessionId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location,
            speed,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
        
        // Update localStorage
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (response.ok) {
          const { session } = await response.json();
          saveSession(session);
          
          // Also update mapper location
          if (mapperId) {
            const mapper = getMapper(mapperId);
            if (mapper) {
              mapper.currentLocation = location;
              saveMapper(mapper);
            }
          }
          
          // Sync to server periodically
          if (Math.random() < 0.2) { // 20% chance to sync (don't spam)
            syncToServer();
          }
        }
      };

      updateLocation(); // Send initial update
      const updateInterval = setInterval(updateLocation, 5000); // Update every 5 seconds

      return () => clearInterval(updateInterval);
    }
  }, [sessionId, status, location, speed, mapperId]);

  const startSession = async () => {
    if (!mapperId || !location) {
      alert("Please wait for GPS location to be acquired.");
      return;
    }

    setIsCalibrating(true);
    
    // Simulate calibration
    setTimeout(async () => {
      setIsCalibrating(false);
      
      try {
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mapperId,
            startLocation: location,
          }),
        });

        if (!response.ok) throw new Error("Failed to start session");

        const { session } = await response.json();
        setSessionId(session.id);
        setStatus("ACTIVE");
        
        // Save session to localStorage
        saveSession(session);
        
        // Update mapper status to live
        const mapper = getMapper(mapperId);
        if (mapper) {
          mapper.isLive = true;
          mapper.currentLocation = location;
          saveMapper(mapper);
        }
        
        // Sync to server
        syncToServer();

        // Start recording
        if (stream && mediaRecorderRef.current === null) {
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm;codecs=vp8,opus",
          });

          const chunks: BlobPart[] = [];
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            console.log(`Video recorded: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
            
            // Upload video to server
            const formData = new FormData();
            formData.append("video", blob, `session-${session.id}.webm`);
            formData.append("sessionId", session.id);

            try {
              const uploadRes = await fetch("/api/sessions/upload", {
                method: "POST",
                body: formData,
              });
              
              const uploadData = await uploadRes.json();
              console.log("Video upload response:", uploadData);
              
              if (uploadRes.ok) {
                console.log("✅ Video recorded successfully");
              } else {
                console.warn("⚠️ Video upload failed:", uploadData.error);
              }
            } catch (error) {
              console.error("❌ Video upload error:", error);
            }
          };

          mediaRecorder.start(1000); // Capture in 1-second chunks
          mediaRecorderRef.current = mediaRecorder;
        }

        // Start duration counter
        intervalRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
          // Simulate token accumulation (adjust rate as needed)
          setTokensEarned((prev) => prev + 0.5);
          // Simulate distance accumulation based on speed
          setDistance((prev) => prev + speed / 3600); // Convert km/h to km per second
        }, 1000);
      } catch (error) {
        console.error("Session start error:", error);
        alert("Failed to start mapping session.");
      }
    }, 2000);
  };

  const pauseSession = async () => {
    setStatus("PAUSED");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeSession = async () => {
    setStatus("ACTIVE");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
    }
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
        setTokensEarned((prev) => prev + 0.5);
        setDistance((prev) => prev + speed / 3600);
      }, 1000);
    }
  };

  const endSession = async () => {
    if (sessionId) {
      setStatus("COMPLETED");
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETED",
            distance,
            duration,
            tokensEarned,
            endTime: new Date().toISOString(),
          }),
        });

        const { session: updatedSession } = await response.json();
        
        // Save completed session to localStorage
        saveSession(updatedSession);
        
        // Update mapper stats
        if (mapperId) {
          const mapper = getMapper(mapperId);
          if (mapper) {
            mapper.isLive = false;
            mapper.totalEarnings += tokensEarned;
            mapper.totalDistance += distance;
            mapper.totalDuration += duration;
            saveMapper(mapper);
          }
        }
        
        // Sync to server immediately
        await syncToServer();

        alert(`Session completed! You earned ${tokensEarned.toFixed(2)} tokens. Check the dashboard to see your route!`);
        
        // Reset state
        setSessionId(null);
        setDuration(0);
        setDistance(0);
        setTokensEarned(0);
      } catch (error) {
        console.error("Session end error:", error);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Video Preview */}
      <div className="relative w-full h-[60vh]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Calibration Overlay */}
        {isCalibrating && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Card className="p-6 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Calibrating horizon...</p>
              <p className="text-sm text-muted-foreground">Please hold steady</p>
            </Card>
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-4 left-4 flex gap-2">
          {status === "ACTIVE" && (
            <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">LIVE</span>
            </div>
          )}
          {status === "PAUSED" && (
            <div className="bg-yellow-500 text-black px-3 py-1 rounded-full">
              <span className="text-sm font-medium">PAUSED</span>
            </div>
          )}
        </div>

        {/* Location & Speed */}
        {location && (
          <div className="absolute top-4 right-4 space-y-2">
            <Card className="p-2 bg-black/70 backdrop-blur">
              <div className="flex items-center gap-2 text-white">
                <Navigation className="w-4 h-4" />
                <span className="text-sm font-mono">
                  {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                </span>
              </div>
            </Card>
            <Card className="p-2 bg-black/70 backdrop-blur">
              <div className="flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-mono">{speed.toFixed(1)} km/h</span>
              </div>
            </Card>
          </div>
        )}

        {/* Grid Overlay (Visual indicator) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-1/2 h-px bg-orange-500/30" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-orange-500/30" />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-b from-background to-muted p-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{formatDuration(duration)}</div>
              <div className="text-xs text-muted-foreground">DURATION</div>
            </Card>
            <Card className="p-4 text-center">
              <MapPin className="w-5 h-5 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{distance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">KM MAPPED</div>
            </Card>
            <Card className="p-4 text-center">
              <Coins className="w-5 h-5 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{tokensEarned.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">TOKENS</div>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {status === "COMPLETED" && (
              <Button
                onClick={startSession}
                disabled={!location}
                className="flex-1 bg-orange-500 hover:bg-orange-600 h-14 text-lg"
              >
                <Play className="w-6 h-6 mr-2" />
                GO LIVE
              </Button>
            )}

            {status === "ACTIVE" && (
              <>
                <Button
                  onClick={pauseSession}
                  variant="outline"
                  className="flex-1 h-14"
                >
                  <Pause className="w-6 h-6 mr-2" />
                  PAUSE
                </Button>
                <Button
                  onClick={endSession}
                  className="flex-1 bg-red-500 hover:bg-red-600 h-14"
                >
                  <Square className="w-6 h-6 mr-2" />
                  END SESSION
                </Button>
              </>
            )}

            {status === "PAUSED" && (
              <>
                <Button
                  onClick={resumeSession}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 h-14"
                >
                  <Play className="w-6 h-6 mr-2" />
                  RESUME
                </Button>
                <Button
                  onClick={endSession}
                  variant="outline"
                  className="flex-1 h-14"
                >
                  <Square className="w-6 h-6 mr-2" />
                  END
                </Button>
              </>
            )}
          </div>

          {/* Info Banner */}
          {status === "COMPLETED" && !location && (
            <Card className="mt-4 p-4 bg-orange-500/10 border-orange-500/20">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Acquiring GPS location...</p>
                  <p className="text-muted-foreground">
                    Make sure you're outdoors with a clear view of the sky for best results.
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          {status === "COMPLETED" && location && (
            <Card className="mt-4 p-4 bg-green-500/10 border-green-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1 text-green-600">GPS Ready!</p>
                  <p className="text-muted-foreground">
                    Location locked. You can now start mapping.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Tips */}
          {status === "ACTIVE" && (
            <Card className="mt-4 p-4 bg-orange-500/10 border-orange-500/20">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Maximize your earnings!</p>
                  <p className="text-muted-foreground">
                    Map unmapped areas (Blind Spots) for 10x multipliers. Keep your camera stable and pointed forward.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
