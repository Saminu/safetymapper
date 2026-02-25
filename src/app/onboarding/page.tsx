"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { VehicleType, OnboardingData } from "@/types/mapper";
import { ArrowRight, CheckCircle2, MapPin, Smartphone, Wallet } from "lucide-react";
import { saveMapper } from "@/lib/storage";

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "TAXI_MAX_RIDES", label: "Taxi (Max Rides)" },
  { value: "OKADA_MOTORCYCLE", label: "Okada (Motorcycle)" },
  { value: "DANFO_BUS", label: "Danfo Bus" },
  { value: "BOLT_UBER", label: "Bolt/Uber" },
  { value: "KEKE_NAPEP", label: "Keke Napep" },
  { value: "BOX_TRUCK", label: "Box Truck" },
  { value: "PRIVATE_CAR", label: "Private Car" },
  { value: "OTHER", label: "Other" },
];

const ONBOARDING_STEPS = [
  {
    icon: Smartphone,
    title: "Mount & Calibrate",
    description: "Secure your smartphone using a standard handlebar mount. Ensure the camera has a clear view of the road ahead. Our app will auto-calibrate the horizon for optimal mapping precision.",
  },
  {
    icon: MapPin,
    title: "Activate Live Map",
    description: 'Open the Safety Map app and tap "GO LIVE". Your phone becomes an active node, streaming low-latency video and telemetry to our central grid.',
  },
  {
    icon: Wallet,
    title: "Map & Withdraw",
    description: "Tokens accumulate in real-time as you ride. Map 'Blind Spots' for massive multipliers. Cash out anytime to your bank account.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "form">("intro");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    phone: "",
    email: "",
    vehicleType: "TAXI_MAX_RIDES",
    vehicleNumber: "",
    agreedToTerms: false,
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/mapper/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to register");

      const { mapper, accessToken } = await response.json();
      
      // Store mapper ID and token in localStorage
      localStorage.setItem("mapperId", mapper.id);
      localStorage.setItem("accessToken", accessToken);
      
      // Save mapper to local storage
      saveMapper(mapper);
      
      // Redirect to dashboard where they can start mapping
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">
              POWER THE <span className="text-orange-500">SAFETY MAP.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Lagos streets move fast. Provide the live data the network needs to
              navigate safely. Mount your device, map your route, and monetize
              your movement.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => setStep("form")} className="bg-orange-500 hover:bg-orange-600">
                BECOME A MAPPER
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/login")} className="border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950">
                LOG IN
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/")}>
                VIEW MAPPER GRID
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <Card className="p-6 text-center">
              <div className="text-4xl font-bold mb-2">18,402</div>
              <div className="text-sm text-muted-foreground">MAPPERS</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-4xl font-bold mb-2">4.2M</div>
              <div className="text-sm text-muted-foreground">KM MAPPED</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-4xl font-bold mb-2">850K</div>
              <div className="text-sm text-muted-foreground">TOTAL PAID (NGN)</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-4xl font-bold mb-2">98.2%</div>
              <div className="text-sm text-muted-foreground">GRID CONFIDENCE</div>
            </Card>
          </div>

          {/* How to Map Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              HOW TO <span className="text-orange-500">MAP.</span>
            </h2>
            <div className="space-y-8">
              {ONBOARDING_STEPS.map((item, index) => (
                <Card key={index} className="p-6">
                  <div className="flex gap-6">
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <item.icon className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-6xl font-bold text-muted-foreground/20 absolute -mt-4">
                        0{index + 1}
                      </div>
                      <h3 className="text-2xl font-bold mb-2 relative z-10">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" onClick={() => setStep("form")} className="bg-orange-500 hover:bg-orange-600">
                START MAPPING <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        <h2 className="text-3xl font-bold mb-2">Join the Network</h2>
        <p className="text-muted-foreground mb-6">
          Register to become a Safety Mapper in Lagos
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Full Name *</label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Phone Number *</label>
            <Input
              type="tel"
              placeholder="+234 800 000 0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Email Address *</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Password *</label>
            <Input
              type="password"
              placeholder="Create a password (min. 6 chars)"
              value={formData.password || ""}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Vehicle Type *</label>
            <select
              className="w-full px-3 py-2 border rounded-md bg-background"
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleType })}
              required
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Vehicle Number/Plate (Optional)
            </label>
            <Input
              type="text"
              placeholder="ABC-123-XY"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={formData.agreedToTerms}
              onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
              className="mt-1"
              required
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              I agree to the terms and conditions and privacy policy. I consent to
              sharing my location and video data while actively mapping.
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("intro")}
              disabled={isLoading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.agreedToTerms}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? "Registering..." : "JOIN NETWORK"}
            </Button>
          </div>
          
          <div className="text-center mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button 
                type="button" 
                onClick={() => router.push("/login")}
                className="text-orange-500 hover:underline font-medium"
              >
                Log in here
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
