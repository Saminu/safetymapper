"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxToken, getApiKey } from "@/lib/api";

interface PathPoint {
  lat: number;
  lon: number;
  timestamp?: number;
}

interface MapFeature {
  // Beemaps format
  class?: string;
  position?: {
    lon: number;
    lat: number;
    azimuth?: number;
    alt?: number;
  };
  properties?: {
    type?: string;
    speedLimit?: number;
    unit?: string;
  };
  // GeoJSON format
  type?: string;
  geometry?: {
    type: string;
    coordinates: [number, number];
  };
}

interface EventMapProps {
  location: {
    lat: number;
    lon: number;
  };
  path?: PathPoint[];
  currentTime?: number;
  videoDuration?: number;
  className?: string;
  showMapFeatures?: boolean;
}

const MAPBOX_STYLE = "mapbox://styles/arielseidman/clyf7l1at00u001r1eyc63yyy";

export function EventMap({ location, path, currentTime, videoDuration, className = "", showMapFeatures = true }: EventMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const movingMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Check for token on mount
  useEffect(() => {
    const mapboxToken = getMapboxToken();
    setToken(mapboxToken);
    setTokenChecked(true);
  }, []);

  // Fetch map features (stop signs, speed limits)
  useEffect(() => {
    if (!showMapFeatures) return;

    const fetchMapFeatures = async () => {
      const apiKey = getApiKey();
      if (!apiKey) return;

      try {
        const response = await fetch(
          `/api/map-features?lat=${location.lat}&lon=${location.lon}&radius=200`,
          {
            headers: {
              Authorization: apiKey,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Map features API response:", data);
          if (data.features) {
            setMapFeatures(data.features);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Map features API error:", response.status, errorData);
        }
      } catch (error) {
        console.error("Failed to fetch map features:", error);
      }
    };

    fetchMapFeatures();
  }, [location, showMapFeatures]);

  useEffect(() => {
    if (!mapContainer.current || !token || !tokenChecked) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [location.lon, location.lat],
      zoom: 15,
    });

    const mapInstance = map.current;

    mapInstance.on("load", () => {
      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

      // If we have a path, draw it
      if (path && path.length > 1) {
        const coordinates = path.map((p) => [p.lon, p.lat] as [number, number]);

        mapInstance.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        });

        mapInstance.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ef4444",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        // Fit map to path bounds
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach((coord) => bounds.extend(coord));
        mapInstance.fitBounds(bounds, { padding: 50 });
      }

      // Add moving marker (red with white border)
      const markerEl = document.createElement("div");
      markerEl.className = "event-marker";
      markerEl.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `;

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([location.lon, location.lat])
        .addTo(mapInstance);

      movingMarkerRef.current = marker;

      // Mark map as loaded
      setMapLoaded(true);
    });

    return () => {
      mapInstance.remove();
      setMapLoaded(false);
    };
  }, [location, path, token, tokenChecked]);

  // Add map feature markers when features are loaded and map is ready
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !mapLoaded || mapFeatures.length === 0) return;

    console.log("Adding map features:", mapFeatures.length, "features");
    console.log("Feature structure sample:", JSON.stringify(mapFeatures[0], null, 2));

    const markers: mapboxgl.Marker[] = [];

    mapFeatures.forEach((feature) => {
      // Handle the Beemaps API format
      // Features have: class, position: { lon, lat }, properties: { speedLimit, type, unit }
      let lon: number, lat: number;
      let featureClass: string | undefined;

      if (feature.position?.lon !== undefined && feature.position?.lat !== undefined) {
        // Beemaps format
        lon = feature.position.lon;
        lat = feature.position.lat;
        featureClass = feature.class;
      } else if (feature.geometry?.coordinates) {
        // GeoJSON format
        [lon, lat] = feature.geometry.coordinates;
        featureClass = feature.properties?.type || feature.class;
      } else {
        console.log("Unknown feature format:", feature);
        return;
      }

      const markerEl = document.createElement("div");
      markerEl.className = "map-feature-marker";

      if (featureClass === "stop-sign") {
        markerEl.innerHTML = `
          <div style="
            width: 28px;
            height: 28px;
            background: #dc2626;
            border: 2px solid white;
            border-radius: 2px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(45deg);
          ">
            <span style="
              color: white;
              font-size: 8px;
              font-weight: bold;
              transform: rotate(-45deg);
            ">STOP</span>
          </div>
        `;
      } else if (featureClass === "speed-sign") {
        const speedLimit = feature.properties?.speedLimit || "?";
        markerEl.innerHTML = `
          <div style="
            width: 28px;
            height: 32px;
            background: white;
            border: 3px solid #000;
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              color: #000;
              font-size: 11px;
              font-weight: bold;
            ">${speedLimit}</span>
          </div>
        `;
      } else {
        console.log("Unknown feature class:", featureClass);
        return; // Skip unknown feature types
      }

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([lon, lat])
        .addTo(mapInstance);

      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [mapFeatures, mapLoaded]);

  // Calculate bearing between two points (in degrees, 0 = north, 90 = east)
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
              Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  };

  // Calculate smoothed bearing by looking ahead a few points
  const calculateSmoothedBearing = (pathData: PathPoint[], currentIndex: number): number => {
    const lookAhead = 3; // Average over a few points for smoother rotation
    const endIndex = Math.min(currentIndex + lookAhead, pathData.length - 1);

    if (endIndex <= currentIndex) {
      return calculateBearing(
        pathData[Math.max(0, currentIndex - 1)].lat,
        pathData[Math.max(0, currentIndex - 1)].lon,
        pathData[currentIndex].lat,
        pathData[currentIndex].lon
      );
    }

    return calculateBearing(
      pathData[currentIndex].lat,
      pathData[currentIndex].lon,
      pathData[endIndex].lat,
      pathData[endIndex].lon
    );
  };

  // Update marker position based on video time
  useEffect(() => {
    const marker = movingMarkerRef.current;
    const mapInstance = map.current;
    if (!marker || !mapInstance || !mapLoaded || !path || path.length < 2 || currentTime === undefined || !videoDuration) {
      return;
    }

    // Calculate progress through the video (0 to 1)
    const progress = Math.max(0, Math.min(1, currentTime / videoDuration));

    // Find the position along the path based on progress
    // We'll interpolate between path points based on the video progress
    const pathIndex = progress * (path.length - 1);
    const lowerIndex = Math.floor(pathIndex);
    const upperIndex = Math.min(lowerIndex + 1, path.length - 1);
    const t = pathIndex - lowerIndex;

    // Interpolate between the two points
    const p1 = path[lowerIndex];
    const p2 = path[upperIndex];
    const lat = p1.lat + (p2.lat - p1.lat) * t;
    const lon = p1.lon + (p2.lon - p1.lon) * t;

    marker.setLngLat([lon, lat]);

    // Calculate smoothed bearing to orient map so vehicle moves toward top
    const bearing = calculateSmoothedBearing(path, lowerIndex);

    // Rotate map so vehicle heading points up
    // Map bearing is the rotation of the map - if vehicle heads east (90°),
    // we rotate map by -90° so east points up
    mapInstance.easeTo({
      center: [lon, lat],
      bearing: -bearing,
      duration: 300,
      easing: (t) => t, // Linear easing for smooth continuous motion
    });
  }, [currentTime, videoDuration, path, mapLoaded]);

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
