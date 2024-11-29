import { Tracks } from './models/TrackerEvent.ts';

export const validateEvents = (events: any[]): boolean => {
  return events.every((event) => {
    const instance = new Tracks(event);
    const validationError = instance.validateSync();
    return !validationError;
  });
};
