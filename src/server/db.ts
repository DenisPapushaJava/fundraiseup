import mongoose from 'mongoose';

const DB_URI = 'mongodb://localhost:27017/tracker';

export const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.log('MongoDB connection error:', error);
    process.exit(1);
  }
};
