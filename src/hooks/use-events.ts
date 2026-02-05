"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AIEvent, AIEventType, Region } from "@/types/events";
import { fetchEvents, getApiKey } from "@/lib/api";
import { getRegionsFromEvents, getCountriesFromRegions } from "@/lib/geo";
import { getTimeOfDay, TimeOfDay } from "@/lib/sun";

const POLL_INTERVAL = 30000; // Poll every 30 seconds

interface Coordinates {
  lat: number;
  lon: number;
}

interface UseEventsOptions {
  startDate: string;
  endDate: string;
  types?: AIEventType[];
  selectedTimeOfDay?: TimeOfDay[];
  selectedCountries?: string[];
  searchCoordinates?: Coordinates | null;
  searchRadius?: number;
  limit?: number;
}

interface UseEventsResult {
  events: AIEvent[];
  filteredEvents: AIEvent[];
  regions: Region[];
  countries: string[];
  isLoading: boolean;
  error: string | null;
  hasApiKey: boolean;
  totalCount: number;
  loadMore: () => void;
  hasMore: boolean;
  refresh: () => void;
  newEventsCount: number;
  showNewEvents: () => void;
}

// Create a circular polygon from center point and radius
// Returns array of [lon, lat] coordinates (note: lon first per GeoJSON spec)
function createCirclePolygon(lat: number, lon: number, radiusMeters: number, numPoints = 32): [number, number][] {
  const coords: [number, number][] = [];
  const earthRadius = 6371000; // meters

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const dLat = (radiusMeters / earthRadius) * Math.cos(angle);
    const dLon = (radiusMeters / (earthRadius * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);

    const pointLat = lat + (dLat * 180 / Math.PI);
    const pointLon = lon + (dLon * 180 / Math.PI);

    coords.push([pointLon, pointLat]); // [lon, lat] format
  }

  return coords;
}

export function useEvents(options: UseEventsOptions): UseEventsResult {
  const { startDate, endDate, types, selectedTimeOfDay = [], selectedCountries = [], searchCoordinates, searchRadius = 500, limit = 50 } = options;

  const [events, setEvents] = useState<AIEvent[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [newEventsCount, setNewEventsCount] = useState(0);
  const lastKnownTotalRef = useRef<number>(0);
  const isPollingRef = useRef(false);

  // Check for API key on mount
  useEffect(() => {
    setHasApiKey(!!getApiKey());
  }, []);

  const loadEvents = useCallback(
    async (reset = false) => {
      if (!getApiKey()) {
        setHasApiKey(false);
        setError("Please configure your API key in settings.");
        return;
      }

      setHasApiKey(true);
      setIsLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;

      try {
        // Convert date strings to ISO datetime format
        const startDateTime = new Date(startDate + "T00:00:00.000Z").toISOString();
        const endDateTime = new Date(endDate + "T23:59:59.999Z").toISOString();

        // Create polygon from coordinates for server-side filtering
        const polygon = searchCoordinates
          ? createCirclePolygon(searchCoordinates.lat, searchCoordinates.lon, searchRadius)
          : undefined;

        const response = await fetchEvents({
          startDate: startDateTime,
          endDate: endDateTime,
          types: types && types.length > 0 ? types : undefined,
          polygon,
          limit,
          offset: currentOffset,
        });

        const newEvents = reset
          ? response.events
          : [...events, ...response.events];

        setEvents(newEvents);
        setTotalCount(response.pagination.total);
        setOffset(currentOffset + response.events.length);

        // Track last known total for new events detection
        if (reset) {
          lastKnownTotalRef.current = response.pagination.total;
          setNewEventsCount(0);
        }

        // Update regions when events change
        const newRegions = await getRegionsFromEvents(newEvents);
        setRegions(newRegions);

        // Update countries list
        const newCountries = getCountriesFromRegions(newRegions);
        setCountries(newCountries);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate, types, searchCoordinates, searchRadius, limit, offset, events]
  );

  // Load events when filters change
  useEffect(() => {
    setOffset(0);
    setEvents([]);
    loadEvents(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, JSON.stringify(types), searchCoordinates?.lat, searchCoordinates?.lon, searchRadius]);

  const loadMore = useCallback(() => {
    if (!isLoading && events.length < totalCount) {
      loadEvents(false);
    }
  }, [isLoading, events.length, totalCount, loadEvents]);

  const refresh = useCallback(() => {
    setOffset(0);
    setEvents([]);
    setNewEventsCount(0);
    loadEvents(true);
  }, [loadEvents]);

  // Show new events (refresh the list)
  const showNewEvents = useCallback(() => {
    setNewEventsCount(0);
    setOffset(0);
    setEvents([]);
    loadEvents(true);
  }, [loadEvents]);

  // Poll for new events in the background
  useEffect(() => {
    if (!hasApiKey || isLoading) return;

    const checkForNewEvents = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const startDateTime = new Date(startDate + "T00:00:00.000Z").toISOString();
        const endDateTime = new Date(endDate + "T23:59:59.999Z").toISOString();

        const polygon = searchCoordinates
          ? createCirclePolygon(searchCoordinates.lat, searchCoordinates.lon, searchRadius)
          : undefined;

        const response = await fetchEvents({
          startDate: startDateTime,
          endDate: endDateTime,
          types: types && types.length > 0 ? types : undefined,
          polygon,
          limit: 1, // Only need the total count
          offset: 0,
        });

        const currentTotal = response.pagination.total;
        if (lastKnownTotalRef.current > 0 && currentTotal > lastKnownTotalRef.current) {
          setNewEventsCount(currentTotal - lastKnownTotalRef.current);
        }
      } catch {
        // Silently fail polling errors
      } finally {
        isPollingRef.current = false;
      }
    };

    const intervalId = setInterval(checkForNewEvents, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [hasApiKey, isLoading, startDate, endDate, types, searchCoordinates, searchRadius]);

  // Filter events by selected countries and time of day (coordinate filtering is done server-side via polygon)
  const filteredEvents = (() => {
    let filtered = events;

    // Filter by time of day if any selected
    if (selectedTimeOfDay.length > 0) {
      filtered = filtered.filter((event) => {
        const sunInfo = getTimeOfDay(
          event.timestamp,
          event.location.lat,
          event.location.lon
        );
        return selectedTimeOfDay.includes(sunInfo.timeOfDay);
      });
    }

    // Skip country filtering when using coordinate search (server handles it)
    if (searchCoordinates) {
      return filtered;
    }

    if (selectedCountries.length > 0 && selectedCountries.length < countries.length) {
      // Filter by selected countries if not all countries are selected
      const selectedCountrySet = new Set(selectedCountries);
      const regionIdsInSelectedCountries = new Set(
        regions
          .filter((r) => r.country && selectedCountrySet.has(r.country))
          .map((r) => r.id)
      );

      // Filter events that belong to regions in selected countries
      filtered = filtered.filter((event) => {
        const eventRegion = regions.find((r) => {
          const eventCell = `${Math.floor(event.location.lat / 0.1) * 0.1},${Math.floor(event.location.lon / 0.1) * 0.1}`;
          const regionCell = `${Math.floor(r.latitude / 0.1) * 0.1},${Math.floor(r.longitude / 0.1) * 0.1}`;
          return eventCell === regionCell;
        });
        return eventRegion && regionIdsInSelectedCountries.has(eventRegion.id);
      });
    }

    return filtered;
  })();

  return {
    events,
    filteredEvents,
    regions,
    countries,
    isLoading,
    error,
    hasApiKey,
    totalCount,
    loadMore,
    hasMore: events.length < totalCount,
    refresh,
    newEventsCount,
    showNewEvents,
  };
}
