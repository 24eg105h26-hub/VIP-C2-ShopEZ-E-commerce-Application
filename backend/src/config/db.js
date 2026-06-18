const mongoose = require('mongoose');
const runSeeder = require('../utils/seeder');

const connectDB = async () => {
  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopez';
  
  try {
    console.log(`Connecting to database at ${connUri}...`);
    // Connect with a short timeout to fail fast if MongoDB is down
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn('Local/Configured MongoDB is offline. Booting up local in-memory database server fallback...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      console.log(`In-memory database started at: ${mongoUri}`);
      const conn = await mongoose.connect(mongoUri);
      console.log(`Mongoose connected to in-memory database: ${conn.connection.host}`);
      
      // Programmatically seed mock products, categories and logins
      console.log('Seeding in-memory database collections...');
      await runSeeder();
      console.log('In-memory database seeded successfully!');
    } catch (memError) {
      console.error(`Failed to boot up in-memory database fallback: ${memError.message}`);
      // Fallback: don't call process.exit(1), let the app stay up
    }
  }
};

module.exports = connectDB;
