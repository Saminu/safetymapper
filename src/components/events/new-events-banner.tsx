"use client";

interface NewEventsBannerProps {
  count: number;
  onClick: () => void;
}

export function NewEventsBanner({ count, onClick }: NewEventsBannerProps) {
  if (count <= 0) return null;

  return (
    <button
      onClick={onClick}
      className="text-sm text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full border border-primary/30 transition-colors"
    >
      Show {count} new video{count !== 1 ? "s" : ""}
    </button>
  );
}
