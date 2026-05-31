const express = require('express');
const router = express.Router();
const {
  getForms,
  getForm,
  submitForm,
  updateSubmission,
  getMySubmissions,
  getProfile,
  updateProfile,
  uploadMarksheet,
  deleteAccount,
} = require('../controllers/studentController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, restrictTo('student'));

router.get('/profile', getProfile);
router.put('/profile', upload.any(), updateProfile);
router.post('/marksheet', upload.single('marksheet'), uploadMarksheet);
router.get('/forms', getForms);
router.get('/forms/:id', getForm);
router.post('/forms/:id/submit', upload.any(), submitForm);
router.put('/forms/:id/submit', upload.any(), updateSubmission);
router.get('/submissions', getMySubmissions);
router.delete('/account', deleteAccount);

module.exports = router;
