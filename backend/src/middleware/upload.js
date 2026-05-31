const multer = require('multer');
const path = require('path');
const fs = require('fs');

let cloudinary;
let CloudinaryStorage;
let useCloudinary = false;

try {
  cloudinary = require('cloudinary').v2;
  const csMod = require('multer-storage-cloudinary');
  CloudinaryStorage = csMod.CloudinaryStorage;

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    useCloudinary = true;
  }
} catch (e) {
  // Cloudinary not available
}

let storage;

if (useCloudinary) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const folder = `ise-placement/${req.user?._id || 'general'}`;
      const ext = path.extname(file.originalname).toLowerCase();
      let resourceType = 'auto';
      if (['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv'].includes(ext)) {
        resourceType = 'raw';
      }
      // Name file as: fieldname-username.ext (e.g. resume-bhuvana-l.pdf)
      const userName = (req.user?.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
      return {
        folder,
        resource_type: resourceType,
        public_id: `${file.fieldname}-${userName}${ext}`,
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xlsx', 'xls', 'csv'],
      };
    },
  });
} else {
  // Use memory storage — files will be saved to MongoDB
  storage = multer.memoryStorage();
}

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
module.exports.useCloudinary = useCloudinary;
module.exports.cloudinary = cloudinary;
