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

const BASE_URI = process.env.MONGO_URI || 'mongodb+srv://Naman:2410990736@skillswap.ut9zkta.mongodb.net/clustrDB?retryWrites=true&w=majority';

async function checkAll() {
    for (const dbName of ['clustrDB', 'test']) {
        const uri = BASE_URI.includes('clustrDB') ? BASE_URI.replace('clustrDB', dbName) : BASE_URI.replace('/test', `/${dbName}`);
        console.log(`\n--- DB: ${dbName} ---`);
        try {
            const conn = await mongoose.createConnection(uri).asPromise();
            const posts = await conn.db.collection('posts').find().toArray();
            if (posts.length === 0) {
                console.log('No posts found.');
            } else {
                posts.forEach(p => console.log(`ID: ${p._id} | Content: ${p.content?.substring(0, 50)}`));
            }
            await conn.close();
        } catch (err) {
            console.error(`Failed to connect to ${dbName}:`, err.message);
        }
    }
}

checkAll();
