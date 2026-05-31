const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Form = require('../models/Form');
const Submission = require('../models/Submission');
const ExcelJS = require('exceljs');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

exports.createCoordinator = async (req, res) => {
  try {
    const { name, email, password, assignedBatch } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const coordinator = await User.create({
      name, email, password, role: 'coordinator', assignedBatch,
    });
    res.status(201).json({ coordinator: coordinator.toSafeObject() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getCoordinators = async (req, res) => {
  const coordinators = await User.find({ role: 'coordinator' }).select('-password');
  res.json({ coordinators });
};

exports.updateCoordinator = async (req, res) => {
  try {
    const { name, email, assignedBatch } = req.body;
    const coordinator = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, assignedBatch },
      { new: true }
    ).select('-password');
    if (!coordinator) return res.status(404).json({ message: 'Coordinator not found' });
    res.json({ coordinator });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCoordinator = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Coordinator deleted' });
};

exports.getAllStudents = async (req, res) => {
  const { batch, search } = req.query;
  const query = { role: 'student' };
  if (batch) query.batch = batch;
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { usn: new RegExp(search, 'i') },
    ];
  }
  const students = await User.find(query).select('-password').sort({ batch: 1, name: 1 });
  res.json({ students });
};

exports.getStudentProfile = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: 'student',
    }).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getVerifiedStudents = async (req, res) => {
  const students = await User.find({ role: 'student', sentToAdmin: true }).select('-password');
  res.json({ students });
};

exports.getVerifiedSubmissions = async (req, res) => {
  try {
    const { batch, formId } = req.query;

    // Get students sent to admin
    const studentQuery = { role: 'student', sentToAdmin: true };
    if (batch) studentQuery.batch = batch;
    const students = await User.find(studentQuery).select('_id');
    const studentIds = students.map((s) => s._id);

    const subQuery = { student: { $in: studentIds } };
    if (formId) subQuery.form = formId;

    const submissions = await Submission.find(subQuery)
      .populate('student', 'name usn email cgpa phone batch')
      .populate('form', 'title fields')
      .sort({ createdAt: -1 });

    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const { responses, status, coordinatorNote } = req.body;
    if (responses) {
      const parsed = typeof responses === 'string' ? JSON.parse(responses) : responses;
      const responseMap = new Map();
      Object.entries(parsed).forEach(([k, v]) => responseMap.set(k, v));
      submission.responses = responseMap;
    }
    if (status) submission.status = status;
    if (coordinatorNote !== undefined) submission.coordinatorNote = coordinatorNote;

    await submission.save();
    res.json({ submission });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  const [totalStudents, totalCoordinators, totalForms, totalSubmissions, verifiedStudents] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'coordinator' }),
      Form.countDocuments(),
      Submission.countDocuments(),
      User.countDocuments({ role: 'student', sentToAdmin: true }),
    ]);

  const batches = await User.distinct('batch', { role: 'student' });
  res.json({ totalStudents, totalCoordinators, totalForms, totalSubmissions, verifiedStudents, batches });
};

