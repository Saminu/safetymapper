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
              <div>Distance: ${activeSession.distance.toFixed(2)} km</div>
              <div>Tokens: ${activeSession.tokensEarned.toFixed(2)}</div>
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
                      <div>Distance: ${session.distance.toFixed(2)} km</div>
                      <div>Tokens: ${session.tokensEarned.toFixed(2)}</div>
                      <div>Duration: ${session.duration} min</div>
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
      
      switch(event.type) {
        case "ACCIDENT":
          icon = "💥";
          color = "#ef4444";
          break;
        case "TRAFFIC":
          icon = "🚦";
          color = "#f59e0b"; // amber-500
          break;
        case "POLICE":
          icon = "👮";
          color = "#3b82f6"; // blue-500
          break;
        case "HAZARD":
          icon = "⚠️";
          color = "#eab308"; // yellow-500
          break;
        case "ROAD_WORK":
          icon = "🚧";
          color = "#f97316"; // orange-500
          break;
        case "SOS":
          icon = "🆘";
          color = "#dc2626"; // red-600
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

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: "event-popup",
      }).setHTML(`
        <div style="padding: 8px; min-width: 180px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: ${color};">
            ${event.type.replace(/_/g, " ")}
          </div>
          <div style="font-size: 12px; font-weight: 500; margin-bottom: 4px;">
            ${event.description}
          </div>
          <div style="font-size: 10px; color: #666;">
            Severity: ${event.severity}
            <br/>
            ${new Date(event.timestamp).toLocaleTimeString()}
          </div>
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
