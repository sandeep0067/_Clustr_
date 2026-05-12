

import multer from 'multer';
import path from 'path';
import {
  fileConfig,
  validateFileType,
  validateFileExtension,
  validateFileSize,
  generateSafeFilename,
  getFileCategory
} from './fileConfig.js';


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, fileConfig.uploadDir);
  },
  filename: (req, file, cb) => {
    const safeFilename = generateSafeFilename(file.originalname);
    cb(null, safeFilename);
  }
});


const fileFilter = (req, file, cb) => {
  const extValidation = validateFileExtension(file.originalname);

  if (!extValidation.valid) {
    return cb(new Error(extValidation.error), false);
  }

  
  cb(null, true);
};


const uploadSingleFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: fileConfig.sizes.default
  }
});


const uploadMultipleFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: fileConfig.sizes.default,
    files: 10
  }
});


export function validateFileUpload(fieldName = 'file') {
  return (req, res, next) => {
    uploadSingleFile.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          details: [
            err.code === 'FILE_TOO_LARGE'
              ? `File size exceeds ${(fileConfig.sizes.default / (1024 * 1024)).toFixed(2)}MB limit`
              : err.message
          ]
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          details: [err.message]
        });
      }

      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          details: ['Please provide a file in the request']
        });
      }

      
      const sizeValidation = validateFileSize(req.file.size);
      if (!sizeValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          details: [sizeValidation.error]
        });
      }

      
      req.uploadedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        category: getFileCategory(req.file.mimetype),
        path: req.file.path,
        url: `/uploads/${req.file.filename}`
      };

      next();
    });
  };
}


export function validateMultipleFileUpload(fieldName = 'files') {
  return (req, res, next) => {
    uploadMultipleFiles.array(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          details: [err.message]
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          details: [err.message]
        });
      }

      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded',
          details: ['Please provide at least one file']
        });
      }

      
      const uploadedFiles = [];
      const errors = [];

      req.files.forEach((file, index) => {
        const sizeValidation = validateFileSize(file.size);

        if (!sizeValidation.valid) {
          errors.push(`File ${index + 1} (${file.originalname}): ${sizeValidation.error}`);
        } else {
          uploadedFiles.push({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            category: getFileCategory(file.mimetype),
            path: file.path,
            url: `/uploads/${file.filename}`
          });
        }
      });

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Some files failed validation',
          details: errors,
          successCount: uploadedFiles.length
        });
      }

      
      req.uploadedFiles = uploadedFiles;

      next();
    });
  };
}


export function validateFileBycategory(category = 'images', fieldName = 'file') {
  return (req, res, next) => {
    uploadSingleFile.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          details: [err.message]
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          details: [err.message]
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          details: ['Please provide a file in the request']
        });
      }

      
      const typeValidation = validateFileType(req.file.mimetype, category);
      if (!typeValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'File type validation failed',
          details: [typeValidation.error]
        });
      }

      
      const sizeValidation = validateFileSize(req.file.size, category);
      if (!sizeValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'File size validation failed',
          details: [sizeValidation.error]
        });
      }

      req.uploadedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        category: category,
        path: req.file.path,
        url: `/uploads/${req.file.filename}`
      };

      next();
    });
  };
}


export function requireFileUpload(fieldName = 'file') {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        error: 'File upload required',
        details: ['This endpoint requires a file upload']
      });
    }
    next();
  };
}
