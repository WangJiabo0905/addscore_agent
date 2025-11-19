import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = global as typeof global & {
  mongooseConnection?: CachedConnection;
};

const cached: CachedConnection = globalForMongoose.mongooseConnection || {
  conn: null,
  promise: null,
};

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!MONGODB_URI) {
      throw new Error('Missing MONGODB_URI environment variable');
    }
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
    });
  }

  cached.conn = await cached.promise;
  globalForMongoose.mongooseConnection = cached;
  return cached.conn;
}
