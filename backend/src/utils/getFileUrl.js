/**
 * Get the URL for an uploaded file.
 * - Cloudinary: file.path contains the full URL
 * - Local: build URL from /uploads/userId/filename
 */
function getFileUrl(file, userId) {
  if (file.path && file.path.startsWith('http')) {
    // Cloudinary URL
    return file.path;
  }
  // Local storage
  return `/uploads/${userId}/${file.filename}`;
}

module.exports = getFileUrl;
