import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import fs from 'fs';
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) return;
        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
    });
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Naman:2410990736@skillswap.ut9zkta.mongodb.net/clustrDB?retryWrites=true&w=majority';

console.log('Testing connection to:', MONGO_URI.replace(/:([^@]+)@/, ':****@'));

const testSchema = new mongoose.Schema({ name: String, timestamp: Date });
const TestModel = mongoose.model('ConnectionTest', testSchema);

async function runTest() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');
        console.log('Database Name:', mongoose.connection.db.databaseName);
        
        const testDoc = await TestModel.create({ name: 'Antigravity Test', timestamp: new Date() });
        console.log('Test document created successfully:', testDoc._id);
        
        const count = await TestModel.countDocuments();
        console.log('Total documents in ConnectionTest collection:', count);
        
        await mongoose.connection.close();
        console.log('Connection closed.');
    } catch (err) {
        console.error('Test failed:', err);
    }
}

runTest();
