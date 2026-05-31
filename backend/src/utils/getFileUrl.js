const path = require('path');
const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getSupabase() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

/**
 * Upload file to Supabase Storage and return a public URL.
 * PDFs open inline in browser.
 * Falls back to MongoDB if Supabase fails.
 */
async function getFileUrl(file, userId, userName) {
  const client = getSupabase();
  const bucket = process.env.SUPABASE_BUCKET || 'files';

  if (client && file.buffer) {
    try {
      const safeName = (userName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const ext = path.extname(file.originalname).toLowerCase();
      const filePath = `${userId}/${file.fieldname}-${safeName}${ext}`;

      const { data, error } = await client.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = client.storage.from(bucket).getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Supabase upload failed:', err.message);
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
