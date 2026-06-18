const { MongoMemoryServer } = require('mongodb-memory-server');

const startLocalDB = async () => {
  try {
    console.log('Starting local MongoMemoryServer on port 27017...');
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'shopez',
        ip: '127.0.0.1'
      }
    });
    console.log(`\n======================================================`);
    console.log(`SUCCESS: In-Memory MongoDB running at: ${mongoServer.getUri()}`);
    console.log(`======================================================\n`);

    // Keep active
    process.on('SIGINT', async () => {
      console.log('Stopping local database...');
      await mongoServer.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start local MongoMemoryServer:', error);
    process.exit(1);
  }
};

startLocalDB();
