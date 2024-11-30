import { Tracks } from "./models/TrackerEvent.ts";

export const validateEvents = (events: any[]): boolean => {
  return events.every((event) => {
    if (typeof event !== "object" || event === null) return false;

    const { event: ev, tags, url, title, ts } = event;

    if (
      typeof ev !== "string" ||
      !Array.isArray(tags) ||
      !tags.every((tag) => typeof tag === "string") ||
      typeof url !== "string" ||
      typeof title !== "string" ||
      typeof ts !== "number" ||
      !Number.isFinite(ts) ||
      ts <= 0
    ) {
      return false;
    }

    return true;
  });
};
