"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { saveMapper, syncToServer } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/mapper/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to login");
      }

      const { mapper, accessToken } = await response.json();
      
      // Store mapper ID and token in localStorage
      localStorage.setItem("mapperId", mapper.id);
      localStorage.setItem("accessToken", accessToken);
      
      // Save mapper to local storage
      saveMapper(mapper);
      
      // Sync to server
      await syncToServer();
      
      // Redirect to dashboard where they can start mapping
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
        <p className="text-muted-foreground mb-6">
          Login to your Safety Mapper account
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Email Address *</label>
            <Input
              type="email"
              placeholder="mapper@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Password *</label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? "Logging in..." : "LOG IN"}
            </Button>
          </div>
          
          <div className="text-center mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button 
                type="button" 
                onClick={() => router.push("/onboarding")}
                className="text-orange-500 hover:underline font-medium"
              >
                Sign up here
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
