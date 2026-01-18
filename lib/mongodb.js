import { MongoClient } from 'mongodb';

// Support both MONGO_URL and MONGODB_URI for compatibility
// Defer check to connectMongo() to avoid build crash when env is missing
const uri = process.env.MONGODB_URI || process.env.MONGO_URL;

// Validate URI format (must be mongodb+srv:// for Atlas)
if (uri && !uri.startsWith('mongodb+srv://')) {
  console.warn('Warning: MongoDB URI should use mongodb+srv:// for Atlas. Using provided URI as-is.');
}

const options = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  w: 'majority',
};

let client;
let clientPromise;

// Only create connection at load when uri exists (avoids build crash when MONGODB_URI is unset)
if (uri) {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect().catch((err) => {
        console.error('MongoDB connection error:', err);
        global._mongoClientPromise = null;
        throw err;
      });
    }
    clientPromise = global._mongoClientPromise;
  } else {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect().catch((err) => {
        console.error('MongoDB connection error:', err);
        global._mongoClientPromise = null;
        throw err;
      });
    }
    clientPromise = global._mongoClientPromise;
  }
}

// Helper function to ensure connection - renamed to connectMongo for clarity
export async function connectMongo() {
  if (!uri) {
    throw new Error('Please add MONGODB_URI or MONGO_URL to .env');
  }
  if (!clientPromise) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect().catch((err) => {
      console.error('MongoDB connection error:', err);
      clientPromise = null;
      throw err;
    });
    if (process.env.NODE_ENV === 'development') {
      global._mongoClientPromise = clientPromise;
    }
  }
  try {
    const client = await clientPromise;
    // Ping to ensure connection is alive
    await client.db('admin').command({ ping: 1 });
    return client;
  } catch (error) {
    // Reset promise on error so it can retry
    clientPromise = null;
    if (process.env.NODE_ENV === 'development') {
      global._mongoClientPromise = null;
    }
    throw error;
  }
}

// Legacy function name for backward compatibility
export async function connectDB() {
  return connectMongo();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default connectMongo;
