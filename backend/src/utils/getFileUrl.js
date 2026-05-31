const path = require('path');
const { initFirebase } = require('./firebase');

/**
 * Upload file to Firebase Storage and return a public URL.
 * PDFs and images open inline in browser.
 * Falls back to MongoDB if Firebase fails.
 */
async function getFileUrl(file, userId, userName) {
  const bucket = initFirebase();

  if (bucket && file.buffer) {
    try {
      const safeName = (userName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const ext = path.extname(file.originalname).toLowerCase();
      const filePath = `students/${userId}/${file.fieldname}-${safeName}${ext}`;

      const fileRef = bucket.file(filePath);

      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId.toString(),
            originalName: file.originalname,
          },
        },
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      // Return public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      return publicUrl;
    } catch (err) {
      console.error('Firebase upload failed:', err.message);
      // Fall through to MongoDB fallback
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
