const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    form: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batch: { type: String, required: true },
    responses: { type: Map, of: mongoose.Schema.Types.Mixed },
    fileUrls: { type: Map, of: String },
    status: {
      type: String,
      enum: ['submitted', 'verified', 'rejected'],
      default: 'submitted',
    },
    coordinatorNote: { type: String },
  },
  { timestamps: true }
);

submissionSchema.index({ form: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
