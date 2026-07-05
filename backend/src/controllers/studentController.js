const User = require('../models/User');
const Form = require('../models/Form');
const Submission = require('../models/Submission');
const path = require('path');
const getFileUrl = require('../utils/getFileUrl');

exports.getForms = async (req, res) => {
  try {
    const forms = await Form.find({ batch: req.user.batch, isOpen: true }).sort({ createdAt: -1 });
    const submittedForms = await Submission.find({ student: req.user._id }).select('form');
    const submittedIds = new Set(submittedForms.map((s) => s.form.toString()));
    const formsWithStatus = forms.map((f) => ({
      ...f.toObject(),
      submitted: submittedIds.has(f._id.toString()),
    }));
    res.json({ forms: formsWithStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getForm = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, batch: req.user.batch, isOpen: true });
    if (!form) return res.status(404).json({ message: 'Form not found' });
    const existing = await Submission.findOne({ form: req.params.id, student: req.user._id });
    res.json({ form, submission: existing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitForm = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, batch: req.user.batch, isOpen: true });
    if (!form) return res.status(404).json({ message: 'Form not found or closed' });

    if (form.deadline) {
      const deadlineEnd = new Date(form.deadline);
      deadlineEnd.setHours(23, 59, 59, 999);
      if (deadlineEnd < new Date()) {
        return res.status(400).json({ message: 'Deadline has passed' });
      }
    }

    const existing = await Submission.findOne({ form: req.params.id, student: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already submitted. Use edit instead.' });

    const responses = new Map();
    if (req.body.responses) {
      const parsed = typeof req.body.responses === 'string'
        ? JSON.parse(req.body.responses)
        : req.body.responses;
      Object.entries(parsed).forEach(([k, v]) => responses.set(k, v));
    }

    // Upload files to Supabase and store URLs in responses (so coordinator can see them)
    if (req.files) {
      for (const file of req.files) {
        const url = await getFileUrl(file, req.user._id, req.user.name);
        if (url) responses.set(file.fieldname, url);
      }
    }

    const submission = await Submission.create({
      form: req.params.id,
      student: req.user._id,
      batch: req.user.batch,
      responses,
    });

    res.status(201).json({ submission });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, batch: req.user.batch, isOpen: true });
    if (!form) return res.status(404).json({ message: 'Form not found or closed' });

    if (form.deadline) {
      const deadlineEnd = new Date(form.deadline);
      deadlineEnd.setHours(23, 59, 59, 999);
      if (deadlineEnd < new Date()) {
        return res.status(400).json({ message: 'Deadline has passed. Cannot edit.' });
      }
    }

    const existing = await Submission.findOne({ form: req.params.id, student: req.user._id });
    if (!existing) return res.status(404).json({ message: 'No submission found to edit' });

    const responses = new Map();
    if (req.body.responses) {
      const parsed = typeof req.body.responses === 'string'
        ? JSON.parse(req.body.responses)
        : req.body.responses;
      Object.entries(parsed).forEach(([k, v]) => responses.set(k, v));
    }

    // Upload new files to Supabase and store URLs in responses
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await getFileUrl(file, req.user._id, req.user.name);
        if (url) responses.set(file.fieldname, url);
      }
    }

    existing.responses = responses;
    existing.status = 'submitted';
    await existing.save();

    res.json({ submission: existing });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate('form', 'title batch')
      .sort({ createdAt: -1 });
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ student: req.user.toSafeObject() });
};

exports.updateProfile = async (req, res) => {
  try {
    const { phone, sgpaList, headline, about, skills, projects, certifications, education, experience, linkedinUrl, githubUrl, portfolioUrl, backlogs, activeBacklogs, courses } = req.body;
    const updates = {};

    if (phone !== undefined) updates.phone = phone;
    if (headline !== undefined) updates.headline = headline;
    if (about !== undefined) updates.about = about;
    if (skills !== undefined) updates.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    if (projects !== undefined) updates.projects = typeof projects === 'string' ? JSON.parse(projects) : projects;
    if (certifications !== undefined) updates.certifications = typeof certifications === 'string' ? JSON.parse(certifications) : certifications;
    if (education !== undefined) updates.education = typeof education === 'string' ? JSON.parse(education) : education;
    if (experience !== undefined) updates.experience = typeof experience === 'string' ? JSON.parse(experience) : experience;
    if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
    if (githubUrl !== undefined) updates.githubUrl = githubUrl;
    if (portfolioUrl !== undefined) updates.portfolioUrl = portfolioUrl;
    if (backlogs !== undefined) updates.backlogs = typeof backlogs === 'string' ? parseInt(backlogs) : backlogs;
    if (activeBacklogs !== undefined) updates.activeBacklogs = typeof activeBacklogs === 'string' ? parseInt(activeBacklogs) : activeBacklogs;
    if (courses !== undefined) updates.courses = typeof courses === 'string' ? JSON.parse(courses) : courses;

    if (sgpaList) {
      const parsedSgpa = typeof sgpaList === 'string' ? JSON.parse(sgpaList) : sgpaList;
      if (parsedSgpa.length > 0) {
        updates.sgpaList = parsedSgpa;
        // Auto-calculate CGPA from SGPA: Σ(SGPAᵢ × Creditsᵢ) / ΣCreditsᵢ
        const totalWeighted = parsedSgpa.reduce((sum, s) => sum + s.sgpa * s.credits, 0);
        const totalCredits = parsedSgpa.reduce((sum, s) => sum + s.credits, 0);
        if (totalCredits > 0) {
          updates.cgpa = +(totalWeighted / totalCredits).toFixed(4);
        }
      }
    }

    // Manual CGPA override — takes priority over auto-calculation if explicitly set
    const manualCgpaRaw = req.body.cgpa;
    if (manualCgpaRaw !== undefined && manualCgpaRaw !== '' && manualCgpaRaw !== 'undefined') {
      const manualCgpa = parseFloat(manualCgpaRaw);
      if (!isNaN(manualCgpa) && manualCgpa > 0) {
        updates.cgpa = manualCgpa;
      }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await getFileUrl(file, req.user._id, req.user.name);
        if (file.fieldname === 'resume') updates.resumeUrl = url;
        if (file.fieldname === 'marksheet') updates.marksheetUrl = url;
        // Handle semester marksheets (marksheet_1, marksheet_2, etc.)
        const semMatch = file.fieldname.match(/^marksheet_(\d+)$/);
        if (semMatch) {
          if (!updates.semMarksheets) {
            updates.semMarksheets = req.user.semMarksheets ? [...req.user.semMarksheets] : [];
          }
          const sem = parseInt(semMatch[1]);
          const existingIdx = updates.semMarksheets.findIndex((m) => m.semester === sem);
          if (existingIdx >= 0) {
            updates.semMarksheets[existingIdx].url = url;
          } else {
            updates.semMarksheets.push({ semester: sem, url });
          }
        }
      }
    }

    const student = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.uploadMarksheet = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = await getFileUrl(req.file, req.user._id, req.user.name);
    await User.findByIdAndUpdate(req.user._id, { marksheetUrl: url });
    res.json({ url, message: 'Marksheet uploaded successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    if (!await user.comparePassword(password)) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Delete submissions
    const Submission = require('../models/Submission');
    await Submission.deleteMany({ student: req.user._id });

    // Mark as unregistered in allowed list
    const AllowedStudent = require('../models/AllowedStudent');
    await AllowedStudent.updateOne({ usn: user.usn }, { registered: false });

    // Delete user
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