exports.exportSubmissions = async (req, res) => {
  try {
    const { batch, formId } = req.query;

    const studentQuery = { role: 'student', sentToAdmin: true };
    if (batch) studentQuery.batch = batch;
    const students = await User.find(studentQuery).select('_id');
    const studentIds = students.map((s) => s._id);

    const subQuery = { student: { $in: studentIds } };
    if (formId) subQuery.form = formId;

    const submissions = await Submission.find(subQuery)
      .populate('student', 'name usn email cgpa phone batch')
      .populate('form', 'title fields');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Submissions');

    const baseColumns = [
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'USN', key: 'usn', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Batch', key: 'batch', width: 10 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
    ];

    const fieldLabels = new Set();
    submissions.forEach((s) => {
      if (s.form?.fields) s.form.fields.forEach((f) => fieldLabels.add(f.label));
      if (s.responses) for (const key of s.responses.keys()) fieldLabels.add(key);
    });

    const fieldColumns = [...fieldLabels].map((label) => ({ header: label, key: label, width: 20 }));
    sheet.columns = [...baseColumns, ...fieldColumns, { header: 'Status', key: 'status', width: 12 }];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEDFE' } };

    submissions.forEach((s) => {
      const row = {
        name: s.student?.name, usn: s.student?.usn, email: s.student?.email,
        phone: s.student?.phone, batch: s.student?.batch, cgpa: s.student?.cgpa, status: s.status,
      };
      if (s.responses) for (const [k, v] of s.responses) row[k] = String(v);
      sheet.addRow(row);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=admin_submissions.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportStudentProfiles = async (req, res) => {
  try {
    const { studentIds, columns } = req.body;
    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ message: 'No students selected' });
    }

    const selectedColumns = columns || null;
    const students = await User.find({ _id: { $in: studentIds } }).select('-password');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Student Profiles');

    const allColumns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'USN', key: 'usn', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Batch', key: 'batch', width: 10 },
      { header: 'Department', key: 'department', width: 12 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
      { header: 'Backlogs', key: 'backlogs', width: 10 },
      { header: 'Active Backlogs', key: 'activeBacklogs', width: 15 },
      { header: 'Headline', key: 'headline', width: 30 },
      { header: 'About', key: 'about', width: 40 },
      { header: 'Skills', key: 'skills', width: 30 },
      { header: 'Projects', key: 'projects', width: 40 },
      { header: 'Experience', key: 'experience', width: 40 },
      { header: 'Certifications', key: 'certifications', width: 40 },
      { header: 'Courses', key: 'courses', width: 40 },
      { header: 'LinkedIn', key: 'linkedin', width: 30 },
      { header: 'GitHub', key: 'github', width: 30 },
      { header: 'Portfolio', key: 'portfolio', width: 30 },
      { header: 'Resume', key: 'resume', width: 30 },
      { header: 'Sem 1 SGPA', key: 'sem1', width: 12 },
      { header: 'Sem 2 SGPA', key: 'sem2', width: 12 },
      { header: 'Sem 3 SGPA', key: 'sem3', width: 12 },
      { header: 'Sem 4 SGPA', key: 'sem4', width: 12 },
      { header: 'Sem 5 SGPA', key: 'sem5', width: 12 },
      { header: 'Sem 6 SGPA', key: 'sem6', width: 12 },
      { header: 'Sem 7 SGPA', key: 'sem7', width: 12 },
      { header: 'Sem 8 SGPA', key: 'sem8', width: 12 },
    ];

    const exportColumns = selectedColumns
      ? allColumns.filter((c) => selectedColumns.includes(c.key))
      : allColumns;

    sheet.columns = exportColumns;
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEDFE' } };

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    students.forEach((s) => {
      const sgpaMap = {};
      if (s.sgpaList) s.sgpaList.forEach((sg) => { sgpaMap[sg.semester] = sg.sgpa; });

      const row = {
        name: s.name, usn: s.usn, email: s.email, phone: s.phone,
        batch: s.batch, department: s.department,
        cgpa: s.cgpa, backlogs: s.backlogs || 0, activeBacklogs: s.activeBacklogs || 0,
        headline: s.headline || '',
        about: s.about || '',
        skills: s.skills?.join(', ') || '',
        projects: s.projects?.map((p) => `${p.title} (${p.techStack || ''})`).join('; ') || '',
        experience: s.experience?.map((e) => `${e.role} at ${e.company}`).join('; ') || '',
        certifications: s.certifications?.map((c) => `${c.title} - ${c.issuer}`).join('; ') || '',
        courses: s.courses?.map((c) => `${c.name} (${c.platform})`).join('; ') || '',
        linkedin: s.linkedinUrl || '',
        github: s.githubUrl || '',
        portfolio: s.portfolioUrl || '',
        resume: s.resumeUrl ? 'View Resume' : '',
        sem1: sgpaMap[1], sem2: sgpaMap[2], sem3: sgpaMap[3], sem4: sgpaMap[4],
        sem5: sgpaMap[5], sem6: sgpaMap[6], sem7: sgpaMap[7], sem8: sgpaMap[8],
      };
      const addedRow = sheet.addRow(row);

      if (s.resumeUrl) {
        const resumeColIndex = exportColumns.findIndex((c) => c.key === 'resume');
        if (resumeColIndex >= 0) {
          const cell = addedRow.getCell(resumeColIndex + 1);
          cell.value = { text: 'View Resume', hyperlink: `${baseUrl}${s.resumeUrl}` };
          cell.font = { color: { argb: 'FF4F46E5' }, underline: true };
        }
      }
      if (s.linkedinUrl) {
        const colIdx = exportColumns.findIndex((c) => c.key === 'linkedin');
        if (colIdx >= 0) {
          const cell = addedRow.getCell(colIdx + 1);
          cell.value = { text: 'LinkedIn', hyperlink: s.linkedinUrl };
          cell.font = { color: { argb: 'FF0A66C2' }, underline: true };
        }
      }
      if (s.githubUrl) {
        const colIdx = exportColumns.findIndex((c) => c.key === 'github');
        if (colIdx >= 0) {
          const cell = addedRow.getCell(colIdx + 1);
          cell.value = { text: 'GitHub', hyperlink: s.githubUrl };
          cell.font = { color: { argb: 'FF333333' }, underline: true };
        }
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=student_profiles.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const { batch, type } = req.query;
    const query = { role: 'student' };
    if (batch) query.batch = batch;
    if (type === 'verified') query.sentToAdmin = true;
    if (type === 'pending') query.sentToAdmin = { $ne: true };

    const students = await User.find(query).select('-password');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students');

    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'USN', key: 'usn', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Batch', key: 'batch', width: 10 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Verified', key: 'isVerified', width: 10 },
      { header: 'Sent to Admin', key: 'sentToAdmin', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEDFE' } };

    students.forEach((s) =>
      sheet.addRow({
        name: s.name, usn: s.usn, email: s.email, batch: s.batch,
        department: s.department, cgpa: s.cgpa, phone: s.phone,
        isVerified: s.isVerified ? 'Yes' : 'No',
        sentToAdmin: s.sentToAdmin ? 'Yes' : 'No',
      })
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${batch || 'all'}_students.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportStudentsList = async (req, res) => {
  try {
    const { batch, columns } = req.query;
    const selectedColumns = columns ? columns.split(',') : null;

    const query = { role: 'student' };
    if (batch) query.batch = batch;

    const students = await User.find(query).select('-password').sort({ batch: 1, usn: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students');

    const allColumns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'USN', key: 'usn', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Batch', key: 'batch', width: 10 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
      { header: 'Backlogs', key: 'backlogs', width: 10 },
      { header: 'Active Backlogs', key: 'activeBacklogs', width: 15 },
      { header: 'Sem 1 SGPA', key: 'sem1', width: 12 },
      { header: 'Sem 2 SGPA', key: 'sem2', width: 12 },
      { header: 'Sem 3 SGPA', key: 'sem3', width: 12 },
      { header: 'Sem 4 SGPA', key: 'sem4', width: 12 },
      { header: 'Sem 5 SGPA', key: 'sem5', width: 12 },
      { header: 'Sem 6 SGPA', key: 'sem6', width: 12 },
      { header: 'Sem 7 SGPA', key: 'sem7', width: 12 },
      { header: 'Sem 8 SGPA', key: 'sem8', width: 12 },
      { header: 'Resume', key: 'resume', width: 30 },
      { header: 'Status', key: 'verified', width: 10 },
    ];

    const exportColumns = selectedColumns
      ? allColumns.filter((c) => selectedColumns.includes(c.key))
      : allColumns;

    sheet.columns = exportColumns;
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEDFE' } };

    students.forEach((s) => {
      const sgpaMap = {};
      if (s.sgpaList) s.sgpaList.forEach((sg) => { sgpaMap[sg.semester] = sg.sgpa; });

      const row = {
        name: s.name, usn: s.usn, email: s.email, phone: s.phone,
        batch: s.batch, cgpa: s.cgpa, backlogs: s.backlogs || 0, activeBacklogs: s.activeBacklogs || 0,
        sem1: sgpaMap[1], sem2: sgpaMap[2], sem3: sgpaMap[3], sem4: sgpaMap[4],
        sem5: sgpaMap[5], sem6: sgpaMap[6], sem7: sgpaMap[7], sem8: sgpaMap[8],
        resume: s.resumeUrl ? 'View Resume' : 'Not uploaded',
        verified: s.sentToAdmin ? 'Received' : 'Pending',
      };
      const addedRow = sheet.addRow(row);

      // Make resume cell a clickable hyperlink
      if (s.resumeUrl) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const resumeColIndex = exportColumns.findIndex((c) => c.key === 'resume');
        if (resumeColIndex >= 0) {
          const cell = addedRow.getCell(resumeColIndex + 1);
          cell.value = { text: 'View Resume', hyperlink: `${baseUrl}${s.resumeUrl}` };
          cell.font = { color: { argb: 'FF4F46E5' }, underline: true };
        }
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=students_${batch || 'all'}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
