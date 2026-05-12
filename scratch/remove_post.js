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

async function removePost() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        
        
        const result = await db.collection('posts').deleteOne({ 
            content: /React Server Components/i 
        });
        
        if (result.deletedCount > 0) {
            console.log('Successfully deleted the React Server Components post.');
        } else {
            console.log('Post not found in clustrDB. Checking test database...');
            await mongoose.connection.close();
            
            
            const TEST_URI = MONGO_URI.replace('/clustrDB', '/test');
            await mongoose.connect(TEST_URI);
            const resultTest = await mongoose.connection.db.collection('posts').deleteOne({ 
                content: /React Server Components/i 
            });
            
            if (resultTest.deletedCount > 0) {
                console.log('Successfully deleted the post from the test database.');
            } else {
                console.log('Post not found in any database.');
            }
        }
        
        await mongoose.connection.close();
    } catch (err) {
        console.error('Failed to remove post:', err);
    }
}

removePost();
