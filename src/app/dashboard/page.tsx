"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { MapperMap } from "@/components/map/mapper-map";
import { Mapper, MappingSession, NetworkStats } from "@/types/mapper";
import {
  Users,
  Radio,
  CheckCircle,
  Coins,
  MapPin,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { getAllMappers, getAllSessions, syncToServer } from "@/lib/storage";

import { UserNav } from "@/components/layout/user-nav";

export default function DashboardPage() {
  const router = useRouter();
  const [view, setView] = useState<"map" | "mappers">("map");
  const [mapView, setMapView] = useState<"live" | "all">("live");
  const [currentMapperId, setCurrentMapperId] = useState<string | null>(null);
  const [mappers, setMappers] = useState<Mapper[]>([]);
  const [sessions, setSessions] = useState<MappingSession[]>([]);
  const [allSessions, setAllSessions] = useState<MappingSession[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const loadDemoData = async () => {
    setIsLoadingDemo(true);
    try {
      const response = await fetch("/api/demo-data", { method: "POST" });
      if (response.ok) {
        await fetchData(); // Refresh data after loading demo
        alert("Demo data loaded! The dashboard now shows 5 active mappers with 3 live sessions.");
      } else {
        alert("Failed to load demo data");
      }
    } catch (error) {
      console.error("Demo data error:", error);
      alert("Error loading demo data");
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get local data first (instant)
      const localMappers = getAllMappers();
      const localSessions = getAllSessions();
      
      // Sync local data to server
      await syncToServer();
      
      // Fetch server data
      const [mappersRes, activeSessionsRes, allSessionsRes, statsRes] = await Promise.all([
        fetch("/api/mappers"), // Fetch all mappers
        fetch("/api/sessions?status=ACTIVE"), // Fetch only active sessions
        fetch("/api/sessions"), // Fetch all sessions
        fetch("/api/network-stats"),
      ]);

      const mappersData = await mappersRes.json();
      const activeSessionsData = await activeSessionsRes.json();
      const allSessionsData = await allSessionsRes.json();
      const statsData = await statsRes.json();

      // Merge local and server data (deduplicate by ID)
      const mergedMappers = [...localMappers];
      (mappersData.mappers || []).forEach((serverMapper: Mapper) => {
        if (!mergedMappers.find(m => m.id === serverMapper.id)) {
          mergedMappers.push(serverMapper);
        }
      });
      
      const mergedActiveSessions = [...localSessions.filter(s => s.status === "ACTIVE")];
      (activeSessionsData.sessions || []).forEach((serverSession: MappingSession) => {
        if (!mergedActiveSessions.find(s => s.id === serverSession.id)) {
          mergedActiveSessions.push(serverSession);
        }
      });
      
      const mergedAllSessions = [...localSessions];
      (allSessionsData.sessions || []).forEach((serverSession: MappingSession) => {
        if (!mergedAllSessions.find(s => s.id === serverSession.id)) {
          mergedAllSessions.push(serverSession);
        }
      });

      setMappers(mergedMappers);
      setSessions(mergedActiveSessions);
      setAllSessions(mergedAllSessions);
      setStats(statsData.stats || null);
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for mapper ID
    const id = localStorage.getItem("mapperId");
    setCurrentMapperId(id);
    
    const handleStorage = () => {
      setCurrentMapperId(localStorage.getItem("mapperId"));
    };
    
    window.addEventListener("storage", handleStorage);
    window.addEventListener("mapper-login", handleStorage);
    
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("mapper-login", handleStorage);
    };
  }, []);

  const liveMappers = mappers.filter((m) => m.isLive);
  const completedSessions = allSessions.filter((s) => s.status === "COMPLETED");
  
  // Choose which sessions to display on map based on view
  const displaySessions = mapView === "live" ? sessions : allSessions;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              <Link href="/">SAFETY<span className="text-orange-500">MAP</span></Link>
            </h1>
            <span className="text-sm text-muted-foreground">
              REAL-TIME NETWORK
            </span>
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
              onClick={loadDemoData}
              disabled={isLoadingDemo}
              className="hidden sm:flex"
            >
              {isLoadingDemo ? "Loading..." : "Load Demo Data"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/recordings")}
            >
              View Recordings
            </Button>
            {currentMapperId && (
              <Button
                onClick={() => router.push("/live-map")}
                className="bg-orange-500 hover:bg-orange-600"
              >
                START MAPPING
              </Button>
            )}
            <UserNav />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Network Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">MAPPERS</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.totalMappers.toLocaleString() || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">ACTIVE</span>
            </div>
            <div className="text-2xl font-bold text-green-500">
              {stats?.activeMappers || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">STREAMS</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.verifiedStreams || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">TOTAL PAID</span>
            </div>
            <div className="text-2xl font-bold">
              ₦{(stats?.totalPaid || 0).toLocaleString()}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">KM MAPPED</span>
            </div>
            <div className="text-2xl font-bold">
              {(stats?.totalDistance || 0).toFixed(1)}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">CONFIDENCE</span>
            </div>
            <div className="text-2xl font-bold">
              {(stats?.gridConfidence || 0).toFixed(1)}%
            </div>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={view === "map" ? "default" : "outline"}
            onClick={() => setView("map")}
            className={view === "map" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            MAP VIEW
          </Button>
          <Button
            variant={view === "mappers" ? "default" : "outline"}
            onClick={() => setView("mappers")}
            className={
              view === "mappers" ? "bg-orange-500 hover:bg-orange-600" : ""
            }
          >
            MAPPERS LIST
          </Button>
          
          {view === "map" && (
            <>
              <div className="w-px h-8 bg-border" />
              <Button
                variant={mapView === "live" ? "default" : "outline"}
                onClick={() => setMapView("live")}
                size="sm"
                className={mapView === "live" ? "bg-green-500 hover:bg-green-600" : ""}
              >
                Live Only ({sessions.length})
              </Button>
              <Button
                variant={mapView === "all" ? "default" : "outline"}
                onClick={() => setMapView("all")}
                size="sm"
                className={mapView === "all" ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                All Sessions ({allSessions.length})
              </Button>
            </>
          )}
        </div>

        {/* Content */}
        {view === "map" ? (
          <div>
            <Card className="p-4 mb-4">
              <h3 className="text-lg font-bold mb-2">
                {mapView === "live" ? "LIVE NETWORK ACTIVITY" : "ALL MAPPING SESSIONS"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mapView === "live" 
                  ? "Real-time view of active mappers across Lagos. Each marker represents a live video feed verifying road conditions and security nodes."
                  : `Showing ${displaySessions.length} total sessions including ${completedSessions.length} completed recordings. View all mapper routes and session data.`
                }
              </p>
            </Card>
            <div className="relative">
              <MapperMap
                mappers={mapView === "live" ? liveMappers : mappers}
                sessions={displaySessions}
                className="h-[600px] rounded-xl overflow-hidden"
              />
              
              {/* Map Legend */}
              <Card className="absolute bottom-4 left-4 p-3 bg-background/95 backdrop-blur z-10">
                <div className="text-xs font-bold mb-2">MAP LEGEND</div>
                <div className="space-y-1.5 text-xs">
                  {mapView === "live" ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white animate-pulse" />
                        <span>Live Mapper</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-orange-500" />
                        <span>Active Route</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white animate-pulse" />
                        <span>Live Mapper</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white" />
                        <span>Offline Mapper</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-orange-500" />
                        <span>Active Route</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-blue-500" />
                        <span>Completed Session</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
            
            {mapView === "all" && completedSessions.length > 0 && (
              <Card className="p-4 mt-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">
                      Showing {completedSessions.length} completed recording sessions
                    </p>
                    <p className="text-muted-foreground">
                      Routes in orange show historical mapping sessions. Click "View Recordings" to see session details and videos.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-bold mb-2">LIVE MODES</h3>
              <div className="space-y-3">
                {liveMappers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No mappers currently live
                  </p>
                ) : (
                  liveMappers.map((mapper) => {
                    const session = sessions.find(
                      (s) => s.mapperId === mapper.id && s.status === "ACTIVE"
                    );
                    return (
                      <Card key={mapper.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                              {mapper.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold">{mapper.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {mapper.vehicleType.replace(/_/g, " ")}
                              </div>
                            </div>
                          </div>
                          {session && (
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {session.distance.toFixed(2)} km
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {session.tokensEarned.toFixed(2)} tokens
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-bold mb-2">ALL MAPPERS</h3>
              <div className="space-y-2">
                {mappers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No mappers registered yet
                  </p>
                ) : (
                  mappers.map((mapper) => (
                    <div
                      key={mapper.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            mapper.isLive ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <div>
                          <div className="font-medium">{mapper.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {mapper.vehicleType.replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          ₦{mapper.totalEarnings.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mapper.totalDistance.toFixed(1)} km
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
