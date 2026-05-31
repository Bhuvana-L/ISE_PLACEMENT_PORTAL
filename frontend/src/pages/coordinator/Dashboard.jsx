import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Users, FileText, CheckCircle, Clock, Download, Upload, Plus, Trash2, X, RefreshCw, Search, Pencil } from 'lucide-react';

export default function CoordDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('overview'); // overview, batchStudents, updatedList
  const [allowedStudents, setAllowedStudents] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [newUsn, setNewUsn] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');

  useEffect(() => {
    api.get('/coordinator/stats').then(({ data }) => setStats(data));
  }, []);

  useEffect(() => {
    if (tab === 'batchStudents') {
      api.get('/coordinator/allowed-students').then(({ data }) => setAllowedStudents(data.students));
    }
  }, [tab]);

  const handleAddStudent = async () => {
    if (!newUsn) return toast.error('USN is required');
    try {
      await api.post('/coordinator/allowed-students', { usn: newUsn, name: newName, email: newEmail });
      toast.success('Student added');
      setNewUsn(''); setNewName(''); setNewEmail('');
      setAddModal(false);
      api.get('/coordinator/allowed-students').then(({ data }) => setAllowedStudents(data.students));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return toast.error('Select an Excel file');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', bulkFile);
      const { data } = await api.post('/coordinator/allowed-students/bulk', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message);
      setBulkFile(null);
      api.get('/coordinator/allowed-students').then(({ data }) => setAllowedStudents(data.students));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAllowed = async (id) => {
    try {
      await api.delete(`/coordinator/allowed-students/${id}`);
      setAllowedStudents(allowedStudents.filter((s) => s._id !== id));
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleDeleteAllAllowed = async () => {
    if (!confirm(`Delete all ${allowedStudents.length} students from the list?`)) return;
    try {
      await Promise.all(allowedStudents.map((s) => api.delete(`/coordinator/allowed-students/${s._id}`)));
      setAllowedStudents([]);
      toast.success('All students removed');
    } catch {
      toast.error('Failed to delete all');
    }
  };

  const [editStudent, setEditStudent] = useState(null);
  const [editUsn, setEditUsn] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const openEditStudent = (s) => {
    setEditStudent(s);
    setEditUsn(s.usn || '');
    setEditName(s.name || '');
    setEditEmail(s.email || '');
  };

  const handleEditStudent = async () => {
    try {
      await api.put(`/coordinator/allowed-students/${editStudent._id}`, { usn: editUsn, name: editName, email: editEmail });
      toast.success('Updated');
      setEditStudent(null);
      api.get('/coordinator/allowed-students').then(({ data }) => setAllowedStudents(data.students));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const statCards = stats
    ? [
        { label: 'Total students', value: stats.totalStudents, icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: 'Submissions', value: stats.totalSubmissions, icon: FileText, color: 'bg-purple-50 text-purple-600' },
        { label: 'Verified', value: stats.verifiedStudents, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
        { label: 'Pending', value: stats.pendingStudents, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Managing batch {user?.assignedBatch}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'batchStudents', label: `${user?.assignedBatch || ''} Students` },
          { key: 'updatedList', label: 'Updated Student List' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="card flex items-center gap-4">
                <div className={`p-3 rounded-xl ${s.color}`}><s.icon size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold mb-4">Quick actions</h2>
              <div className="space-y-2">
                {[
                  { to: '/coordinator/forms', icon: FileText, label: 'Create / manage forms' },
                  { to: '/coordinator/submissions', icon: CheckCircle, label: 'Track submissions' },
                  { to: '/coordinator/students', icon: Users, label: 'Verify students' },
                ].map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <Icon size={18} className="text-indigo-500" />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="font-semibold mb-4">Batch Management</h2>
              <div className="space-y-2">
                <button onClick={() => setTab('batchStudents')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition w-full text-left">
                  <Users size={18} className="text-blue-500" />
                  <span className="text-sm font-medium">{user?.assignedBatch} Students (Add/Upload)</span>
                </button>
                <button onClick={() => setTab('updatedList')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition w-full text-left">
                  <RefreshCw size={18} className="text-green-500" />
                  <span className="text-sm font-medium">Updated Student List (Auto-synced)</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Batch Students Tab */}
      {tab === 'batchStudents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Batch {user?.assignedBatch} — Allowed Students</h2>
              <p className="text-sm text-gray-500">{allowedStudents.length} students in the list. Only these USNs can register.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteAllAllowed} className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition font-medium text-sm flex items-center gap-2">
                <Trash2 size={15} /> Delete All
              </button>
              <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={15} /> Add Student
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name or USN..." value={batchSearch} onChange={(e) => setBatchSearch(e.target.value)} />
          </div>

          {/* Bulk Upload */}
          <div className="card bg-indigo-50 border border-indigo-100">
            <h3 className="font-medium text-indigo-900 mb-2 flex items-center gap-2"><Upload size={16} /> Bulk Upload</h3>
            <p className="text-xs text-indigo-700 mb-3">Upload an Excel file with columns: USN, Name, Email (header row required)</p>
            <div className="flex gap-3 items-center">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setBulkFile(e.target.files[0])} className="input flex-1 text-sm" />
              <button onClick={handleBulkUpload} disabled={uploading || !bulkFile} className="btn-primary text-sm">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['USN', 'Name', 'Email', 'Registered', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allowedStudents.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">No students added yet. Add individually or bulk upload.</td></tr>
                )}
                {allowedStudents
                  .filter((s) => {
                    if (!batchSearch) return true;
                    const q = batchSearch.toLowerCase();
                    return (s.usn?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q));
                  })
                  .map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">{s.usn}</td>
                    <td className="px-4 py-3 text-gray-700">{s.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
                    <td className="px-4 py-3">
                      {s.registered ? <span className="badge-green">Yes</span> : <span className="badge-yellow">No</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEditStudent(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteAllowed(s._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Updated Student List Tab */}
      {tab === 'updatedList' && (
        <UpdatedStudentList user={user} />
      )}

      {/* Add Student Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Add Student</h2>
              <button onClick={() => setAddModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div>
              <label className="label">USN *</label>
              <input className="input uppercase" value={newUsn} onChange={(e) => setNewUsn(e.target.value)} placeholder="1IS21IS001" />
            </div>
            <div>
              <label className="label">Name (optional)</label>
              <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Student name" />
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="student@email.com" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddStudent} className="btn-primary flex-1">Add</button>
              <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Edit Student</h2>
              <button onClick={() => setEditStudent(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div>
              <label className="label">USN</label>
              <input className="input uppercase" value={editUsn} onChange={(e) => setEditUsn(e.target.value)} />
            </div>
            <div>
              <label className="label">Name</label>
              <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleEditStudent} className="btn-primary flex-1">Save</button>
              <button onClick={() => setEditStudent(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Updated Student List Sub-Component =====
function UpdatedStudentList({ user }) {
  const [students, setStudents] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allColumns = [
    { key: 'name', label: 'Name' },
    { key: 'usn', label: 'USN' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'cgpa', label: 'CGPA' },
    { key: 'backlogs', label: 'Backlogs' },
    { key: 'activeBacklogs', label: 'Active Backlogs' },
    { key: 'sem1', label: 'Sem 1 SGPA' },
    { key: 'sem2', label: 'Sem 2 SGPA' },
    { key: 'sem3', label: 'Sem 3 SGPA' },
    { key: 'sem4', label: 'Sem 4 SGPA' },
    { key: 'sem5', label: 'Sem 5 SGPA' },
    { key: 'sem6', label: 'Sem 6 SGPA' },
    { key: 'sem7', label: 'Sem 7 SGPA' },
    { key: 'sem8', label: 'Sem 8 SGPA' },
    { key: 'resume', label: 'Resume' },
    { key: 'verified', label: 'Status' },
  ];

  const [selectedColumns, setSelectedColumns] = useState(allColumns.map((c) => c.key));

  useEffect(() => {
    api.get('/coordinator/updated-list').then(({ data }) => setStudents(data.students));
  }, []);

  const toggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => setSelectedColumns(allColumns.map((c) => c.key));
  const deselectAll = () => setSelectedColumns([]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.set('columns', selectedColumns.join(','));
      const response = await api.get(`/coordinator/export/updated-list?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `updated_list_batch_${user?.assignedBatch}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
      toast.success('Exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Updated Student List</h2>
          <p className="text-sm text-gray-500">Auto-synced from student profiles — SGPA, CGPA, backlogs updated in real-time</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => api.get('/coordinator/updated-list').then(({ data }) => setStudents(data.students))} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={() => setShowExportModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search by name or USN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'USN', 'Email', 'CGPA', 'Backlogs', 'Active', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'Resume', 'Marksheet', 'Status'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.length === 0 && (
              <tr><td colSpan={15} className="text-center py-10 text-gray-400">No registered students yet</td></tr>
            )}
            {students
              .filter((s) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (s.name?.toLowerCase().includes(q) || s.usn?.toLowerCase().includes(q));
              })
              .map((s) => {
              const sgpaMap = {};
              if (s.sgpaList) s.sgpaList.forEach((sg) => { sgpaMap[sg.semester] = sg.sgpa; });
              return (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{s.name}</td>
                  <td className="px-3 py-3 font-mono text-gray-600">{s.usn}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{s.email}</td>
                  <td className="px-3 py-3 font-mono font-bold text-indigo-700">{s.cgpa?.toFixed(2) || '—'}</td>
                  <td className="px-3 py-3">{s.backlogs || 0}</td>
                  <td className="px-3 py-3">{s.activeBacklogs || 0}</td>
                  {[1,2,3,4,5,6,7,8].map((sem) => (
                    <td key={sem} className="px-3 py-3 font-mono text-xs">{sgpaMap[sem]?.toFixed(2) || '—'}</td>
                  ))}
                  <td className="px-3 py-3">
                    {s.resumeUrl ? <a href={s.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs">View</a> : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    {s.marksheetUrl ? <a href={s.marksheetUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs">View</a> : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    {s.isVerified ? <span className="badge-green text-xs">Verified</span> : <span className="badge-yellow text-xs">Pending</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Export Column Selection Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Export — Select Columns</h2>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={selectAll} className="text-xs text-indigo-600 hover:underline">Select all</button>
              <span className="text-gray-300">|</span>
              <button onClick={deselectAll} className="text-xs text-indigo-600 hover:underline">Deselect all</button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {allColumns.map((col) => (
                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  {col.label}
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleExport} disabled={selectedColumns.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Download size={15} /> Export ({selectedColumns.length} columns)
              </button>
              <button onClick={() => setShowExportModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
