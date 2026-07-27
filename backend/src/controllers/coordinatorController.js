const User = require('../models/User');
const Form = require('../models/Form');
const Submission = require('../models/Submission');
const AllowedStudent = require('../models/AllowedStudent');
const ExcelJS = require('exceljs');

exports.getStudents = async (req, res) => {
  try {
    const { search } = req.query;
    const batch = req.user.assignedBatch;
    const query = { role: 'student', batch };
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { usn: new RegExp(search, 'i') },
      ];
    }
    const students = await User.find(query).select('-password').sort({ name: 1 });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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

exports.getDashboardStats = async (req, res) => {
  try {
    const batch = req.user.assignedBatch;
    const [totalStudents, totalForms, totalSubmissions, verifiedStudents] = await Promise.all([
      User.countDocuments({ role: 'student', batch }),
      Form.countDocuments({ batch }),
      Submission.countDocuments({ batch }),
      User.countDocuments({ role: 'student', batch, isVerified: true }),
    ]);
    const pendingStudents = totalStudents - verifiedStudents;
    res.json({ totalStudents, totalForms, totalSubmissions, verifiedStudents, pendingStudents, batch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createForm = async (req, res) => {
  try {
    const { title, description, fields, deadline } = req.body;
    const form = await Form.create({
      title,
      description,
      fields,
      deadline,
      batch: req.user.assignedBatch,
      createdBy: req.user._id,
    });
    res.status(201).json({ form });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getForms = async (req, res) => {
  try {
    const forms = await Form.find({ batch: req.user.assignedBatch }).sort({ createdAt: -1 });
    res.json({ forms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateForm = async (req, res) => {
  try {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!form) return res.status(404).json({ message: 'Form not found' });
    res.json({ form });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteForm = async (req, res) => {
  try {
    await Form.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    res.json({ message: 'Form deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const { formId } = req.query;
    const query = { batch: req.user.assignedBatch };
    if (formId) query.form = formId;

    const submissions = await Submission.find(query)
      .populate('student', 'name usn email cgpa phone')
      .populate('form', 'title fields')
      .sort({ createdAt: -1 });

    const students = await User.find({ role: 'student', batch: req.user.assignedBatch }).select('name usn');
    const submittedIds = new Set(submissions.map((s) => s.student?._id.toString()));
    const pending = students.filter((s) => !submittedIds.has(s._id.toString()));

    res.json({ submissions, pendingStudents: pending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      batch: req.user.assignedBatch,
    });
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const { responses, status, coordinatorNote } = req.body;
    if (responses) {
      const parsed = typeof responses === 'string' ? JSON.parse(responses) : responses;
      const responseMap = new Map();
      Object.entries(parsed).forEach(([k, v]) => responseMap.set(k, v));
      submission.responses = responseMap;
    }
    if (status) {
      submission.status = status;
      // When submission is verified, also mark the student as verified
      if (status === 'verified') {
        await User.findByIdAndUpdate(submission.student, { isVerified: true });
      }
    }
    if (coordinatorNote !== undefined) submission.coordinatorNote = coordinatorNote;

    await submission.save();
    res.json({ submission });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.verifyStudent = async (req, res) => {
  try {
    const { cgpa, note } = req.body;
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, batch: req.user.assignedBatch },
      { isVerified: true, cgpa },
      { new: true }
    ).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (note) {
      await Submission.updateMany({ student: req.params.id }, { coordinatorNote: note });
    }
    res.json({ student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.sendToAdmin = async (req, res) => {
  try {
    const { studentIds } = req.body;
    await User.updateMany(
      { _id: { $in: studentIds }, batch: req.user.assignedBatch },
      { sentToAdmin: true, isVerified: true }
    );
    res.json({ message: 'Students sent to admin successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.exportSubmissions = async (req, res) => {
  try {
    const { formId } = req.query;
    const query = { batch: req.user.assignedBatch };
    if (formId) query.form = formId;

    const submissions = await Submission.find(query)
      .populate('student', 'name usn email cgpa phone')
      .populate('form', 'title fields');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Submissions');

    // Build columns from form fields
    const baseColumns = [
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'USN', key: 'usn', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
    ];

    // Collect all unique field labels from submissions
    const fieldLabels = new Set();
    submissions.forEach((s) => {
      if (s.form?.fields) {
        s.form.fields.forEach((f) => fieldLabels.add(f.label));
      }
      if (s.responses) {
        for (const key of s.responses.keys()) {
          fieldLabels.add(key);
        }
      }
    });

    const fieldColumns = [...fieldLabels].map((label) => ({
      header: label, key: label, width: 20,
    }));

    sheet.columns = [...baseColumns, ...fieldColumns, { header: 'Status', key: 'status', width: 12 }];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEDFE' } };

    submissions.forEach((s) => {
      const row = {
        name: s.student?.name,
        usn: s.student?.usn,
        email: s.student?.email,
        phone: s.student?.phone,
        cgpa: s.student?.cgpa,
        status: s.status,
      };
      if (s.responses) {
        for (const [k, v] of s.responses) {
          const isUrl = typeof v === 'string' && (v.startsWith('http') || v.startsWith('/api/files/'));
          row[k] = isUrl ? 'View file' : String(v);
        }
      }
      const addedRow = sheet.addRow(row);

      // Make file URL cells clickable hyperlinks
      if (s.responses) {
        const allColumns = [...baseColumns, ...fieldColumns, { key: 'status' }];
        for (const [k, v] of s.responses) {
          const isUrl = typeof v === 'string' && (v.startsWith('http') || v.startsWith('/api/files/'));
          if (isUrl) {
            const colIdx = allColumns.findIndex((c) => c.key === k);
            if (colIdx >= 0) {
              const fullUrl = v.startsWith('/') ? `${req.protocol}://${req.get('host')}${v}` : v;
              const cell = addedRow.getCell(colIdx + 1);
              cell.value = { text: 'View file', hyperlink: fullUrl };
              cell.font = { color: { argb: 'FF4F46E5' }, underline: true };
            }
          }
        }
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=submissions_${req.user.assignedBatch}.xlsx`);
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
      { header: 'Marksheet', key: 'marksheet', width: 30 },
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
        resume: s.resumeUrl ? `${s.name} - Resume` : '',
        marksheet: s.marksheetUrl ? `${s.name} - Marksheet` : '',
        sem1: sgpaMap[1], sem2: sgpaMap[2], sem3: sgpaMap[3], sem4: sgpaMap[4],
        sem5: sgpaMap[5], sem6: sgpaMap[6], sem7: sgpaMap[7], sem8: sgpaMap[8],
      };
      const addedRow = sheet.addRow(row);

      if (s.resumeUrl) {
        const resumeColIndex = exportColumns.findIndex((c) => c.key === 'resume');
        if (resumeColIndex >= 0) {
          const cell = addedRow.getCell(resumeColIndex + 1);
          cell.value = { text: `${s.name || 'Student'} - Resume`, hyperlink: s.resumeUrl };
          cell.font = { color: { argb: 'FF4F46E5' }, underline: true };
        }
      }
      if (s.marksheetUrl) {
        const colIdx = exportColumns.findIndex((c) => c.key === 'marksheet');
        if (colIdx >= 0) {
          const cell = addedRow.getCell(colIdx + 1);
          cell.value = { text: `${s.name || 'Student'} - Marksheet`, hyperlink: s.marksheetUrl };
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
    const { type } = req.query;
    const batch = req.user.assignedBatch;
    const query = { role: 'student', batch };
    if (type === 'verified') query.isVerified = true;
    if (type === 'pending') query.isVerified = { $ne: true };

    const students = await User.find(query).select('-password');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Batch ${batch}`);

    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'USN', key: 'usn', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
      { header: 'Verified', key: 'isVerified', width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };
    students.forEach((s) =>
      sheet.addRow({
        name: s.name, usn: s.usn, email: s.email,
        phone: s.phone, cgpa: s.cgpa,
        isVerified: s.isVerified ? 'Yes' : 'No',
      })
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=batch_${batch}_${type || 'all'}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== Allowed Students (Whitelist) Management =====

exports.getAllowedStudents = async (req, res) => {
  try {
    const batch = req.user.assignedBatch;
    const students = await AllowedStudent.find({ batch }).sort({ usn: 1 });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addAllowedStudent = async (req, res) => {
  try {
    const { usn, name, email } = req.body;
    if (!usn) return res.status(400).json({ message: 'USN is required' });

    const existing = await AllowedStudent.findOne({ usn: usn.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'USN already in the list' });

    const student = await AllowedStudent.create({
      usn: usn.toUpperCase(),
      name,
      email,
      batch: req.user.assignedBatch,
      addedBy: req.user._id,
    });
    res.status(201).json({ student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.worksheets[0];

    const students = [];
    const errors = [];
    let rowNum = 0;

    sheet.eachRow((row, index) => {
      if (index === 1) return; // skip header
      rowNum++;
      const usn = row.getCell(1).value?.toString()?.trim()?.toUpperCase();
      const name = row.getCell(2).value?.toString()?.trim() || '';
      const email = row.getCell(3).value?.toString()?.trim() || '';

      if (!usn) {
        errors.push(`Row ${index}: USN is empty`);
        return;
      }
      students.push({ usn, name, email, batch: req.user.assignedBatch, addedBy: req.user._id });
    });

    let added = 0;
    let skipped = 0;
    for (const s of students) {
      try {
        await AllowedStudent.create(s);
        added++;
      } catch {
        skipped++;
      }
    }

    // Clean up uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({ message: `Uploaded: ${added} added, ${skipped} skipped (duplicates)`, added, skipped, errors });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAllowedStudent = async (req, res) => {
  try {
    await AllowedStudent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed from list' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAllowedStudent = async (req, res) => {
  try {
    const { usn, name, email } = req.body;
    const student = await AllowedStudent.findByIdAndUpdate(
      req.params.id,
      { usn: usn?.toUpperCase(), name, email },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getStudentFiles = async (req, res) => {
  try {
    const batch = req.user.assignedBatch;
    const students = await User.find({ role: 'student', batch })
      .select('name usn resumeUrl marksheetUrl semMarksheets certifications courses')
      .sort({ usn: 1 });

    const fileList = students.map((s) => ({
      usn: s.usn,
      name: s.name,
      resume: s.resumeUrl ? { label: `${s.name} - Resume`, url: s.resumeUrl } : null,
      marksheet: s.marksheetUrl ? { label: `${s.name} - Marksheet`, url: s.marksheetUrl } : null,
      semMarksheets: (s.semMarksheets || []).map((m) => ({
        label: `${s.name} - Sem ${m.semester} Marksheet`,
        url: m.url,
        semester: m.semester,
      })),
      certificates: [
        ...(s.certifications || []).filter((c) => c.url).map((c) => ({
          label: `${s.name} - ${c.title}`,
          url: c.url,
        })),
        ...(s.courses || []).filter((c) => c.certificateUrl).map((c) => ({
          label: `${s.name} - ${c.name} Certificate`,
          url: c.certificateUrl,
        })),
      ],
    }));

    res.json({ students: fileList });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.downloadStudentFilesZip = async (req, res) => {
  try {
    const JSZip = require('jszip');
    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
    const batch = req.user.assignedBatch;
    const { section } = req.query; // resume, marksheet, sem_1..8, certificates

    const students = await User.find({ role: 'student', batch })
      .select('name usn resumeUrl marksheetUrl semMarksheets certifications courses')
      .sort({ usn: 1 });

    const zip = new JSZip();
    const folderName = section || 'all-documents';
    const folder = zip.folder(folderName);
    let fileCount = 0;

    const downloadFile = async (url, filename) => {
      try {
        const fullUrl = url.startsWith('http') ? url : `${req.protocol}://${req.get('host')}${url}`;
        const response = await fetch(fullUrl);
        if (!response.ok) return;
        const buffer = await response.buffer();
        folder.file(filename, buffer);
        fileCount++;
      } catch (e) {
        // Skip failed files
      }
    };

    for (const s of students) {
      const safeName = s.usn || s.name;

      if (!section || section === 'resume') {
        if (s.resumeUrl) {
          const ext = s.resumeUrl.split('.').pop().split('?')[0] || 'pdf';
          await downloadFile(s.resumeUrl, `${safeName}_Resume.${ext}`);
        }
      }

      if (!section || section === 'marksheet') {
        if (s.marksheetUrl) {
          const ext = s.marksheetUrl.split('.').pop().split('?')[0] || 'pdf';
          await downloadFile(s.marksheetUrl, `${safeName}_Marksheet.${ext}`);
        }
      }

      if (!section || section.startsWith('sem_')) {
        for (const m of (s.semMarksheets || [])) {
          if (!section || section === `sem_${m.semester}`) {
            const ext = m.url.split('.').pop().split('?')[0] || 'pdf';
            await downloadFile(m.url, `${safeName}_Sem${m.semester}_Marksheet.${ext}`);
          }
        }
      }

      if (!section || section === 'certificates') {
        for (const c of (s.certifications || [])) {
          if (c.url) {
            const ext = c.url.split('.').pop().split('?')[0] || 'pdf';
            const title = c.title?.replace(/[^a-z0-9]/gi, '_') || 'Certificate';
            await downloadFile(c.url, `${safeName}_${title}.${ext}`);
          }
        }
        for (const c of (s.courses || [])) {
          if (c.certificateUrl) {
            const ext = c.certificateUrl.split('.').pop().split('?')[0] || 'pdf';
            const name = c.name?.replace(/[^a-z0-9]/gi, '_') || 'Course';
            await downloadFile(c.certificateUrl, `${safeName}_${name}_Cert.${ext}`);
          }
        }
      }
    }

    if (fileCount === 0) {
      return res.status(404).json({ message: 'No files found for this section' });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=batch_${batch}_${folderName}.zip`);
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== Updated Student List (auto-synced from profiles) =====

exports.getUpdatedStudentList = async (req, res) => {
  try {
    const batch = req.user.assignedBatch;
    const students = await User.find({ role: 'student', batch }).select(
      'name usn email phone cgpa sgpaList backlogs activeBacklogs batch department isVerified sentToAdmin resumeUrl marksheetUrl updatedAt'
    ).sort({ usn: 1 });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportUpdatedStudentList = async (req, res) => {
  try {
    const batch = req.user.assignedBatch;
    const { columns } = req.query;
    const selectedColumns = columns ? columns.split(',') : null;

    const students = await User.find({ role: 'student', batch }).select('-password').sort({ usn: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Updated List - Batch ${batch}`);

    // All available columns
    const allColumns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'USN', key: 'usn', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
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

    // Filter columns if specified
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
        cgpa: s.cgpa, backlogs: s.backlogs || 0, activeBacklogs: s.activeBacklogs || 0,
        sem1: sgpaMap[1], sem2: sgpaMap[2], sem3: sgpaMap[3], sem4: sgpaMap[4],
        sem5: sgpaMap[5], sem6: sgpaMap[6], sem7: sgpaMap[7], sem8: sgpaMap[8],
        resume: s.resumeUrl ? `${s.name} - Resume` : 'Not uploaded',
        verified: s.isVerified ? 'Yes' : 'No',
      };
      const addedRow = sheet.addRow(row);

      // Make resume cell a clickable hyperlink
      if (s.resumeUrl) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const resumeColIndex = exportColumns.findIndex((c) => c.key === 'resume');
        if (resumeColIndex >= 0) {
          const cell = addedRow.getCell(resumeColIndex + 1);
          cell.value = { text: `${s.name} - Resume`, hyperlink: `${baseUrl}${s.resumeUrl}` };
          cell.font = { color: { argb: 'FF4F46E5' }, underline: true };
        }
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=updated_list_batch_${batch}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
