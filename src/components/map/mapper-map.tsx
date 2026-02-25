"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Mapper, MappingSession, MapEvent } from "@/types/mapper";

const LAGOS_CENTER: [number, number] = [3.3792, 6.5244]; // [lon, lat]

interface MapperMapProps {
  mappers: Mapper[];
  sessions: MappingSession[];
  onMapperClick?: (mapper: Mapper) => void;
  events?: MapEvent[];
  className?: string;
}

export interface MapperMapRef {
  flyToEvent: (location: { lat: number; lon: number }) => void;
}

export const MapperMap = forwardRef<MapperMapRef, MapperMapProps>(({
  mappers,
  sessions,
  onMapperClick,
  events = [],
  className = "",
}, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token not found");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: LAGOS_CENTER,
      zoom: 11,
    });

    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    flyToEvent: (location: { lat: number; lon: number }) => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [location.lon, location.lat],
          zoom: 15,
          essential: true
        });
        
        // Find and open popup if it exists
        // Note: This is a bit tricky since markers are created imperatively.
        // We might want to store marker references if we need to open them programmatically.
      }
    }
  }));

  // Add mapper markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll(".mapper-marker");
    existingMarkers.forEach((marker) => marker.remove());

    // Add markers for live mappers
    const liveMappers = mappers.filter((m) => m.isLive && m.currentLocation);

    liveMappers.forEach((mapper) => {
      if (!mapper.currentLocation) return;

      // Find active session for this mapper
      const activeSession = sessions.find(
        (s) => s.mapperId === mapper.id && s.status === "ACTIVE"
      );

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "mapper-marker";
      el.style.cssText = `
        width: 40px;
        height: 40px;
        background-color: #f97316;
        border: 3px solid #fff;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        position: relative;
      `;

      // Add vehicle icon based on type
      const icons: Record<string, string> = {
        TAXI_MAX_RIDES: "🚕",
        OKADA_MOTORCYCLE: "🏍️",
        DANFO_BUS: "🚌",
        BOLT_UBER: "🚗",
        KEKE_NAPEP: "🛺",
        BOX_TRUCK: "🚚",
        PRIVATE_CAR: "🚙",
        OTHER: "📍",
      };
      el.innerHTML = icons[mapper.vehicleType] || "📍";

      // Add pulsing animation for active mappers
      const pulseEl = document.createElement("div");
      pulseEl.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: #f97316;
        opacity: 0.6;
        animation: pulse 2s infinite;
      `;
      el.appendChild(pulseEl);

      // Add popup with mapper info
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
      }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${mapper.name}</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            ${mapper.vehicleType.replace(/_/g, " ")}
          </div>
          ${
            activeSession
              ? `
            <div style="font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <div>Distance: ${(activeSession.distance ?? 0).toFixed(2)} km</div>
              <div>Tokens: ${(activeSession.tokensEarned ?? 0).toFixed(2)}</div>
            </div>
          `
              : ""
          }
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([mapper.currentLocation.lon, mapper.currentLocation.lat])
        .setPopup(popup)
        .addTo(map);

      // Add click handler
      el.addEventListener("click", () => {
        if (onMapperClick) {
          onMapperClick(mapper);
        }
      });
    });

    // Draw route lines for all sessions (active and completed)
    sessions
      .filter((s) => s.route && s.route.length > 1)
      .forEach((session, index) => {
        const sourceId = `route-${session.id}`;
        const layerId = `route-layer-${session.id}`;
        
        // Different colors for different session statuses
        const isActive = session.status === "ACTIVE";
        const isCompleted = session.status === "COMPLETED";
        const lineColor = isActive ? "#f97316" : isCompleted ? "#3b82f6" : "#6b7280";
        const lineWidth = isActive ? 4 : 3;
        const lineOpacity = isActive ? 0.8 : 0.5;

        // Remove existing source and layer
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }

        // Add route line
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {
              status: session.status,
              distance: session.distance,
              tokens: session.tokensEarned,
            },
            geometry: {
              type: "LineString",
              coordinates: session.route!.map((p) => [p.lon, p.lat]),
            },
          },
        });

        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": lineColor,
            "line-width": lineWidth,
            "line-opacity": lineOpacity,
          },
        });

        // Add a popup on click for completed sessions
        if (isCompleted) {
          map.on("click", layerId, (e) => {
            if (e.features && e.features[0]) {
              const feature = e.features[0];
              new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div style="padding: 8px; min-width: 180px;">
                    <div style="font-weight: bold; margin-bottom: 4px; color: #3b82f6;">Completed Session</div>
                    <div style="font-size: 12px; color: #666;">
                      <div>Distance: ${(session.distance ?? 0).toFixed(2)} km</div>
                      <div>Tokens: ${(session.tokensEarned ?? 0).toFixed(2)}</div>
                      <div>Duration: ${session.duration ?? 0} min</div>
                    </div>
                  </div>
                `)
                .addTo(map);
            }
          });

          // Change cursor on hover
          map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
          });
        }
      });


    // Add event markers
    const existingEventMarkers = document.querySelectorAll(".event-marker");
    existingEventMarkers.forEach((marker) => marker.remove());

    events.forEach((event) => {
      const el = document.createElement("div");
      el.className = "event-marker";
      
      let icon = "⚠️";
      let color = "#ef4444"; // red-500
      
      const eventType = event.type || event.category || "";
      switch(eventType) {
        case "ACCIDENT":
          icon = "💥";
          color = "#ef4444";
          break;
        case "TRAFFIC":
          icon = "🚦";
          color = "#f59e0b";
          break;
        case "POLICE":
          icon = "👮";
          color = "#3b82f6";
          break;
        case "HAZARD":
          icon = "⚠️";
          color = "#eab308";
          break;
        case "ROAD_WORK":
          icon = "🚧";
          color = "#f97316";
          break;
        case "FLOOD":
          icon = "🌊";
          color = "#0ea5e9";
          break;
        case "RAIN":
          icon = "🌧️";
          color = "#6366f1";
          break;
        case "FIRE":
          icon = "🔥";
          color = "#dc2626";
          break;
        case "PROTEST":
          icon = "📢";
          color = "#a855f7";
          break;
        case "SOS":
          icon = "🆘";
          color = "#dc2626";
          break;
        case "OTHER":
          icon = "📋";
          color = "#6b7280";
          break;
      }

      el.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 2px solid #fff;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        z-index: 10;
      `;
      
      el.innerHTML = icon;

      // Build media section HTML
      let mediaHtml = "";
      const mediaItems = event.media || [];
      if (mediaItems.length > 0) {
        const mediaItemsHtml = mediaItems.map((m) => {
          const isVideo = m.type === "video";
          const isCaptured = m.sourceType === "CAPTURED";
          const badgeColor = isCaptured ? "#22c55e" : "#f59e0b";
          const badgeLabel = isCaptured ? "📸 Live" : "📤 Upload";
          const tooltipText = isCaptured
            ? "Captured live in the app at the time of the event"
            : "Uploaded from device gallery / camera roll";
          
          return `
            <div style="position: relative; width: 80px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; border: 1px solid #e5e7eb;">
              ${isVideo
                ? `<video src="${m.url}" style="width:100%;height:100%;object-fit:cover;" muted playsinline></video>`
                : `<img src="${m.url}" style="width:100%;height:100%;object-fit:cover;" alt="event media" />`
              }
              <div style="position:absolute;bottom:2px;left:2px;" title="${tooltipText}">
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 2px;
                  padding: 1px 4px;
                  border-radius: 4px;
                  font-size: 8px;
                  font-weight: 700;
                  background: ${badgeColor}cc;
                  color: white;
                  backdrop-filter: blur(4px);
                  cursor: help;
                ">${badgeLabel}</span>
              </div>
              ${isVideo ? `<div style="position:absolute;top:2px;right:2px;">
                <span style="
                  display: inline-flex;
                  padding: 1px 3px;
                  border-radius: 3px;
                  font-size: 7px;
                  font-weight: 700;
                  background: #7c3aedcc;
                  color: white;
                ">▶ VID</span>
              </div>` : ""}
            </div>`;
        }).join("");

        mediaHtml = `
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
            <div style="display: flex; gap: 4px; overflow-x: auto; padding-bottom: 4px;">
              ${mediaItemsHtml}
            </div>
          </div>`;
      } else if (event.videoUrl) {
        // Legacy single video
        mediaHtml = `
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
            <video src="${event.videoUrl}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;" controls muted playsinline></video>
          </div>`;
      }

      const displayType = eventType === "OTHER" && event.customCategory 
        ? event.customCategory 
        : eventType.replace(/_/g, " ");

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        className: "event-popup",
        maxWidth: "320px",
      }).setHTML(`
        <div style="padding: 10px; min-width: 200px; max-width: 300px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: ${color}; font-size: 13px;">
            ${icon} ${displayType}
          </div>
          ${event.description ? `<div style="font-size: 12px; font-weight: 500; margin-bottom: 6px; color: #374151;">
            ${event.description}
          </div>` : ""}
          ${event.reporterName ? `<div style="font-size: 10px; color: #9ca3af; margin-bottom: 4px;">
            Reported by: ${event.reporterName}
          </div>` : ""}
          <div style="display: flex; align-items: center; gap: 8px; font-size: 10px; color: #6b7280;">
            <span style="
              display: inline-flex;
              padding: 1px 6px;
              border-radius: 9999px;
              font-weight: 700;
              font-size: 9px;
              color: white;
              background: ${
                event.severity === "CRITICAL" ? "#ef4444" :
                event.severity === "HIGH" ? "#f97316" :
                event.severity === "MEDIUM" ? "#eab308" :
                "#3b82f6"
              };
            ">${event.severity}</span>
            <span>${new Date(event.timestamp).toLocaleTimeString()}</span>
          </div>
          ${mediaHtml}
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([event.location.lon, event.location.lat])
        .setPopup(popup)
        .addTo(map);
    });

  }, [mapLoaded, mappers, sessions, onMapperClick, events]);

  return (
    <>
      <style jsx global>{`
        .event-popup {
          z-index: 50 !important;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.3;
          }
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
        }
      `}</style>
      <div ref={mapContainerRef} className={className} />
    </>
  );
});

MapperMap.displayName = "MapperMap";
