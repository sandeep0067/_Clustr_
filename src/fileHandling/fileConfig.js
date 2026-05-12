


import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


export const fileConfig = {
  
  uploadDir: path.join(__dirname, '../uploads'),
  publicDir: path.join(__dirname, '../public'),

  
  allowedMimeTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: ['application/pdf', 'application/msword', 'text/plain'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    video: ['video/mp4', 'video/webm']
  },

  
  allowedExtensions: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'pdf', 'doc', 'docx', 'txt',
    'mp3', 'wav', 'ogg',
    'mp4', 'webm'
  ],

  
  sizes: {
    image: 5 * 1024 * 1024,      
    document: 10 * 1024 * 1024,   
    audio: 50 * 1024 * 1024,      
    video: 500 * 1024 * 1024,     
    default: 10 * 1024 * 1024     
  },

  
  fileNamingPattern: 'timestamp' 
};


export function initializeUploadDirs() {
  const dirs = [fileConfig.uploadDir, fileConfig.publicDir];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[File System] Created directory: ${dir}`);
    }
  });
}


export function validateFileType(mimeType, category = 'images') {
  const allowedTypes = fileConfig.allowedMimeTypes[category] || fileConfig.allowedMimeTypes.images;

  if (!mimeType || !allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
}


export function validateFileExtension(filename) {
  if (!filename) {
    return { valid: false, error: 'Filename is required' };
  }

  const ext = path.extname(filename).toLowerCase().slice(1); 

  if (!ext) {
    return { valid: false, error: 'File must have an extension' };
  }

  if (!fileConfig.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Extension .${ext} not allowed. Allowed: .${fileConfig.allowedExtensions.join(', .')}`
    };
  }

  return { valid: true, ext };
}


export function validateFileSize(fileSize, category = 'default') {
  const maxSize = fileConfig.sizes[category] || fileConfig.sizes.default;

  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  return { valid: true };
}


export function generateSafeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);

  
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');

  return `${safeName}_${timestamp}_${random}${ext}`;
}


export function getFileCategory(mimeType) {
  for (const [category, types] of Object.entries(fileConfig.allowedMimeTypes)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return 'other';
}


export function getFileInfo(filename) {
  const filePath = path.join(fileConfig.uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const stats = fs.statSync(filePath);

  return {
    filename,
    path: filePath,
    size: stats.size,
    sizeKB: (stats.size / 1024).toFixed(2),
    sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    ext: path.extname(filename).toLowerCase().slice(1)
  };
}


export function listUploadedFiles() {
  if (!fs.existsSync(fileConfig.uploadDir)) {
    return [];
  }

  const files = fs.readdirSync(fileConfig.uploadDir);

  return files
    .map(filename => getFileInfo(filename))
    .filter(info => info !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}


export function deleteFile(filename) {
  const filePath = path.join(fileConfig.uploadDir, filename);

  
  if (!filePath.startsWith(fileConfig.uploadDir)) {
    return {
      success: false,
      error: 'Invalid file path'
    };
  }

  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      error: 'File not found'
    };
  }

  try {
    fs.unlinkSync(filePath);
    return {
      success: true,
      message: `File ${filename} deleted successfully`
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete file: ${error.message}`
    };
  }
}


export function clearAllFiles() {
  if (!fs.existsSync(fileConfig.uploadDir)) {
    return {
      success: true,
      message: 'Upload directory does not exist',
      deletedCount: 0
    };
  }

  const files = fs.readdirSync(fileConfig.uploadDir);
  let deletedCount = 0;

  files.forEach(filename => {
    try {
      const filePath = path.join(fileConfig.uploadDir, filename);
      fs.unlinkSync(filePath);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete ${filename}:`, error.message);
    }
  });

  return {
    success: true,
    message: `Cleared ${deletedCount} file(s)`,
    deletedCount
  };
}
