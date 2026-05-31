const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  techStack: { type: String },
  link: { type: String },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'coordinator', 'student'], required: true },

    // Coordinator fields
    assignedBatch: { type: String },

    // Student fields
    usn: { type: String, sparse: true, uppercase: true },
    department: { type: String, default: 'ISE' },
    batch: { type: String },
    phone: { type: String },
    cgpa: { type: Number },
    sgpaList: [
      {
        semester: Number,
        sgpa: Number,
        credits: Number,
      },
    ],
    resumeUrl: { type: String },
    marksheetUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    sentToAdmin: { type: Boolean, default: false },

    // LinkedIn-style profile fields
    headline: { type: String },
    about: { type: String },
    skills: [String],
    projects: [projectSchema],
    certifications: [{ title: String, issuer: String, date: String, url: String }],
    education: [{ institution: String, degree: String, year: String, grade: String }],
    experience: [{ company: String, role: String, duration: String, description: String }],
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    portfolioUrl: { type: String },

    // Academic tracking
    backlogs: { type: Number, default: 0 },
    activeBacklogs: { type: Number, default: 0 },
    courses: [{ name: String, platform: String, certificateUrl: String, completedDate: String }],
    semMarksheets: [{ semester: Number, url: String }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
