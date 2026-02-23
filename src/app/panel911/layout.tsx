"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, AlertTriangle, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if on login page
    if (pathname === '/panel911/login') return;

    // Check auth token
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");

    if (!token || role !== 'admin') {
      router.push("/panel911/login");
    }
  }, [pathname, router]);

  if (!isClient) return null;

  if (pathname === '/panel911/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    router.push("/panel911/login");
  };

  const navItems = [
    { href: "/panel911", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/panel911/mappers", icon: Users, label: "Mappers" },
    { href: "/panel911/events", icon: AlertTriangle, label: "Events" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">SafetyMapper Admin</h1>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 font-medium" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900"
                }`}>
                  <item.icon className={`h-5 w-5 ${isActive ? "text-orange-500" : ""}`} />
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}

          <div className="pt-8 mt-8 border-t border-gray-200 dark:border-zinc-800">
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 md:hidden">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold ml-4">Admin Dashboard</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
