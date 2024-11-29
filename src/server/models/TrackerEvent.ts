import mongoose, { Schema, Document } from 'mongoose';

export interface ITracks extends Document {
  event: string;
  tags: string[];
  url: string;
  title: string;
  ts: number;
}

const TracksSchema: Schema = new Schema({
  event: { type: String, required: true },
  tags: { type: [String], required: true },
  url: { type: String, required: true },
  title: { type: String, required: true },
  ts: { type: Number, required: true },
});

export const Tracks = mongoose.model<ITracks>('Tracks', TracksSchema);
