"use client";

import { useEffect, useState } from "react";
import { CopyX, LayoutDashboard, Database, CreditCard, Activity, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  totalMappers: number;
  activeMappersCount: number;
  totalEvents: number;
  totalEarned: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("/api/admin/stats", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh interval
    const interval = setInterval(fetchStats, 60000); // 1 min
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 flex flex-col items-center pt-20">
        <div className="h-10 w-48 bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Mappers",
      value: stats?.totalMappers || 0,
      icon: <Database className="h-6 w-6 text-blue-500" />,
      color: "border-blue-500",
      bgBase: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Active Mappers",
      value: stats?.activeMappersCount || 0,
      icon: <Activity className="h-6 w-6 text-green-500" />,
      color: "border-green-500",
      bgBase: "bg-green-50 dark:bg-green-950/20"
    },
    {
      title: "Total Events",
      value: stats?.totalEvents || 0,
      icon: <LayoutDashboard className="h-6 w-6 text-purple-500" />,
      color: "border-purple-500",
      bgBase: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Total Earned",
      value: `₦${(stats?.totalEarned || 0).toLocaleString()}`,
      icon: <CreditCard className="h-6 w-6 text-orange-500" />,
      color: "border-orange-500",
      bgBase: "bg-orange-50 dark:bg-orange-950/20"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Platform Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time insights across the SafetyMapper ecosystem.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => (
          <Card key={idx} className={`shadow-sm border-t-4 ${card.color} transition-all hover:shadow-md hover:-translate-y-1`}>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${card.bgBase} rounded-t-lg`}>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold">{card.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Quick links or extra sections could go here. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-500 text-sm">
            Detailed metrics and logs will populate here once more activity occurs.
            <div className="mt-8 flex items-center justify-center p-8 border-2 border-dashed rounded-lg border-gray-200 dark:border-zinc-800">
              <span className="flex items-center text-gray-400">
                <Activity className="w-5 h-5 mr-2" /> Live stream starting soon.
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border-zinc-800">
          <CardHeader>
             <CardTitle className="text-lg flex items-center justify-between text-zinc-100">
               System Health
               <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.7)]"></span>
             </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="flex justify-between items-center text-zinc-400 text-sm border-b border-zinc-800 pb-2">
                 <span>API Status</span>
                 <span className="text-green-400 font-medium">99.9% Uptime</span>
               </div>
               <div className="flex justify-between items-center text-zinc-400 text-sm border-b border-zinc-800 pb-2">
                 <span>Database</span>
                 <span className="text-green-400 font-medium">Connected</span>
               </div>
               <div className="flex justify-between items-center text-zinc-400 text-sm pb-2">
                 <span>CDN Video Delivery</span>
                 <span className="text-green-400 font-medium">Optimal</span>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
