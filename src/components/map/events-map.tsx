"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxToken } from "@/lib/api";
import { AIEvent } from "@/types/events";

interface EventsMapProps {
  events: AIEvent[];
  onEventClick: (event: AIEvent) => void;
  className?: string;
}

const MAPBOX_STYLE = "mapbox://styles/arielseidman/clyf7l1at00u001r1eyc63yyy";

export function EventsMap({ events, onEventClick, className = "" }: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Check for token on mount
  useEffect(() => {
    const mapboxToken = getMapboxToken();
    setToken(mapboxToken);
    setTokenChecked(true);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !token || !tokenChecked) return;

    mapboxgl.accessToken = token;

    // Default center (world view) if no events
    const defaultCenter: [number, number] = [-98.5795, 39.8283]; // Center of USA
    const defaultZoom = 3;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: defaultCenter,
      zoom: defaultZoom,
    });

    const mapInstance = map.current;

    mapInstance.on("load", () => {
      mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
      setMapLoaded(true);
    });

    return () => {
      mapInstance.remove();
      setMapLoaded(false);
    };
  }, [token, tokenChecked]);

  // Add/update markers when events change
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (events.length === 0) {
      // No events - reset to default view
      mapInstance.flyTo({
        center: [-98.5795, 39.8283],
        zoom: 3,
      });
      return;
    }

    // Add markers for each event
    events.forEach((event) => {
      const markerEl = document.createElement("div");
      markerEl.className = "events-map-marker";
      markerEl.style.cssText = `
        width: 14px;
        height: 14px;
        background: #8b5cf6;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.15s ease;
      `;

      markerEl.addEventListener("mouseenter", () => {
        markerEl.style.transform = "scale(1.3)";
      });
      markerEl.addEventListener("mouseleave", () => {
        markerEl.style.transform = "scale(1)";
      });
      markerEl.addEventListener("click", () => {
        onEventClick(event);
      });

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([event.location.lon, event.location.lat])
        .addTo(mapInstance);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all events
    if (events.length === 1) {
      // Single event - center on it with fixed zoom
      mapInstance.flyTo({
        center: [events[0].location.lon, events[0].location.lat],
        zoom: 14,
      });
    } else {
      // Multiple events - fit to bounds
      const bounds = new mapboxgl.LngLatBounds();
      events.forEach((event) => {
        bounds.extend([event.location.lon, event.location.lat]);
      });
      mapInstance.fitBounds(bounds, { padding: 50 });
    }
  }, [events, mapLoaded, onEventClick]);

  if (!tokenChecked) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
      >
        <p>Loading map...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
      >
        <p>Mapbox token not configured. Add it in Settings.</p>
      </div>
    );
  }

  return <div ref={mapContainer} className={className} />;
}
