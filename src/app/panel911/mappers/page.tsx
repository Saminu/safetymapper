"use client";

import { useEffect, useState } from "react";
import { UserX, UserCheck, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Mapper {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  status: string;
  totalEarnings: number;
  totalEvents: number;
  isLive: boolean;
  createdAt: string;
}

export default function AdminMappers() {
  const [mappers, setMappers] = useState<Mapper[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchMappers = async () => {
      const storedToken = localStorage.getItem("accessToken");
      setToken(storedToken);
      try {
        const res = await fetch("/api/admin/mappers", {
          headers: {
            "Authorization": `Bearer ${storedToken}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setMappers(data.data);
        }
      } catch (error) {
        console.error("Error fetching mappers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMappers();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/mappers/${id}/status`, {
        method: 'PATCH',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Optimistic UI update
        setMappers(prev => prev.map(m => m._id === id ? { ...m, status: newStatus } : m));
      } else {
        alert('Failed to change status');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">Active</span>;
      case 'INACTIVE':
        return <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 px-3 py-1 rounded-full text-xs font-semibold">Restricted</span>;
      case 'SUSPENDED':
        return <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full text-xs font-semibold">Suspended</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-8 pb-32 flex justify-center text-gray-500">Loading mappers...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mapper Management</h1>
      
      <Card className="shadow-sm border border-gray-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Name / Email</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Vehicle</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Metrics</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {mappers.map((mapper) => (
                <tr key={mapper._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-white">{mapper.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{mapper.email}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{mapper.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md text-xs dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                      {mapper.vehicleType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                       {getStatusBadge(mapper.status)}
                       {mapper.isLive && (
                         <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Live Mapping Now"></span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <div>Events: {mapper.totalEvents}</div>
                    <div>Earned: ₦{(mapper.totalEarnings || 0).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {mapper.status !== 'ACTIVE' ? (
                        <Button 
                          onClick={() => handleStatusChange(mapper._id, 'ACTIVE')} 
                          size="sm" 
                          variant="outline" 
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        >
                          <UserCheck className="w-4 h-4 mr-1" /> Activate
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleStatusChange(mapper._id, 'INACTIVE')} 
                          size="sm" 
                          variant="outline"
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <UserX className="w-4 h-4 mr-1" /> Restrict
                        </Button>
                      )}
                      
                      {mapper.status !== 'SUSPENDED' && (
                        <Button 
                          onClick={() => handleStatusChange(mapper._id, 'SUSPENDED')} 
                          size="sm" 
                          variant="destructive"
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Suspend
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {mappers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500 border-t border-gray-100">
                    No mappers found matching criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
