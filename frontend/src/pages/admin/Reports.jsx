import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Download, Pencil, CheckCircle, X } from 'lucide-react';

export default function AdminReports() {
  const [submissions, setSubmissions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editResponses, setEditResponses] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setBatches(data.batches || []));
  }, []);

  const fetchSubmissions = () => {
    const params = new URLSearchParams();
    if (selectedBatch) params.set('batch', selectedBatch);
    api.get(`/admin/submissions?${params}`).then(({ data }) => setSubmissions(data.submissions));
  };

  useEffect(() => { fetchSubmissions(); }, [selectedBatch]);

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
      await api.put(`/admin/submissions/${editModal._id}`, { responses: editResponses });
      toast.success('Submission updated');
      setEditModal(null);
      fetchSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (selectedBatch) params.set('batch', selectedBatch);
    try {
      const response = await api.get(`/admin/export/submissions?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'admin_submissions.xlsx');
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
          <h1 className="text-2xl font-bold text-gray-900">Student Submissions</h1>
          <p className="text-gray-500 text-sm mt-1">Students sent by coordinators — {submissions.length} total</p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2 text-sm">
          <Download size={15} /> Export Excel
        </button>
      </div>

      <div>
        <label className="label">Filter by batch</label>
        <select className="input w-auto" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
          <option value="">All batches</option>
          {batches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Submissions Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Student</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">USN</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Batch</th>
              {fieldLabels.map((label) => (
                <th key={label} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{label}</th>
              ))}
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {submissions.length === 0 && (
              <tr><td colSpan={fieldLabels.length + 5} className="text-center py-10 text-gray-400">No submissions sent to admin yet</td></tr>
            )}
            {submissions.map((s) => {
              const responses = getResponses(s);
              return (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.student?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.student?.usn}</td>
                  <td className="px-4 py-3"><span className="badge-blue">{s.student?.batch}</span></td>
                  {fieldLabels.map((label) => {
                    const val = responses[label];
                    const isUrl = typeof val === 'string' && (val.startsWith('http') || val.startsWith('/api/files/'));
                    return (
                      <td key={label} className="px-4 py-3 text-gray-700 max-w-48">
                        {isUrl
                          ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs flex items-center gap-1">View file</a>
                          : <span className="truncate block">{val || '—'}</span>
                        }
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    {s.status === 'verified'
                      ? <span className="badge-green">Verified</span>
                      : <span className="badge-yellow">{s.status}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
