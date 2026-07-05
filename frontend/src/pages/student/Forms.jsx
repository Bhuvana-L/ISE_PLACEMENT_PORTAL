import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, Pencil, X } from 'lucide-react';

function DynamicFormField({ field, value, onChange }) {
  const { label, type, required, options } = field;
  const inputClass = 'input';

  if (type === 'textarea') return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <textarea className={inputClass} rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
  if (type === 'dropdown') return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <select className={inputClass} value={value || ''} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  if (type === 'radio') return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <div className="space-y-1.5 mt-1">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name={label} value={o} checked={value === o} onChange={() => onChange(o)} required={required} />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
  if (type === 'file') return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input type="file" className={inputClass} onChange={(e) => onChange(e.target.files[0])} required={required && !value} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
      {typeof value === 'string' && value && (
        <p className="text-xs text-green-600 mt-1">Previously uploaded file exists</p>
      )}
    </div>
  );
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input type={type} className={inputClass} value={value || ''} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

export default function StudentForms() {
  const [forms, setForms] = useState([]);
  const [activeForm, setActiveForm] = useState(null);
  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    api.get('/student/forms').then(({ data }) => setForms(data.forms));
  }, []);

  const isBeforeDeadline = (deadline) => {
    if (!deadline) return true;
    // Include the full deadline day (end of day)
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(23, 59, 59, 999);
    return deadlineDate >= new Date();
  };

  const openForm = async (f, editing = false) => {
    const { data } = await api.get(`/student/forms/${f._id}`);
    setActiveForm(data.form);
    setFormData(data.form);
    setIsEditing(editing);

    if (editing && data.submission) {
      // Pre-fill responses from existing submission
      const existingResponses = {};
      if (data.submission.responses) {
        Object.entries(data.submission.responses).forEach(([k, v]) => {
          existingResponses[k] = v;
        });
      }
      setResponses(existingResponses);
    } else {
      setResponses({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      const textResponses = {};
      Object.entries(responses).forEach(([k, v]) => {
        if (v instanceof File) {
          fd.append(k, v);  // file fields sent by their label name
        } else {
          textResponses[k] = v;
        }
      });
      fd.append('responses', JSON.stringify(textResponses));

      if (isEditing) {
        await api.put(`/student/forms/${activeForm._id}/submit`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Submission updated successfully!');
      } else {
        await api.post(`/student/forms/${activeForm._id}/submit`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Form submitted successfully!');
      }

      setActiveForm(null);
      setIsEditing(false);
      api.get('/student/forms').then(({ data }) => setForms(data.forms));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
        <p className="text-gray-500 text-sm mt-1">Forms assigned to your batch</p>
      </div>

      {forms.length === 0 && (
        <div className="card text-center py-16 text-gray-400">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p>No forms available for your batch yet</p>
        </div>
      )}

      <div className="space-y-3">
        {forms.map((f) => (
          <div key={f._id} className="card flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{f.title}</p>
                {f.submitted
                  ? <span className="badge-green flex items-center gap-1"><CheckCircle size={12} /> Submitted</span>
                  : <span className="badge-yellow">Pending</span>}
              </div>
              {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
              {f.deadline && <p className="text-xs text-red-500 mt-0.5">Due {new Date(f.deadline).toLocaleDateString()}</p>}
            </div>
            <div className="flex items-center gap-2">
              {!f.submitted ? (
                <button onClick={() => openForm(f)} className="btn-primary text-sm">Fill form</button>
              ) : f.submitted && isBeforeDeadline(f.deadline) ? (
                <button onClick={() => openForm(f, true)} className="btn-secondary text-sm flex items-center gap-1">
                  <Pencil size={14} /> Edit
                </button>
              ) : (
                <span className="text-gray-400 text-sm">Done</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-lg">{activeForm.title}</h2>
                {activeForm.description && <p className="text-sm text-gray-500 mt-0.5">{activeForm.description}</p>}
                {isEditing && <p className="text-xs text-indigo-600 mt-1 font-medium">Editing your submission</p>}
              </div>
              <button onClick={() => { setActiveForm(null); setIsEditing(false); }} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeForm.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <DynamicFormField
                    key={field._id}
                    field={field}
                    value={responses[field.label]}
                    onChange={(v) => setResponses({ ...responses, [field.label]: v })}
                  />
                ))}
              <div className="flex gap-3 pt-3">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update submission' : 'Submit form')}
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={() => { setActiveForm(null); setIsEditing(false); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
