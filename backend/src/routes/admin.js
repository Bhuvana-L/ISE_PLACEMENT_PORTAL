const express = require('express');
const router = express.Router();
const {
  createCoordinator,
  getCoordinators,
  updateCoordinator,
  deleteCoordinator,
  getAllStudents,
  getStudentProfile,
  getVerifiedStudents,
  getVerifiedSubmissions,
  updateSubmission,
  getDashboardStats,
  exportSubmissions,
  exportExcel,
  exportStudentsList,
  exportStudentProfiles,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

router.get('/stats', getDashboardStats);
router.post('/coordinators', createCoordinator);
router.get('/coordinators', getCoordinators);
router.put('/coordinators/:id', updateCoordinator);
router.delete('/coordinators/:id', deleteCoordinator);
router.get('/students', getAllStudents);
router.get('/students/verified', getVerifiedStudents);
router.get('/students/:id', getStudentProfile);
router.get('/submissions', getVerifiedSubmissions);
router.put('/submissions/:id', updateSubmission);
router.get('/export', exportExcel);
router.get('/export/submissions', exportSubmissions);
router.get('/export/students-list', exportStudentsList);
router.post('/export/profiles', exportStudentProfiles);

module.exports = router;
