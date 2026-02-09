"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Coins,
  TrendingUp,
  ArrowDownToLine,
  Clock,
  MapPin,
  CheckCircle,
  History,
} from "lucide-react";
import { Mapper, MappingSession, RewardTransaction } from "@/types/mapper";

export default function RewardsPage() {
  const router = useRouter();
  const [mapperId, setMapperId] = useState<string | null>(null);
  const [mapper, setMapper] = useState<Mapper | null>(null);
  const [sessions, setSessions] = useState<MappingSession[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("mapperId");
    if (!id) {
      router.push("/onboarding");
    } else {
      setMapperId(id);
      fetchMapperData(id);
    }
  }, [router]);

  const fetchMapperData = async (id: string) => {
    try {
      const [mapperRes, sessionsRes] = await Promise.all([
        fetch(`/api/mappers?id=${id}`),
        fetch(`/api/sessions?mapperId=${id}`),
      ]);

      const mapperData = await mapperRes.json();
      const sessionsData = await sessionsRes.json();

      // Find the specific mapper
      const mapperInfo = mapperData.mappers?.find((m: Mapper) => m.id === id);
      setMapper(mapperInfo || null);
      setSessions(sessionsData.sessions || []);
    } catch (error) {
      console.error("Data fetch error:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!mapperId || !mapper) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const totalTokens = sessions.reduce((sum, s) => sum + s.tokensEarned, 0);
    if (amount > totalTokens) {
      alert("Insufficient token balance");
      return;
    }

    if (!bankAccount) {
      alert("Please enter your bank account number");
      return;
    }

    setIsWithdrawing(true);

    try {
      const response = await fetch("/api/rewards/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapperId,
          amount,
          bankAccount,
        }),
      });

      if (!response.ok) throw new Error("Withdrawal failed");

      alert(`Withdrawal of ${amount} tokens (₦${(amount * 100).toFixed(2)}) initiated successfully!`);
      setShowWithdrawForm(false);
      setWithdrawAmount("");
      setBankAccount("");
      
      // Refresh data
      if (mapperId) {
        fetchMapperData(mapperId);
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Withdrawal failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const totalTokens = sessions.reduce((sum, s) => sum + s.tokensEarned, 0);
  const totalNGN = totalTokens * 100; // 1 token = 100 NGN
  const totalDistance = sessions.reduce((sum, s) => sum + s.distance, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const completedSessions = sessions.filter((s) => s.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">
            Your <span className="text-orange-500">Rewards</span>
          </h1>
          {mapper && (
            <p className="text-muted-foreground mt-2">
              Welcome back, {mapper.name}
            </p>
          )}
        </div>

        {/* Balance Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-6 h-6" />
              <span className="text-sm font-medium">TOKEN BALANCE</span>
            </div>
            <div className="text-5xl font-bold mb-2">
              {totalTokens.toFixed(2)}
            </div>
            <div className="text-lg opacity-90">
              ≈ ₦{totalNGN.toFixed(2)}
            </div>
            <Button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              className="mt-4 bg-white text-orange-500 hover:bg-gray-100"
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              WITHDRAW
            </Button>
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    SESSIONS COMPLETED
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {completedSessions.length}
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">
                    TOTAL DISTANCE
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {totalDistance.toFixed(1)} km
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">
                    TOTAL TIME
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                </span>
              </div>
            </Card>
          </div>
        </div>

        {/* Withdraw Form */}
        {showWithdrawForm && (
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Withdraw Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Amount (Tokens)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  max={totalTokens}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {totalTokens.toFixed(2)} tokens (₦
                  {totalNGN.toFixed(2)})
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Bank Account Number
                </label>
                <Input
                  type="text"
                  placeholder="0123456789"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your Nigerian bank account number
                </p>
              </div>

              {withdrawAmount && (
                <Card className="p-4 bg-muted">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Tokens:</span>
                      <span className="font-medium">{withdrawAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="font-medium">1 token = ₦100</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span>You'll receive:</span>
                      <span className="text-orange-500">
                        ₦{(parseFloat(withdrawAmount || "0") * 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowWithdrawForm(false)}
                  disabled={isWithdrawing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || !bankAccount}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isWithdrawing ? "Processing..." : "CONFIRM WITHDRAWAL"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Earning Tips */}
        <Card className="p-6 mb-6 bg-orange-500/10 border-orange-500/20">
          <h3 className="text-lg font-bold mb-3">
            <TrendingUp className="inline w-5 h-5 mr-2 text-orange-500" />
            Maximize Your Earnings
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Blind Spots:</strong> Map unmapped areas for 10x token
                multipliers
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Peak Hours:</strong> Earn bonus tokens during rush hour
                (7-9 AM, 5-7 PM)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Quality Matters:</strong> Keep your camera stable and
                pointed forward
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>
                <strong>Consistency:</strong> Daily mappers earn loyalty bonuses
              </span>
            </li>
          </ul>
        </Card>

        {/* Session History */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">
            <History className="inline w-5 h-5 mr-2" />
            Session History
          </h3>
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sessions yet. Start mapping to earn tokens!
              </p>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {new Date(session.startTime).toLocaleDateString()}{" "}
                        {new Date(session.startTime).toLocaleTimeString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.distance.toFixed(2)} km • {session.duration} min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-500">
                        +{session.tokensEarned.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        tokens
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        session.status === "COMPLETED"
                          ? "bg-green-500/10 text-green-500"
                          : session.status === "ACTIVE"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
