


import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  fileConfig,
  initializeUploadDirs,
  listUploadedFiles,
  getFileInfo,
  deleteFile,
  clearAllFiles
} from './fileConfig.js';
import {
  validateFileUpload,
  validateMultipleFileUpload,
  validateFileBycategory
} from './fileUploadMiddleware.js';

const router = express.Router();


export function initializeFileRoutes() {
  initializeUploadDirs();
  console.log('[File Handling] Routes initialized');
}


router.get('/', (req, res) => {
  const files = listUploadedFiles();

  res.json({
    success: true,
    message: 'Files listed successfully',
    count: files.length,
    files: files.map(file => ({
      filename: file.filename,
      originalName: file.filename,
      size: file.size,
      sizeKB: file.sizeKB,
      sizeMB: file.sizeMB,
      ext: file.ext,
      createdAt: file.createdAt,
      modifiedAt: file.modifiedAt,
      url: `/uploads/${file.filename}`
    }))
  });
});


router.get('/:filename', (req, res) => {
  const { filename } = req.params;

  
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid filename',
      details: ['Filename cannot contain path separators']
    });
  }

  const fileInfo = getFileInfo(filename);

  if (!fileInfo) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
      details: [`File ${filename} does not exist`]
    });
  }

  
  res.download(fileInfo.path, fileInfo.filename, (err) => {
    if (err) {
      console.error(`Error downloading file ${filename}:`, err.message);
      res.status(500).json({
        success: false,
        error: 'Download failed',
        details: [err.message]
      });
    }
  });
});


router.post('/upload', validateFileUpload('file'), (req, res) => {
  const file = req.uploadedFile;

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    file: {
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category,
      url: file.url
    }
  });
});


router.post('/upload/image', validateFileBycategory('images', 'image'), (req, res) => {
  const file = req.uploadedFile;

  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully',
    file: {
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url
    }
  });
});


router.post('/upload/document', validateFileBycategory('documents', 'document'), (req, res) => {
  const file = req.uploadedFile;

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    file: {
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url
    }
  });
});


router.post('/upload/audio', validateFileBycategory('audio', 'audio'), (req, res) => {
  const file = req.uploadedFile;

  res.status(201).json({
    success: true,
    message: 'Audio uploaded successfully',
    file: {
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url
    }
  });
});


router.post('/upload/video', validateFileBycategory('video', 'video'), (req, res) => {
  const file = req.uploadedFile;

  res.status(201).json({
    success: true,
    message: 'Video uploaded successfully',
    file: {
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url
    }
  });
});


router.post('/upload/multiple', validateMultipleFileUpload('files'), (req, res) => {
  const files = req.uploadedFiles;

  res.status(201).json({
    success: true,
    message: `${files.length} file(s) uploaded successfully`,
    count: files.length,
    files: files.map(file => ({
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category,
      url: file.url
    }))
  });
});


router.delete('/:filename', (req, res) => {
  const { filename } = req.params;

  
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid filename',
      details: ['Filename cannot contain path separators']
    });
  }

  const result = deleteFile(filename);

  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error,
      details: [result.error]
    });
  }

  res.json({
    success: true,
    message: result.message
  });
});


router.delete('/', (req, res) => {
  
  if (req.query.confirm !== 'true') {
    return res.status(400).json({
      success: false,
      error: 'Confirmation required',
      details: ['Add ?confirm=true to the URL to delete all files'],
      warning: 'This action is permanent and cannot be undone'
    });
  }

  const result = clearAllFiles();

  res.json({
    success: result.success,
    message: result.message,
    deletedCount: result.deletedCount
  });
});


router.get('/info/:filename', (req, res) => {
  const { filename } = req.params;

  
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid filename',
      details: ['Filename cannot contain path separators']
    });
  }

  const fileInfo = getFileInfo(filename);

  if (!fileInfo) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
      details: [`File ${filename} does not exist`]
    });
  }

  res.json({
    success: true,
    file: {
      filename: fileInfo.filename,
      size: fileInfo.size,
      sizeKB: fileInfo.sizeKB,
      sizeMB: fileInfo.sizeMB,
      extension: fileInfo.ext,
      createdAt: fileInfo.createdAt,
      modifiedAt: fileInfo.modifiedAt,
      url: `/uploads/${fileInfo.filename}`
    }
  });
});

export default router;
