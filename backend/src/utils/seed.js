const mongoose = require('mongoose');
require('dotenv').config();
const runSeeder = require('./seeder');

const seedData = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopez';
    await mongoose.connect(connUri);
    console.log('Seed: Connected to Database...');
    await runSeeder();
    console.log('Seed: SUCCESSFUL! Disconnecting...');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed execution error:', err);
    process.exit(1);
  }
};

seedData();
