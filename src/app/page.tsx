"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapperMap } from "@/components/map/mapper-map";
import { Mapper, MappingSession, NetworkStats } from "@/types/mapper";
import {
  Users,
  Radio,
  MapPin,
  Coins,
  TrendingUp,
  Video,
  Shield,
  Smartphone,
  Wallet,
  ArrowRight,
} from "lucide-react";

function HomeContent() {
  const router = useRouter();

  const [mappers, setMappers] = useState<Mapper[]>([]);
  const [sessions, setSessions] = useState<MappingSession[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mappersRes, sessionsRes, statsRes] = await Promise.all([
          fetch("/api/mappers?isLive=true"),
          fetch("/api/sessions?status=ACTIVE"),
          fetch("/api/network-stats"),
        ]);

        const mappersData = await mappersRes.json();
        const sessionsData = await sessionsRes.json();
        const statsData = await statsRes.json();

        setMappers(mappersData.mappers || []);
        setSessions(sessionsData.sessions || []);
        setStats(statsData.stats || null);
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-screen">
        {/* Background Map */}
        <div className="absolute inset-0 opacity-40">
          {!isLoading && (
            <MapperMap
              mappers={mappers}
              sessions={sessions}
              className="h-full"
            />
          )}
        </div>

        {/* Overlay Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">
                SAFETY<span className="text-orange-500">MAP</span>
              </h1>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  EXPLORE GRID
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/recordings")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  VIEW RECORDINGS
                </Button>
                <Button
                  onClick={() => router.push("/onboarding")}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  START MAPPING
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl">
                <h2 className="text-6xl font-bold text-white mb-6">
                  POWER THE <span className="text-orange-500">SAFETY MAP.</span>
                </h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl">
                  Lagos streets move fast. Provide the live data the network needs to
                  navigate safely. Mount your device, map your route, and monetize
                  your movement.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Button
                    size="lg"
                    onClick={() => router.push("/onboarding")}
                    className="bg-orange-500 hover:bg-orange-600 text-lg h-14 px-8"
                  >
                    BECOME A MAPPER
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="border-white/20 text-white hover:bg-white/10 text-lg h-14 px-8"
                  >
                    VIEW MAPPER GRID
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/recordings")}
                    className="border-white/20 text-white hover:bg-white/10 text-lg h-14 px-8"
                  >
                    VIEW RECORDINGS
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="container mx-auto px-4 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-black/60 backdrop-blur border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  <span className="text-xs text-white/60">MAPPERS</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {stats?.totalMappers.toLocaleString() || 0}
                </div>
              </Card>

              <Card className="p-4 bg-black/60 backdrop-blur border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <span className="text-xs text-white/60">KM MAPPED</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {(stats?.totalDistance || 0).toFixed(1)}K
                </div>
              </Card>

              <Card className="p-4 bg-black/60 backdrop-blur border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-orange-500" />
                  <span className="text-xs text-white/60">TOTAL PAID</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  ₦{((stats?.totalPaid || 0) / 1000).toFixed(0)}K
                </div>
              </Card>

              <Card className="p-4 bg-black/60 backdrop-blur border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="text-xs text-white/60">CONFIDENCE</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {(stats?.gridConfidence || 0).toFixed(1)}%
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Proof Section */}
      <div className="bg-gradient-to-b from-black to-zinc-900 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <span className="text-orange-500 font-medium">
              ← MAPPER ONBOARDING OPS — BATCH 6
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="mb-8">
                <span className="text-orange-500 font-medium text-sm">
                  VISUAL DATA PROOF
                </span>
                <h2 className="text-5xl font-bold text-white mt-4 mb-6">
                  MAPPING SAFETY
                  <br />
                  THROUGH <span className="text-orange-500">YOUR LENS.</span>
                </h2>
                <p className="text-white/70 text-lg">
                  As a <span className="font-bold text-white">Safety Mapper</span>, you are not just a driver; you are a mobile sensor.
                  Our network relies on your live camera feed to verify road conditions
                  and security nodes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6 bg-zinc-800 border-zinc-700">
                  <Video className="w-10 h-10 text-orange-500 mb-4" />
                  <h3 className="font-bold text-white mb-2">Video Verification</h3>
                  <p className="text-sm text-white/60">
                    Provide video footage of security checkpoints to enhance team
                    visibility and reaction beam.
                  </p>
                </Card>

                <Card className="p-6 bg-zinc-800 border-zinc-700">
                  <Shield className="w-10 h-10 text-orange-500 mb-4" />
                  <h3 className="font-bold text-white mb-2">Grid Sync</h3>
                  <p className="text-sm text-white/60">
                    Your data shows the network to predict and avoid high-risk traffic
                    zones.
                  </p>
                </Card>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Card className="p-3 bg-black/70 backdrop-blur border-white/10">
                    <div className="flex items-center justify-between text-white text-sm">
                      <div>
                        <div className="font-bold">Map Fragment +98.0</div>
                        <div className="text-xs text-white/60">Grid Sync: 18.5 BRT</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">Verified</div>
                        <div className="text-xs text-white/60">Session #42.8K</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Map Section */}
      <div className="bg-zinc-900 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            HOW TO <span className="text-orange-500">MAP.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 bg-zinc-800 border-zinc-700 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-6xl font-bold text-white/10 mb-4">01</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Mount & Calibrate
              </h3>
              <p className="text-white/60">
                Secure your smartphone using a standard handlebar mount. Ensure the
                camera has a clear view of the road ahead. Our app will auto-calibrate
                the horizon for optimal mapping precision.
              </p>
            </Card>

            <Card className="p-8 bg-zinc-800 border-zinc-700 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
                <Radio className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-6xl font-bold text-white/10 mb-4">02</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Activate Live Map
              </h3>
              <p className="text-white/60">
                Open the Safety Map app and tap "GO LIVE". Your phone becomes an
                active node, streaming low-latency video and telemetry to our central
                grid.
              </p>
            </Card>

            <Card className="p-8 bg-zinc-800 border-zinc-700 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-6xl font-bold text-white/10 mb-4">03</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Map & Withdraw
              </h3>
              <p className="text-white/60">
                Tokens accumulate in real-time as you ride. Map 'Blind Spots' for
                massive multipliers. Cash out anytime to your bank account.
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => router.push("/onboarding")}
              className="bg-orange-500 hover:bg-orange-600 text-lg h-14 px-8"
            >
              START MAPPING NOW <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-black py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to power the Safety Map?
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Join thousands of mappers across Lagos earning tokens while making the
            streets safer. Download the app and start mapping today.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/onboarding")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              BECOME A MAPPER
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="border-white/20 text-white hover:bg-white/10"
            >
              VIEW MAPPER GRID
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
