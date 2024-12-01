import { ITracks } from "./models/TrackerEvent.ts";

export const validateEvents = (events: unknown[]): boolean => {
  return events.every((event): event is ITracks => {
    if (typeof event !== "object" || event === null) return false;

    const { event: ev, tags, url, title, ts } = event as Partial<ITracks>;

    return (
      typeof ev === "string" &&
      Array.isArray(tags) &&
      tags.every((tag) => typeof tag === "string") &&
      typeof url === "string" &&
      typeof title === "string" &&
      typeof ts === "number" &&
      Number.isFinite(ts) &&
      ts > 0
    );
  });
};
