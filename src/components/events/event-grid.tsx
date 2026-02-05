"use client";

import { useEffect, useRef, useCallback } from "react";
import { AIEvent } from "@/types/events";
import { EventCard, EventCardSkeleton } from "./event-card";
import { cn } from "@/lib/utils";

interface EventGridProps {
  events: AIEvent[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEventClick: (event: AIEvent) => void;
}

export function EventGrid({
  events,
  isLoading,
  hasMore,
  onLoadMore,
  onEventClick,
}: EventGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (!isLoading && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">No events found</p>
        <p className="text-sm">Try adjusting your filters or date range</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid gap-4",
          "grid-cols-1",
          "sm:grid-cols-2",
          "md:grid-cols-3",
          "lg:grid-cols-4",
          "xl:grid-cols-5"
        )}
      >
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onClick={() => onEventClick(event)}
          />
        ))}

        {/* Loading skeletons */}
        {isLoading &&
          Array.from({ length: events.length === 0 ? 10 : 5 }).map((_, i) => (
            <EventCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Load more trigger */}
      {hasMore && <div ref={loadMoreRef} className="h-10" />}

      {/* Loading indicator */}
      {isLoading && events.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}
