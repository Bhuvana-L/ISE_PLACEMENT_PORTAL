import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Search, CheckCircle, Send, ExternalLink, X, Github, Linkedin, Globe, FolderOpen, Briefcase, Award, GraduationCap, Download } from 'lucide-react';

export default function CoordStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [verifyModal, setVerifyModal] = useState(null);
  const [cgpaInput, setCgpaInput] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [checkedStudents, setCheckedStudents] = useState(new Set());
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchStudents = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const { data } = await api.get(`/coordinator/students?${params}`);
    setStudents(data.students);
  }, [search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const viewProfile = async (student) => {
    const { data } = await api.get(`/coordinator/students/${student._id}`);
    setSelected(data.student);
  };

  const handleVerify = async () => {
    if (!cgpaInput) return toast.error('Enter CGPA');
    try {
      await api.put(`/coordinator/students/${verifyModal._id}/verify`, {
        cgpa: parseFloat(cgpaInput), note,
      });
      toast.success('Student verified');
      setVerifyModal(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleSendToAdmin = async () => {
    const verified = students.filter((s) => s.isVerified && !s.sentToAdmin);
    if (verified.length === 0) return toast.error('No verified students to send');
    setSending(true);
    try {
      await api.post('/coordinator/students/send-to-admin', { studentIds: verified.map((s) => s._id) });
      toast.success(`${verified.length} student(s) sent to admin`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSending(false);
    }
  };

  const verifiedCount = students.filter((s) => s.isVerified).length;
  const pendingSendCount = students.filter((s) => s.isVerified && !s.sentToAdmin).length;

  const profileColumns = [
    { key: 'name', label: 'Name' }, { key: 'usn', label: 'USN' }, { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' }, { key: 'batch', label: 'Batch' }, { key: 'department', label: 'Department' },
    { key: 'cgpa', label: 'CGPA' }, { key: 'backlogs', label: 'Backlogs' }, { key: 'activeBacklogs', label: 'Active Backlogs' },
    { key: 'headline', label: 'Headline' }, { key: 'about', label: 'About' }, { key: 'skills', label: 'Skills' },
    { key: 'projects', label: 'Projects' }, { key: 'experience', label: 'Experience' },
    { key: 'certifications', label: 'Certifications' }, { key: 'courses', label: 'Courses' },
    { key: 'linkedin', label: 'LinkedIn' }, { key: 'github', label: 'GitHub' }, { key: 'portfolio', label: 'Portfolio' },
    { key: 'resume', label: 'Resume' },
    { key: 'sem1', label: 'Sem 1' }, { key: 'sem2', label: 'Sem 2' }, { key: 'sem3', label: 'Sem 3' }, { key: 'sem4', label: 'Sem 4' },
    { key: 'sem5', label: 'Sem 5' }, { key: 'sem6', label: 'Sem 6' }, { key: 'sem7', label: 'Sem 7' }, { key: 'sem8', label: 'Sem 8' },
  ];
  const [exportColumns, setExportColumns] = useState(profileColumns.map((c) => c.key));

  const toggleCheck = (id) => {
    const next = new Set(checkedStudents);
    next.has(id) ? next.delete(id) : next.add(id);
    setCheckedStudents(next);
  };
  const toggleAll = () => {
    if (checkedStudents.size === students.length) setCheckedStudents(new Set());
    else setCheckedStudents(new Set(students.map((s) => s._id)));
  };

  const handleExportProfiles = async () => {
    const ids = checkedStudents.size > 0 ? [...checkedStudents] : students.map((s) => s._id);
    if (ids.length === 0) return toast.error('No students to export');
    try {
      const response = await api.post('/coordinator/export/profiles', {
        studentIds: ids,
        columns: exportColumns,
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_profiles.xlsx');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{verifiedCount}/{students.length} verified</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { if (checkedStudents.size === 0) { toggleAll(); } setShowExportModal(true); }} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Export Profiles {checkedStudents.size > 0 ? `(${checkedStudents.size})` : ''}
          </button>
          {pendingSendCount > 0 && (
            <button onClick={handleSendToAdmin} disabled={sending} className="btn-primary flex items-center gap-2">
              <Send size={15} /> Send {pendingSendCount} verified to admin
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search by name or USN..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" checked={checkedStudents.size === students.length && students.length > 0} onChange={toggleAll} className="rounded border-gray-300 text-indigo-600" />
              </th>
              {['Student', 'USN', 'CGPA', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No students found</td></tr>}
            {students.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={checkedStudents.has(s._id)} onChange={() => toggleCheck(s._id)} className="rounded border-gray-300 text-indigo-600" />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.usn}</td>
                <td className="px-4 py-3 font-mono">{s.cgpa?.toFixed(2) || '—'}</td>
                <td className="px-4 py-3">
                  {s.sentToAdmin
                    ? <span className="badge-green">Sent to admin</span>
                    : s.isVerified
                    ? <span className="badge-yellow">Verified</span>
                    : <span className="badge-red">Pending verification</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => viewProfile(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="View profile">
                      <ExternalLink size={14} />
                    </button>
                    {!s.isVerified && (
                      <button onClick={() => { setVerifyModal(s); setCgpaInput(s.cgpa || ''); setNote(''); }} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Verify">
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Full Profile Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                <p className="text-sm text-gray-600">{selected.headline || `${selected.department} · Batch ${selected.batch}`}</p>
                <p className="text-xs text-gray-500">{selected.usn} · {selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>

            <div className="flex gap-3 mb-4">
              {selected.linkedinUrl && <a href={selected.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600"><Linkedin size={18} /></a>}
              {selected.githubUrl && <a href={selected.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-700"><Github size={18} /></a>}
              {selected.portfolioUrl && <a href={selected.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600"><Globe size={18} /></a>}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              {[['Phone', selected.phone], ['CGPA', selected.cgpa?.toFixed(2)], ['Department', selected.department], ['Batch', selected.batch]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">{k}</p>
                  <p className="font-medium text-gray-900">{v || '—'}</p>
                </div>
              ))}
            </div>

            {selected.about && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-1">About</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.about}</p>
              </div>
            )}

            {selected.skills?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.skills.map((s) => <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs">{s}</span>)}
                </div>
              </div>
            )}

            {selected.projects?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-1"><FolderOpen size={14} /> Projects</h3>
                {selected.projects.map((p, i) => (
                  <div key={i} className="border-l-2 border-indigo-200 pl-3 mb-2">
                    <p className="font-medium text-sm">{p.title}</p>
                    {p.description && <p className="text-xs text-gray-600">{p.description}</p>}
                    {p.techStack && <p className="text-xs text-indigo-600">Tech: {p.techStack}</p>}
                    {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View →</a>}
                  </div>
                ))}
              </div>
            )}

            {selected.experience?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-1"><Briefcase size={14} /> Experience</h3>
                {selected.experience.map((e, i) => (
                  <div key={i} className="border-l-2 border-green-200 pl-3 mb-2">
                    <p className="font-medium text-sm">{e.role} at {e.company}</p>
                    <p className="text-xs text-gray-500">{e.duration}</p>
                    {e.description && <p className="text-xs text-gray-600">{e.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {selected.certifications?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-1"><Award size={14} /> Certifications</h3>
                {selected.certifications.map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2 mb-1 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.issuer} {c.date && `· ${c.date}`}</p>
                    </div>
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600">View</a>}
                  </div>
                ))}
              </div>
            )}

            {selected.sgpaList?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-1"><GraduationCap size={14} /> Results</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[...selected.sgpaList].sort((a, b) => a.semester - b.semester).map((s) => (
                    <div key={s.semester} className="bg-gray-50 rounded-lg p-2 text-xs flex justify-between">
                      <span>Sem {s.semester}</span>
                      <span className="font-mono font-bold text-indigo-700">{s.sgpa?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {selected.resumeUrl && <a href={selected.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">View Resume</a>}
              {selected.marksheetUrl && <a href={selected.marksheetUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">View Marksheet</a>}
            </div>

            <button className="btn-secondary w-full mt-4" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Export Profiles Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Export Profiles — Select Columns</h2>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">{checkedStudents.size} student(s) selected</p>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setExportColumns(profileColumns.map((c) => c.key))} className="text-xs text-indigo-600 hover:underline">Select all</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setExportColumns([])} className="text-xs text-indigo-600 hover:underline">Deselect all</button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {profileColumns.map((col) => (
                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input type="checkbox" checked={exportColumns.includes(col.key)} onChange={() => setExportColumns((prev) => prev.includes(col.key) ? prev.filter((k) => k !== col.key) : [...prev, col.key])} className="rounded border-gray-300 text-indigo-600" />
                  {col.label}
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleExportProfiles} disabled={exportColumns.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Download size={15} /> Export ({exportColumns.length} columns)
              </button>
              <button onClick={() => setShowExportModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Verify modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-lg">Verify {verifyModal.name}</h2>
            <div>
              <label className="label">Verified CGPA</label>
              <input type="number" step="0.0001" min="0" max="10" className="input" value={cgpaInput} onChange={(e) => setCgpaInput(e.target.value)} placeholder="8.4567" />
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any remarks..." />
            </div>
            <div className="flex gap-3">
              <button onClick={handleVerify} className="btn-primary flex-1 flex items-center justify-center gap-2"><CheckCircle size={15} /> Verify</button>
              <button onClick={() => setVerifyModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
