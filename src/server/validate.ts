import { ITracks } from "./models/TrackerEvent.ts";

export const validateEvents = (events: unknown[]): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  const oneHourInSeconds = 3600;

  return events.every((event): event is ITracks => {
    if (typeof event !== "object" || event === null) return false;

    const { event: ev, tags, url, title, ts } = event as ITracks;

    return (
      typeof ev === "string" &&
      Array.isArray(tags) &&
      tags.every((tag) => typeof tag === "string") &&
      typeof url === "string" &&
      typeof title === "string" &&
      typeof ts === "number" &&
      Number.isFinite(ts) &&
      ts > 0 &&
      ts <= currentTime &&
      ts >= currentTime - oneHourInSeconds
    );
  });
};
