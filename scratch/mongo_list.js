import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
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

async function listAll() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        console.log('Connected to:', db.databaseName);
        
        const collections = await db.listCollections().toArray();
        console.log('Collections in database:');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(` - ${col.name}: ${count} documents`);
        }
        
        await mongoose.connection.close();
    } catch (err) {
        console.error('Failed:', err);
    }
}

listAll();
