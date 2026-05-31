const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use Cloudinary if credentials are set, otherwise fall back to local storage
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

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
      return {
        folder,
        resource_type: resourceType,
        public_id: `${file.fieldname}-${Date.now()}`,
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xlsx', 'xls', 'csv'],
      };
    },
  });
} else {
  // Local storage fallback for development
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(uploadDir, req.user._id.toString());
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = file.fieldname + '-' + Date.now() + ext;
      cb(null, name);
    },
  });
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
module.exports.cloudinary = cloudinary;
