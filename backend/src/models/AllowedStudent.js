const mongoose = require('mongoose');

const allowedStudentSchema = new mongoose.Schema(
  {
    usn: { type: String, required: true, uppercase: true, unique: true },
    name: { type: String },
    email: { type: String },
    batch: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AllowedStudent', allowedStudentSchema);
