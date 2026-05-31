import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, Download, Pencil, Send, X, ExternalLink } from 'lucide-react';

export default function CoordSubmissions() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [pending, setPending] = useState([]);
  const [editModal, setEditModal] = useState(null);
  const [editResponses, setEditResponses] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/coordinator/forms').then(({ data }) => setForms(data.forms));
  }, []);

  const fetchSubmissions = () => {
    const params = new URLSearchParams();
    if (selectedForm) params.set('formId', selectedForm);
    api.get(`/coordinator/submissions?${params}`).then(({ data }) => {
      setSubmissions(data.submissions);
      setPending(data.pendingStudents);
    });
  };

  useEffect(() => { fetchSubmissions(); }, [selectedForm]);

  const getFieldLabels = () => {
    const labels = new Set();
    submissions.forEach((s) => {
      if (s.form?.fields) s.form.fields.forEach((f) => labels.add(f.label));
      if (s.responses) {
        const resp = s.responses instanceof Map ? Object.fromEntries(s.responses) : s.responses;
        Object.keys(resp).forEach((k) => labels.add(k));
      }
    });
    return [...labels];
  };

  const getResponses = (s) => {
    if (!s.responses) return {};
    return s.responses instanceof Map ? Object.fromEntries(s.responses) : s.responses;
  };

  const openEdit = (sub) => {
    const responses = getResponses(sub);
    setEditResponses(responses);
    setEditModal(sub);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/coordinator/submissions/${editModal._id}`, { responses: editResponses });
      toast.success('Submission updated');
      setEditModal(null);
      fetchSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (sub) => {
    try {
      await api.put(`/coordinator/submissions/${sub._id}`, { status: 'verified' });
      toast.success('Submission verified');
      fetchSubmissions();
    } catch (err) {
      toast.error('Failed to verify');
    }
  };

  const handleVerifyAll = async () => {
    const unverified = submissions.filter((s) => s.status !== 'verified');
    if (unverified.length === 0) return toast.error('All submissions already verified');
    try {
      await Promise.all(unverified.map((s) => api.put(`/coordinator/submissions/${s._id}`, { status: 'verified' })));
      toast.success(`${unverified.length} submission(s) verified`);
      fetchSubmissions();
    } catch (err) {
      toast.error('Failed to verify all');
    }
  };

  const handleSendToAdmin = async () => {
    const verifiedStudentIds = [...new Set(
      submissions.filter((s) => s.status === 'verified').map((s) => s.student?._id)
    )];
    if (verifiedStudentIds.length === 0) return toast.error('No verified submissions to send');
    try {
      await api.post('/coordinator/students/send-to-admin', { studentIds: verifiedStudentIds });
      toast.success('Sent to admin!');
      fetchSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (selectedForm) params.set('formId', selectedForm);
    try {
      const response = await api.get(`/coordinator/export/submissions?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'submissions.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const fieldLabels = getFieldLabels();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-gray-500 text-sm mt-1">View, edit, verify and export submissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleVerifyAll} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCircle size={15} /> Verify All
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Export Excel
          </button>
          <button onClick={handleSendToAdmin} className="btn-primary flex items-center gap-2 text-sm">
            <Send size={15} /> Send verified to Admin
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
          <CheckCircle size={16} /> <span className="font-medium">{submissions.length} submitted</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg">
          <Clock size={16} /> <span className="font-medium">{pending.length} pending</span>
        </div>
      </div>

      <div>
        <label className="label">Filter by form</label>
        <select className="input w-auto" value={selectedForm} onChange={(e) => setSelectedForm(e.target.value)}>
          <option value="">All forms</option>
          {forms.map((f) => <option key={f._id} value={f._id}>{f.title}</option>)}
        </select>
      </div>

      {/* Submissions Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Student</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">USN</th>
              {fieldLabels.map((label) => (
                <th key={label} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{label}</th>
              ))}
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {submissions.length === 0 && (
              <tr><td colSpan={fieldLabels.length + 4} className="text-center py-10 text-gray-400">No submissions yet</td></tr>
            )}
            {submissions.map((s) => {
              const responses = getResponses(s);
              return (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.student?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.student?.usn}</td>
                  {fieldLabels.map((label) => (
                    <td key={label} className="px-4 py-3 text-gray-700 max-w-48 truncate">{responses[label] || '—'}</td>
                  ))}
                  <td className="px-4 py-3">
                    {s.status === 'verified'
                      ? <span className="badge-green">Verified</span>
                      : s.status === 'rejected'
                      ? <span className="badge-red">Rejected</span>
                      : <span className="badge-yellow">Submitted</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                        <Pencil size={14} />
                      </button>
                      {s.status !== 'verified' && (
                        <button onClick={() => handleVerify(s)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Verify">
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pending students */}
      {pending.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock size={16} className="text-yellow-600" /> Pending ({pending.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {pending.map((s) => (
              <div key={s._id} className="bg-yellow-50 rounded-lg px-3 py-2 text-sm">
                <p className="font-medium text-yellow-900">{s.name}</p>
                <p className="text-xs text-yellow-700">{s.usn}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-lg">Edit Submission</h2>
                <p className="text-sm text-gray-500">{editModal.student?.name} — {editModal.student?.usn}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {fieldLabels.map((label) => (
                <div key={label}>
                  <label className="label">{label}</label>
                  <input
                    className="input"
                    value={editResponses[label] || ''}
                    onChange={(e) => setEditResponses({ ...editResponses, [label]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={handleSaveEdit} className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
