const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'email', 'number', 'dropdown', 'radio', 'file', 'textarea'],
    required: true,
  },
  options: [String],
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const formSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    batch: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fields: [fieldSchema],
    isOpen: { type: Boolean, default: true },
    deadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Form', formSchema);
