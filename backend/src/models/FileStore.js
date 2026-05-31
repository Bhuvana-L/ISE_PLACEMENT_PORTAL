const mongoose = require('mongoose');

const fileStoreSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    data: { type: Buffer, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FileStore', fileStoreSchema);
