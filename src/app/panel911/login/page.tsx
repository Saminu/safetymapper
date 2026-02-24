"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function AdminLogin() {
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
      const response = await fetch("/api/auth/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to login");
      }

      const { user, accessToken } = await response.json();
      
      if (user.role !== 'admin') {
        throw new Error("Access denied. Admin privileges required.");
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userRole", user.role);
      
      router.push("/panel911");
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-zinc-900 border-zinc-800 text-white shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Admin Portal</h2>
          <p className="text-zinc-400 mt-2">Login to manage SafetyMapper</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">Admin Email</label>
            <Input
              type="email"
              placeholder=""
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">Password</label>
            <Input
              type="password"
              placeholder="Enter admin password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all font-medium py-2.5 h-auto border-0"
            >
              {isLoading ? "Authenticating..." : "Admin Login"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
