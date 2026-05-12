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

async function inspectData() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        
        console.log('--- USERS ---');
        const users = await db.collection('users').find().toArray();
        users.forEach(u => console.log(` - ${u.name} (${u.email})` || ' - No name/email'));
        
        console.log('\n--- POSTS ---');
        const posts = await db.collection('posts').find().toArray();
        posts.forEach(p => console.log(` - ${p.title || 'Untitled'} : ${p.content?.substring(0, 30)}...`));
        
        await mongoose.connection.close();
    } catch (err) {
        console.error('Failed:', err);
    }
}

inspectData();
