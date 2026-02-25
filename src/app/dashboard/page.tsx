"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { MapperMap, MapperMapRef } from "@/components/map/mapper-map";
import { Mapper, MappingSession, NetworkStats } from "@/types/mapper";
import {
  Users,
  Radio,
  CheckCircle,
  Coins,
  MapPin,
  TrendingUp,

  RefreshCw,
  AlertTriangle,
  Siren,
  Construction,
  Car,
} from "lucide-react";
import { getAllMappers, getAllSessions } from "@/lib/storage";
import { MapEvent } from "@/types/mapper";

import { UserNav } from "@/components/layout/user-nav";

export default function DashboardPage() {
  const router = useRouter();
  const mapRef = useRef<MapperMapRef>(null);
  const eventFeedRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"map" | "mappers" | "events">("map");
  const [mapView, setMapView] = useState<"live" | "all">("live");
  const [currentMapperId, setCurrentMapperId] = useState<string | null>(null);
  const [mappers, setMappers] = useState<Mapper[]>([]);
  const [sessions, setSessions] = useState<MappingSession[]>([]);
  const [allSessions, setAllSessions] = useState<MappingSession[]>([]);
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);


  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch server data
      const [mappersRes, activeSessionsRes, allSessionsRes, statsRes] = await Promise.all([
        fetch("/api/mappers"), // Fetch all mappers
        fetch("/api/sessions?status=ACTIVE"), // Fetch only active sessions
        fetch("/api/sessions"), // Fetch all sessions
        fetch("/api/network-stats"),
      ]);

      const mappersData = mappersRes.ok ? await mappersRes.json() : { mappers: [] };
      const activeSessionsData = activeSessionsRes.ok ? await activeSessionsRes.json() : { sessions: [] };
      const allSessionsData = allSessionsRes.ok ? await allSessionsRes.json() : { sessions: [] };
      const statsData = statsRes.ok ? await statsRes.json() : { stats: null };

      setMappers(mappersData.mappers || []);
      setSessions(activeSessionsData.sessions || []);
      setAllSessions(allSessionsData.sessions || []);
      setStats(statsData.stats || null);
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events/active");
      if (response.ok) {
        const data = await response.json();
        const mapped: MapEvent[] = (data.events || []).map((e: any) => ({
          id: e.id || e._id,
          type: e.category || e.type,
          category: e.category,
          customCategory: e.customCategory,
          title: e.title,
          location: e.location,
          description: e.description || "",
          timestamp: e.createdAt || e.timestamp,
          reporterName: e.reporterName,
          severity: e.severity || "MEDIUM",
          verified: e.verified ?? false,
          videoUrl: e.videoUrl,
          media: e.media || [],
        }));
        setEvents(mapped);
      }
    } catch (error) {
      console.error("Events fetch error:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

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

  // Filter events for map (only show last 24h)
  const mapEvents = events.filter(event => {
    const eventTime = new Date(event.timestamp).getTime();
    const now = new Date().getTime();
    return (now - eventTime) < (24 * 60 * 60 * 1000);
  });

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
              onClick={() => router.push("/recordings")}
            >
              View Recordings
            </Button>
            {currentMapperId && (
              <Button
                onClick={() => router.push("/live-map")}
                className="bg-orange-500 hover:bg-orange-600"
              >
                REPORT EVENT
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
            variant={view === "events" ? "default" : "outline"}
            onClick={() => {
              setView("events");
              setTimeout(() => {
                eventFeedRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            className={view === "events" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            RECENT EVENTS
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
        {view === "map" || view === "events" ? (
          <div>
            <Card className="p-4 mb-4">
              <h3 className="text-lg font-bold">
                {view === "events" 
                  ? "RECENT SAFETY EVENTS"
                  : mapView === "live" ? "LIVE NETWORK ACTIVITY" : "ALL MAPPING SESSIONS"
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {view === "events"
                  ? "Real-time safety alerts and incidents reported by mappers and verified sources."
                  : mapView === "live" 
                    ? "Real-time view of active mappers across Lagos. Each marker represents a live video feed verifying road conditions and security nodes."
                    : `Showing ${displaySessions.length} total sessions including ${completedSessions.length} completed recordings. View all mapper routes and session data.`
                }
              </p>
            </Card>
            <div className="relative">
              <MapperMap
                ref={mapRef}
                mappers={mapView === "live" ? liveMappers : mappers}
                sessions={view === "events" ? [] : displaySessions}
                events={mapEvents}
                className="h-[600px] rounded-xl overflow-hidden"
              />
              
              {/* Map Legend */}
              <Card className="absolute bottom-4 left-4 p-3 bg-background/95 backdrop-blur z-10 w-44">
                <div className="text-xs font-bold mb-2">MAP LEGEND</div>
                <div className="space-y-2 text-[10px]">
                  {/* Mappers Section */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white animate-pulse" />
                      <span className="font-medium">Live Mapper</span>
                    </div>
                    {mapView === "all" && (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400 border border-white" />
                        <span>Offline Mapper</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-orange-500" />
                      <span>{mapView === "live" ? "Live" : "Active"} Route</span>
                    </div>
                    {mapView === "all" && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-0.5 bg-blue-500" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-1.5 mt-1.5">
                    <div className="font-bold text-[9px] mb-1 opacity-70">SAFETY EVENTS</div>
                    <div className="grid grid-cols-1 gap-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white flex items-center justify-center text-[7px] text-white">⚠️</div>
                        <span>Critical/Accident</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[7px] text-white">🚦</div>
                        <span>Traffic/Hazard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white flex items-center justify-center text-[7px] text-white">👮</div>
                        <span>Police</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            {view === "events" && (
              <Card className="p-4 mt-4" ref={eventFeedRef}>
                <h3 className="text-lg font-bold mb-4">EVENT FEED</h3>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div 
                      key={event.id} 
                      className="flex items-start gap-4 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        // Small delay to allow scroll to start before map movement
                        setTimeout(() => {
                          mapRef.current?.flyToEvent(event.location);
                        }, 100);
                      }}
                    >
                      <div className={`p-2 rounded-full shrink-0 ${
                        event.type === 'ACCIDENT' || event.type === 'SOS' || event.type === 'FIRE' ? 'bg-red-100 text-red-600' :
                        event.type === 'TRAFFIC' || event.type === 'HAZARD' || event.type === 'RAIN' ? 'bg-amber-100 text-amber-600' :
                        event.type === 'POLICE' || event.type === 'FLOOD' ? 'bg-blue-100 text-blue-600' :
                        event.type === 'PROTEST' ? 'bg-purple-100 text-purple-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {event.type === 'ACCIDENT' && <Siren className="w-5 h-5" />}
                        {event.type === 'TRAFFIC' && <Car className="w-5 h-5" />}
                        {event.type === 'POLICE' && <AlertTriangle className="w-5 h-5" />}
                        {event.type === 'HAZARD' && <AlertTriangle className="w-5 h-5" />}
                        {event.type === 'ROAD_WORK' && <Construction className="w-5 h-5" />}
                        {event.type === 'SOS' && <Siren className="w-5 h-5" />}
                        {event.type === 'FLOOD' && <AlertTriangle className="w-5 h-5" />}
                        {event.type === 'RAIN' && <AlertTriangle className="w-5 h-5" />}
                        {event.type === 'FIRE' && <AlertTriangle className="w-5 h-5" />}
                        {event.type === 'PROTEST' && <AlertTriangle className="w-5 h-5" />}
                        {event.type === 'OTHER' && <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold">{event.type === 'OTHER' && event.customCategory ? event.customCategory : event.type.replace(/_/g, " ")}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            event.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                            event.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                            event.severity === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {event.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="flex items-center gap-1">
                            {event.verified ? (
                              <span className="text-green-600 font-medium">Verified Source</span>
                            ) : (
                              <span className="text-yellow-600">Unverified</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {view === "map" && mapView === "all" && completedSessions.length > 0 && (
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
