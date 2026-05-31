const FileStore = require('../models/FileStore');

/**
 * Get the URL for an uploaded file.
 * - Cloudinary: file.path contains the full URL
 * - MongoDB fallback: save buffer to MongoDB, return API URL
 */
async function getFileUrl(file, userId) {
  // Cloudinary — file.path is the full URL
  if (file.path && file.path.startsWith('http')) {
    // For Cloudinary raw files, we need to ensure proper access
    // The URL from multer-storage-cloudinary is already correct
    return file.path;
  }

  // Memory storage (MongoDB fallback) — file.buffer exists
  if (file.buffer) {
    const stored = await FileStore.create({
      filename: `${file.fieldname}-${Date.now()}${require('path').extname(file.originalname)}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      uploadedBy: userId,
    });
    return `/api/files/${stored._id}`;
  }

  // Local disk storage
  return `/uploads/${userId}/${file.filename}`;
}

module.exports = getFileUrl;
