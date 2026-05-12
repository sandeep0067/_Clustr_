require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI (masked):', MONGO_URI.replace(/:([^@]+)@/, ':****@'));
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      family: 4
    });
    
    console.log('✓ MongoDB Connected successfully!');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    await mongoose.connection.close();
    console.log('\n✓ Connection test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testConnection();
