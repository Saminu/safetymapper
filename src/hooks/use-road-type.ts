import { useState, useEffect } from "react";
import { getMapboxToken } from "@/lib/api";

export interface RoadTypeData {
  class: string | null;
  classLabel: string | null;
  structure: string | null;
  toll: boolean;
}

interface UseRoadTypeResult {
  roadType: RoadTypeData | null;
  isLoading: boolean;
  error: string | null;
}

export function useRoadType(lat: number | null, lon: number | null): UseRoadTypeResult {
  const [roadType, setRoadType] = useState<RoadTypeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === null || lon === null) {
      setRoadType(null);
      setError(null);
      return;
    }

    const fetchRoadType = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const mapboxToken = getMapboxToken();
        if (!mapboxToken) {
          throw new Error("Mapbox token not configured");
        }

        const response = await fetch(`/api/road-type?lat=${lat}&lon=${lon}&token=${encodeURIComponent(mapboxToken)}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch road type");
        }

        const data: RoadTypeData = await response.json();
        setRoadType(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch road type");
        setRoadType(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoadType();
  }, [lat, lon]);

  return { roadType, isLoading, error };
}
