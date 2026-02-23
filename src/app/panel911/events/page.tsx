"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Trash2, Edit3, Video, MapPin, CheckCircle, XCircle, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventItem {
  _id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  severity: string;
  reporterName: string;
  viewCount: number;
  location: {
    lat: number;
    lon: number;
  };
  videoUrl?: string;
  createdAt: string;
}

export default function AdminEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const storedToken = localStorage.getItem("accessToken");
      setToken(storedToken);
      try {
        const res = await fetch("/api/admin/events", {
          headers: {
            "Authorization": `Bearer ${storedToken}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setEvents(data.data);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/status`, {
        method: 'PATCH',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setEvents(prev => prev.map(e => e._id === id ? { ...e, status: newStatus } : e));
      } else {
        alert('Failed to update event status');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating status');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this event? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setEvents(prev => prev.filter(e => e._id !== id));
      } else {
        alert('Failed to delete event');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting event');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Active</Badge>;
      case 'CLEARED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Cleared</Badge>;
      case 'UPDATED':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Updated</Badge>;
      case 'CLOSED':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">Closed (Ended)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <span className="text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded text-xs">{severity}</span>;
      case 'MEDIUM':
        return <span className="text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded text-xs">{severity}</span>;
      default:
        return <span className="text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded text-xs">{severity}</span>;
    }
  };

  if (loading) {
    return <div className="p-8 pb-32 flex justify-center text-gray-500">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Event Management</h1>
      
      <Card className="shadow-sm border border-gray-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Event Info</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white w-48">Media</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Reporter</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Status / Severity</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {events.map((event) => (
                <tr key={event._id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 min-w-[250px]">
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-semibold text-gray-900 dark:text-white text-base truncate flex items-center">
                        {event.title}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs truncate max-w-[200px]">
                        {event.description}
                      </span>
                      <span className="text-blue-500 flex items-center text-xs mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {event.location?.lat?.toFixed(4)}, {event.location?.lon?.toFixed(4)}
                      </span>
                      <span className="text-gray-500 text-[10px] mt-1">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-48">
                    {event.videoUrl ? (
                      <div className="relative group w-32 h-20 bg-black rounded overflow-hidden">
                        <video 
                           src={event.videoUrl} 
                           className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-32 h-20 bg-gray-100 dark:bg-zinc-800 rounded flex items-center justify-center text-gray-400 text-xs">
                        No Media
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{event.reporterName}</span>
                    <div className="mt-1 flex items-center text-gray-500">
                      <Eye className="w-3 h-3 mr-1" /> {event.viewCount || 0} views
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-2 h-full justify-center">
                      {getStatusBadge(event.status)}
                      {getSeverityBadge(event.severity)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end justify-center gap-2">
                       <div className="flex items-center gap-2">
                         {event.status !== 'CLOSED' && (
                           <Button 
                             onClick={() => handleStatusChange(event._id, 'CLOSED')} 
                             size="sm" 
                             variant="secondary"
                             className="text-xs h-8 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-white border border-gray-300 dark:border-zinc-700"
                           >
                              <XCircle className="w-3.5 h-3.5 mr-1 text-gray-500" /> Close event
                           </Button>
                         )}
                         <Button 
                           onClick={() => handleDeleteEvent(event._id)} 
                           size="sm" 
                           variant="destructive"
                           className="text-xs h-8"
                         >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                         </Button>
                       </div>
                       
                       {/* Additional status toggles depending on current status */}
                       {event.status === 'CLOSED' && (
                         <Button 
                           onClick={() => handleStatusChange(event._id, 'ACTIVE')} 
                           size="sm" 
                           variant="outline"
                           className="text-xs h-8 text-green-600 border-green-200 hover:bg-green-50"
                         >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Re-open Active
                         </Button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500 border-t border-gray-100">
                    No events found on the platform
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
