const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getStudents,
  getStudentProfile,
  getDashboardStats,
  createForm,
  getForms,
  updateForm,
  deleteForm,
  getSubmissions,
  updateSubmission,
  verifyStudent,
  sendToAdmin,
  exportSubmissions,
  exportExcel,
  exportStudentProfiles,
  getAllowedStudents,
  addAllowedStudent,
  bulkUploadStudents,
  deleteAllowedStudent,
  updateAllowedStudent,
  getUpdatedStudentList,
  exportUpdatedStudentList,
  getStudentFiles,
  downloadStudentFilesZip,
} = require('../controllers/coordinatorController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Separate multer for bulk upload (Excel files)
const bulkUploadDir = path.join(__dirname, '../../uploads/bulk');
if (!fs.existsSync(bulkUploadDir)) fs.mkdirSync(bulkUploadDir, { recursive: true });
const bulkStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, bulkUploadDir),
  filename: (req, file, cb) => cb(null, 'bulk-' + Date.now() + path.extname(file.originalname)),
});
const bulkUpload = multer({
  storage: bulkStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) cb(null, true);
    else cb(new Error('Only Excel files allowed'), false);
  },
});

router.use(protect, restrictTo('coordinator'));

router.get('/stats', getDashboardStats);
router.get('/students', getStudents);
router.get('/students/:id', getStudentProfile);
router.put('/students/:id/verify', verifyStudent);
router.post('/students/send-to-admin', sendToAdmin);
router.post('/forms', createForm);
router.get('/forms', getForms);
router.put('/forms/:id', updateForm);
router.delete('/forms/:id', deleteForm);
router.get('/submissions', getSubmissions);
router.put('/submissions/:id', updateSubmission);
router.get('/export', exportExcel);
router.get('/export/submissions', exportSubmissions);
router.post('/export/profiles', exportStudentProfiles);

// Allowed students (whitelist)
router.get('/allowed-students', getAllowedStudents);
router.post('/allowed-students', addAllowedStudent);
router.post('/allowed-students/bulk', bulkUpload.single('file'), bulkUploadStudents);
router.put('/allowed-students/:id', updateAllowedStudent);
router.delete('/allowed-students/:id', deleteAllowedStudent);

// Updated student list
router.get('/updated-list', getUpdatedStudentList);
router.get('/export/updated-list', exportUpdatedStudentList);

// Student files/documents
router.get('/student-files', getStudentFiles);
router.get('/student-files/download', downloadStudentFilesZip);

module.exports = router;
