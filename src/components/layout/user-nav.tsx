"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { getMapper } from "@/lib/storage";

import { cn } from "@/lib/utils"; // Assuming cn exists, or just use template literals

interface UserNavProps {
  className?: string;
}

export function UserNav({ className }: UserNavProps) {
  const router = useRouter();
  const [mapperId, setMapperId] = useState<string | null>(null);
  const [mapperName, setMapperName] = useState<string>("");

  useEffect(() => {
    // Check for mapper ID in localStorage
    const id = localStorage.getItem("mapperId");
    if (id) {
      setMapperId(id);
      const mapper = getMapper(id);
      if (mapper) {
        setMapperName(mapper.name);
      }
    }

    // Listen for storage changes to update UI
    const handleStorageChange = () => {
      const newId = localStorage.getItem("mapperId");
      setMapperId(newId);
      if (newId) {
        const mapper = getMapper(newId);
        if (mapper) {
          setMapperName(mapper.name);
        } else {
             setMapperName("");
        }
      } else {
        setMapperName("");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event for immediate updates within same window
    window.addEventListener("mapper-login", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("mapper-login", handleStorageChange);
    };
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("mapperId");
        setMapperId(null);
        setMapperName("");
        router.push("/");
        // Trigger update
        window.dispatchEvent(new Event("mapper-login"));
    }
  };

  if (!mapperId) {
    return (
      <Button 
        onClick={() => router.push("/onboarding")}
        className="bg-orange-500 hover:bg-orange-600 font-bold"
      >
        <LogIn className="w-4 h-4 mr-2" />
        JOIN / LOGIN
      </Button>
    );
  }

  // Get initials
  const initials = mapperName
    ? mapperName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    .slice(0, 2)
    : "ME";

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div 
        className="flex items-center gap-2 cursor-pointer p-1 pr-3 rounded-full hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
        onClick={() => router.push("/dashboard")}
        title="Go to Dashboard"
      >
        <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold border-2 border-white/20 shadow-sm">
          {initials}
        </div>
        <span className="hidden sm:inline font-medium text-sm max-w-[100px] truncate">
          {mapperName}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
        onClick={handleLogout}
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
