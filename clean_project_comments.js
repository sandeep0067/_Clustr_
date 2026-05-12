import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = 'c:\\Users\\HP VICTUS\\OneDrive\\Desktop\\backendproject\\backendproject';

function removeComments(content) {
  let cleaned = content;
  
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  cleaned = cleaned.replace(/(^|[^\\])\/\/.*$/gm, (match, p1) => {
    if (match.includes('://') || match.includes('data:')) {
        return match;
    }
    return p1;
  });

  cleaned = cleaned.replace(//g, '');

  return cleaned;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processDirectory(fullPath);
      }
    } else {
      const ext = path.extname(file);
      if (['.js', '.jsx', '.ts', '.tsx', '.css', '.html'].includes(ext)) {
        console.log(`Cleaning: ${fullPath}`);
        const content = fs.readFileSync(fullPath, 'utf8');
        const cleaned = removeComments(content);
        fs.writeFileSync(fullPath, cleaned, 'utf8');
      }
    }
  }
}

console.log('Starting comment removal...');
processDirectory(targetDir);
console.log('Finished cleaning all files.');
