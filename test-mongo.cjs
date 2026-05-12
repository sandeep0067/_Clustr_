const mongoose = require('mongoose');

const uri1 = 'mongodb://Naman:2410990736@ac-ajfrbqf-shard-00-00.ut9zkta.mongodb.net:27017,ac-ajfrbqf-shard-00-01.ut9zkta.mongodb.net:27017,ac-ajfrbqf-shard-00-02.ut9zkta.mongodb.net:27017/clustrDB?ssl=true&replicaSet=atlas-hgb2d5-shard-0&authSource=admin&retryWrites=true&w=majority';
const uri2 = 'mongodb+srv://Naman:2410990736@ut9zkta.mongodb.net/clustrDB?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  console.log("Testing direct URI...");
  try {
    await mongoose.connect(uri1, { serverSelectionTimeoutMS: 5000, family: 4 });
    console.log("Direct URI connection SUCCESS");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Direct URI connection FAILED:", err.message);
  }

  console.log("Testing SRV URI...");
  try {
    await mongoose.connect(uri2, { serverSelectionTimeoutMS: 5000, family: 4 });
    console.log("SRV URI connection SUCCESS");
    await mongoose.disconnect();
  } catch (err) {
    console.error("SRV URI connection FAILED:", err.message);
  }
}

testConnection();
