/**
 * Formats a Unix time (seconds) as HH:MM in the clock of the place, given the
 * place's offset from UTC in seconds, as OpenWeather returns it.
 */
export function formatLocalTime(unixSeconds: number, offsetSeconds: number): string {
  return new Date((unixSeconds + offsetSeconds) * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}
