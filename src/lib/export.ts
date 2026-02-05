import { AIEvent } from "@/types/events";

export function exportEventsToCSV(events: AIEvent[], filename = "events.csv") {
  const headers = ["ID", "Type", "Timestamp", "Latitude", "Longitude", "Video URL"];
  const rows = events.map((e) => [
    e.id,
    e.type,
    e.timestamp,
    e.location.lat,
    e.location.lon,
    e.videoUrl,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
