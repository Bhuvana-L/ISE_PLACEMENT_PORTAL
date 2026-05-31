const path = require('path');
const { cloudinary } = require('../middleware/upload');

/**
 * Upload file to Cloudinary and return the URL.
 * PDFs and images are uploaded so they open inline in browser.
 * Falls back to MongoDB if Cloudinary fails.
 */
async function getFileUrl(file, userId, userName) {
  // Try Cloudinary first
  if (process.env.CLOUDINARY_CLOUD_NAME && file.buffer) {
    try {
      const safeName = (userName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const ext = path.extname(file.originalname).toLowerCase();
      const folder = `ise-placement/${userId}`;
      const publicId = `${folder}/${file.fieldname}-${safeName}`;

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: 'auto',
            overwrite: true,
            access_mode: 'public',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      return result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to MongoDB:', err.message);
    }
  }

  // Fallback: Store in MongoDB
  if (file.buffer) {
    const FileStore = require('../models/FileStore');
    const stored = await FileStore.create({
      filename: `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      uploadedBy: userId,
    });
    return `/api/files/${stored._id}`;
  }

  return null;
}

module.exports = getFileUrl;
