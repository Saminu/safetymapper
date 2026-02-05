import SunCalc from "suncalc";

export type TimeOfDay = "Night" | "Dawn" | "Day" | "Dusk";

export interface SunInfo {
  timeOfDay: TimeOfDay;
  sunrise: Date;
  sunset: Date;
  dawn: Date;
  dusk: Date;
}

/**
 * Determines the time of day (Night, Dawn, Day, Dusk) based on
 * a UTC timestamp and GPS coordinates.
 *
 * - Night: Before dawn or after dusk
 * - Dawn: Between dawn and sunrise
 * - Day: Between sunrise and sunset
 * - Dusk: Between sunset and dusk
 */
export function getTimeOfDay(
  timestamp: string | Date,
  lat: number,
  lon: number
): SunInfo {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  // Get sun times for this location and date
  const times = SunCalc.getTimes(date, lat, lon);

  const dawn = times.dawn;
  const sunrise = times.sunrise;
  const sunset = times.sunset;
  const dusk = times.dusk;

  let timeOfDay: TimeOfDay;

  if (date < dawn || date > dusk) {
    timeOfDay = "Night";
  } else if (date >= dawn && date < sunrise) {
    timeOfDay = "Dawn";
  } else if (date >= sunrise && date <= sunset) {
    timeOfDay = "Day";
  } else {
    // Between sunset and dusk
    timeOfDay = "Dusk";
  }

  return {
    timeOfDay,
    sunrise,
    sunset,
    dawn,
    dusk,
  };
}

/**
 * Get icon and color for time of day
 */
export function getTimeOfDayStyle(timeOfDay: TimeOfDay): {
  color: string;
  bgColor: string;
} {
  switch (timeOfDay) {
    case "Day":
      return { color: "text-yellow-600", bgColor: "bg-yellow-100" };
    case "Dawn":
      return { color: "text-orange-500", bgColor: "bg-orange-100" };
    case "Dusk":
      return { color: "text-purple-500", bgColor: "bg-purple-100" };
    case "Night":
      return { color: "text-blue-600", bgColor: "bg-blue-100" };
  }
}
