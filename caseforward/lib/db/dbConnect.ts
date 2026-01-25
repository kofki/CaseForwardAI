import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

declare global {
  var _mongooseCache: { conn?: typeof mongoose | null; promise?: Promise<typeof mongoose> | null } | undefined;
}

const cached = global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

const connectOptions: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

export default async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, connectOptions)
      .then((m) => {
        return m;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
