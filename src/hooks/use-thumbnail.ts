"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseThumbnailResult {
  thumbnailUrl: string | null;
  isLoading: boolean;
  error: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useThumbnail(videoUrl: string): UseThumbnailResult {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const hasAttempted = useRef(false);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px", // Start loading 200px before visible
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Load thumbnail when visible
  const loadThumbnail = useCallback(async () => {
    if (hasAttempted.current || !videoUrl) return;
    hasAttempted.current = true;

    setIsLoading(true);
    setError(false);

    try {
      const encodedUrl = encodeURIComponent(videoUrl);
      const response = await fetch(`/api/thumbnail?url=${encodedUrl}`);

      if (!response.ok) {
        throw new Error("Failed to load thumbnail");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setThumbnailUrl(objectUrl);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (isVisible && !hasAttempted.current) {
      loadThumbnail();
    }
  }, [isVisible, loadThumbnail]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  return {
    thumbnailUrl,
    isLoading,
    error,
    ref,
  };
}
