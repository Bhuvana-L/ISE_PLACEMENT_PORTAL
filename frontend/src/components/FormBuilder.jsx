import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text input' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Text area' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'file', label: 'File upload' },
];

export default function FormBuilder({ fields, onChange }) {
  const addField = () => {
    onChange([
      ...fields,
      { label: '', type: 'text', required: false, options: [], order: fields.length },
    ]);
  };

  const updateField = (index, updates) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addOption = (index) => {
    const f = fields[index];
    updateField(index, { options: [...(f.options || []), ''] });
  };

  const updateOption = (fieldIndex, optIndex, val) => {
    const opts = [...fields[fieldIndex].options];
    opts[optIndex] = val;
    updateField(fieldIndex, { options: opts });
  };

  const removeOption = (fieldIndex, optIndex) => {
    const opts = fields[fieldIndex].options.filter((_, i) => i !== optIndex);
    updateField(fieldIndex, { options: opts });
  };

  return (
    <div className="space-y-3">
      {fields.map((field, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-gray-400 cursor-grab" />
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="Field label"
                value={field.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                required
              />
              <select
                className="input"
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value, options: [] })}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(i, { required: e.target.checked })}
                className="rounded"
              />
              Required
            </label>
            <button
              type="button"
              onClick={() => removeField(i)}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
            >
              <Trash2 size={15} />
            </button>
          </div>

          {(field.type === 'dropdown' || field.type === 'radio') && (
            <div className="ml-6 space-y-2">
              <p className="text-xs text-gray-500 font-medium">Options</p>
              {(field.options || []).map((opt, oi) => (
                <div key={oi} className="flex gap-2">
                  <input
                    className="input text-sm"
                    value={opt}
                    placeholder={`Option ${oi + 1}`}
                    onChange={(e) => updateOption(i, oi, e.target.value)}
                  />
                  <button type="button" onClick={() => removeOption(i, oi)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(i)}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Add option
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add field
      </button>
    </div>
  );
}
