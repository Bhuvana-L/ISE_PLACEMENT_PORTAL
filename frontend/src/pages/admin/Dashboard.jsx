import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Users, UserCheck, FileText, Download, RefreshCw, X, Search } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // overview, submissions, studentList
  const [submissions, setSubmissions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [studentList, setStudentList] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState(''); // 'submissions' or 'students'
  const [searchQuery, setSearchQuery] = useState('');
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');

  const allStudentColumns = [
    { key: 'name', label: 'Name' },
    { key: 'usn', label: 'USN' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'batch', label: 'Batch' },
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

  const [selectedColumns, setSelectedColumns] = useState(allStudentColumns.map((c) => c.key));

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => {
      setStats(data);
      setBatches(data.batches || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'submissions') {
      const params = new URLSearchParams();
      if (selectedBatch) params.set('batch', selectedBatch);
      if (selectedForm) params.set('formId', selectedForm);
      api.get(`/admin/submissions?${params}`).then(({ data }) => setSubmissions(data.submissions));
      // Fetch unique forms from submissions
      api.get('/admin/submissions').then(({ data }) => {
        const formMap = new Map();
        data.submissions.forEach((s) => {
          if (s.form) formMap.set(s.form._id, s.form.title);
        });
        setForms([...formMap.entries()].map(([id, title]) => ({ _id: id, title })));
      });
    }
    if (tab === 'studentList') {
      const params = new URLSearchParams();
      if (selectedBatch) params.set('batch', selectedBatch);
      api.get(`/admin/students?${params}`).then(({ data }) => setStudentList(data.students));
    }
  }, [tab, selectedBatch, selectedForm]);

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

  const toggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExportSubmissions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBatch) params.set('batch', selectedBatch);
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

  const handleExportStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBatch) params.set('batch', selectedBatch);
      params.set('columns', selectedColumns.join(','));
      const response = await api.get(`/admin/export/students-list?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_${selectedBatch || 'all'}.xlsx`);
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Coordinators', value: stats?.totalCoordinators, icon: UserCheck, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Forms', value: stats?.totalForms, icon: FileText, color: 'bg-teal-50 text-teal-600' },
    { label: 'Sent to Admin', value: stats?.verifiedStudents, icon: Download, color: 'bg-green-50 text-green-600' },
  ];

  const fieldLabels = getFieldLabels();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">ISE Department — Placement Overview</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'submissions', label: 'Student Submissions' },
          { key: 'studentList', label: 'Updated Student List' },
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
                  <p className="text-2xl font-bold text-gray-900">{s.value ?? '—'}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Quick actions</h2>
              <div className="space-y-2">
                <Link to="/admin/coordinators" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  <UserCheck size={18} className="text-indigo-500" />
                  <span className="text-sm font-medium">Manage coordinators</span>
                </Link>
                <Link to="/admin/students" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  <Users size={18} className="text-indigo-500" />
                  <span className="text-sm font-medium">View all students</span>
                </Link>
                <button onClick={() => setTab('submissions')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition w-full text-left">
                  <FileText size={18} className="text-indigo-500" />
                  <span className="text-sm font-medium">Student Submissions (sent by coordinators)</span>
                </button>
                <button onClick={() => setTab('studentList')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition w-full text-left">
                  <RefreshCw size={18} className="text-green-500" />
                  <span className="text-sm font-medium">Updated Student List (auto-synced)</span>
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Batches</h2>
              <div className="space-y-2">
                {batches.length > 0 ? batches.map((batch) => (
                  <div key={batch} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Batch {batch}</span>
                    <button onClick={() => { setSelectedBatch(batch); setTab('studentList'); }} className="text-xs btn-secondary py-1 px-2">View students</button>
                  </div>
                )) : <p className="text-sm text-gray-500">No batches found</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Submissions Tab — only shows data sent by coordinators */}
      {tab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Student Submissions</h2>
              <p className="text-sm text-gray-500">Only shows submissions sent by coordinators — {submissions.length} total</p>
            </div>
            <button onClick={handleExportSubmissions} className="btn-primary flex items-center gap-2 text-sm">
              <Download size={15} /> Export Excel
            </button>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div>
              <label className="label">Filter by batch</label>
              <select className="input w-auto" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                <option value="">All batches</option>
                {batches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Filter by form</label>
              <select className="input w-auto" value={selectedForm} onChange={(e) => setSelectedForm(e.target.value)}>
                <option value="">All forms</option>
                {forms.map((f) => <option key={f._id} value={f._id}>{f.title}</option>)}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name or USN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {submissions.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p>No submissions sent by coordinators yet</p>
            </div>
          ) : (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {submissions
                    .filter((s) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (s.student?.name?.toLowerCase().includes(q) || s.student?.usn?.toLowerCase().includes(q));
                    })
                    .map((s) => {
                    const responses = getResponses(s);
                    return (
                      <tr key={s._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.student?.name}</td>
                        <td className="px-4 py-3 text-gray-600">{s.student?.usn}</td>
                        <td className="px-4 py-3"><span className="badge-blue">{s.student?.batch}</span></td>
                        {fieldLabels.map((label) => (
                          <td key={label} className="px-4 py-3 text-gray-700 max-w-48 truncate">{responses[label] || '—'}</td>
                        ))}
                        <td className="px-4 py-3">
                          {s.status === 'verified'
                            ? <span className="badge-green">Verified</span>
                            : <span className="badge-yellow">{s.status}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Updated Student List Tab */}
      {tab === 'studentList' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Updated Student List</h2>
              <p className="text-sm text-gray-500">Auto-synced from student profiles — only students sent by coordinators</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                const params = new URLSearchParams();
                if (selectedBatch) params.set('batch', selectedBatch);
                api.get(`/admin/students?${params}`).then(({ data }) => setStudentList(data.students));
              }} className="btn-secondary flex items-center gap-2 text-sm">
                <RefreshCw size={15} /> Refresh
              </button>
              <button onClick={() => { setExportType('students'); setShowExportModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
                <Download size={15} /> Export Excel
              </button>
            </div>
          </div>

          <div>
            <label className="label">Filter by batch</label>
            <select className="input w-auto" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              <option value="">All batches</option>
              {batches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
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
                  {['Name', 'USN', 'Email', 'Batch', 'CGPA', 'Backlogs', 'Active', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'Resume', 'Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {studentList.length === 0 && (
                  <tr><td colSpan={16} className="text-center py-10 text-gray-400">No students found</td></tr>
                )}
                {studentList
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
                      <td className="px-3 py-3"><span className="badge-blue text-xs">{s.batch}</span></td>
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
                        {s.sentToAdmin ? <span className="badge-green text-xs">Received</span> : <span className="badge-yellow text-xs">Pending</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Column Selection Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Export — Select Columns</h2>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setSelectedColumns(allStudentColumns.map((c) => c.key))} className="text-xs text-indigo-600 hover:underline">Select all</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setSelectedColumns([])} className="text-xs text-indigo-600 hover:underline">Deselect all</button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {allStudentColumns.map((col) => (
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
              <button onClick={handleExportStudents} disabled={selectedColumns.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
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
