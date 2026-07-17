const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let isConnected = false;
let mongoServer = null;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  
  if (!uri || uri.includes('YOUR_USERNAME')) {
    console.warn('⚠️  MongoDB URI not configured. Edit backend/.env and paste your Atlas URI.');
    console.warn('   Starting LOCAL MEMORY DATABASE (mongodb-memory-server)...');
    try {
      mongoServer = await MongoMemoryServer.create();
      const localUri = mongoServer.getUri();
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
      isConnected = true;
      console.log('✅ Local In-Memory MongoDB connected!');
      return;
    } catch (e) {
      console.error('❌ Local MongoDB fallback failed:', e.message);
      return;
    }
  }

  // Connect to actual Atlas DB
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log('✅ MongoDB Atlas connected:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('   Check your Atlas URI and network access.');
  }
}

module.exports = connectDB;
