import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Upload, CheckCircle, Plus, Pencil, Trash2, X, Github, Linkedin, Globe, Briefcase, GraduationCap, Award, FolderOpen } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(null); // which section is being edited
  const [saving, setSaving] = useState(false);

  // Edit states
  const [phone, setPhone] = useState('');
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resume, setResume] = useState(null);
  const [marksheet, setMarksheet] = useState(null);
  const [semMarksheets, setSemMarksheets] = useState({});
  const [backlogs, setBacklogs] = useState(0);
  const [activeBacklogs, setActiveBacklogs] = useState(0);
  const [courses, setCourses] = useState([]);
  const [cgpaInput, setCgpaInput] = useState('');
  const [sgpaList, setSgpaList] = useState([]);

  useEffect(() => {
    api.get('/student/profile').then(({ data }) => {
      setProfile(data.student);
      populateFields(data.student);
    });
  }, []);

  const populateFields = (s) => {
    setPhone(s.phone || '');
    setHeadline(s.headline || '');
    setAbout(s.about || '');
    setSkills(s.skills || []);
    setProjects(s.projects || []);
    setCertifications(s.certifications || []);
    setEducation(s.education || []);
    setExperience(s.experience || []);
    setLinkedinUrl(s.linkedinUrl || '');
    setGithubUrl(s.githubUrl || '');
    setPortfolioUrl(s.portfolioUrl || '');
    setBacklogs(s.backlogs || 0);
    setActiveBacklogs(s.activeBacklogs || 0);
    setCourses(s.courses || []);
    setCgpaInput(s.cgpa || '');
    setSgpaList(s.sgpaList || []);
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      const fd = new FormData();

      // Always send basic fields
      fd.append('phone', phone);
      fd.append('headline', headline);
      fd.append('about', about);
      fd.append('skills', JSON.stringify(skills));
      fd.append('projects', JSON.stringify(projects));
      fd.append('certifications', JSON.stringify(certifications));
      fd.append('education', JSON.stringify(education));
      fd.append('experience', JSON.stringify(experience));
      fd.append('linkedinUrl', linkedinUrl);
      fd.append('githubUrl', githubUrl);
      fd.append('portfolioUrl', portfolioUrl);
      fd.append('backlogs', backlogs);
      fd.append('activeBacklogs', activeBacklogs);
      fd.append('courses', JSON.stringify(courses));

      // Send SGPA list and CGPA for academics section
      if (sgpaList.length > 0) {
        fd.append('sgpaList', JSON.stringify(sgpaList));
      }
      // Always send cgpa when editing academics
      if (section === 'academics') {
        fd.append('cgpa', cgpaInput || '');
      }

      // Files
      if (resume) fd.append('resume', resume);
      if (marksheet) fd.append('marksheet', marksheet);
      Object.entries(semMarksheets).forEach(([sem, file]) => {
        if (file instanceof File) {
          fd.append(`marksheet_${sem}`, file);
        }
      });

      const { data } = await api.put('/student/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(data.student);
      populateFields(data.student);
      setEditing(null);
      setResume(null);
      setMarksheet(null);
      setSemMarksheets({});
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (s) => setSkills(skills.filter((sk) => sk !== s));

  const addProject = () => setProjects([...projects, { title: '', description: '', techStack: '', link: '' }]);
  const updateProject = (i, field, val) => {
    const updated = [...projects];
    updated[i] = { ...updated[i], [field]: val };
    setProjects(updated);
  };
  const removeProject = (i) => setProjects(projects.filter((_, idx) => idx !== i));

  const addCert = () => setCertifications([...certifications, { title: '', issuer: '', date: '', url: '' }]);
  const updateCert = (i, field, val) => {
    const updated = [...certifications];
    updated[i] = { ...updated[i], [field]: val };
    setCertifications(updated);
  };
  const removeCert = (i) => setCertifications(certifications.filter((_, idx) => idx !== i));

  const addCourse = () => setCourses([...courses, { name: '', platform: '', certificateUrl: '', completedDate: '' }]);
  const updateCourse = (i, field, val) => {
    const updated = [...courses];
    updated[i] = { ...updated[i], [field]: val };
    setCourses(updated);
  };
  const removeCourse = (i) => setCourses(courses.filter((_, idx) => idx !== i));

  const addExp = () => setExperience([...experience, { company: '', role: '', duration: '', description: '' }]);
  const updateExp = (i, field, val) => {
    const updated = [...experience];
    updated[i] = { ...updated[i], [field]: val };
    setExperience(updated);
  };
  const removeExp = (i) => setExperience(experience.filter((_, idx) => idx !== i));

  if (!profile) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header / Banner */}
      <div className="card relative overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 -mx-6 -mt-6 mb-4" />
        <div className="flex items-end gap-4 -mt-12 relative z-10 px-2">
          <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-indigo-600">
            {profile.name?.[0]}
          </div>
          <div className="pb-1">
            <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-sm text-gray-600">{profile.headline || `${profile.department} Student · Batch ${profile.batch}`}</p>
            <p className="text-xs text-gray-500">{profile.usn} · {profile.email}</p>
          </div>
          <button onClick={() => setEditing('header')} className="ml-auto p-2 hover:bg-gray-100 rounded-lg">
            <Pencil size={16} className="text-gray-500" />
          </button>
        </div>

        {profile.isVerified && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="text-green-600" size={16} />
            <span className="text-sm text-green-800 font-medium">Verified · CGPA: {profile.cgpa?.toFixed(4)}</span>
          </div>
        )}

        {/* Social links */}
        <div className="flex gap-3 mt-4">
          {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800"><Linkedin size={20} /></a>}
          {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900"><Github size={20} /></a>}
          {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800"><Globe size={20} /></a>}
          {profile.phone && <span className="text-sm text-gray-500 ml-auto">📞 {profile.phone}</span>}
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">About</h2>
          <button onClick={() => setEditing('about')} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} className="text-gray-500" /></button>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.about || 'Add a summary about yourself...'}</p>
      </div>

      {/* Skills */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Skills</h2>
          <button onClick={() => setEditing('skills')} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} className="text-gray-500" /></button>
        </div>
        {profile.skills?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">{s}</span>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">Add your skills...</p>}
      </div>

      {/* Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FolderOpen size={18} /> Projects</h2>
          <button onClick={() => setEditing('projects')} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} className="text-gray-500" /></button>
        </div>
        {profile.projects?.length > 0 ? (
          <div className="space-y-3">
            {profile.projects.map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{p.title}</h3>
                {p.description && <p className="text-sm text-gray-600 mt-1">{p.description}</p>}
                {p.techStack && <p className="text-xs text-indigo-600 mt-2">Tech: {p.techStack}</p>}
                {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">View project →</a>}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">Add your projects...</p>}
      </div>

      {/* Experience */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Briefcase size={18} /> Experience</h2>
          <button onClick={() => setEditing('experience')} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} className="text-gray-500" /></button>
        </div>
        {profile.experience?.length > 0 ? (
          <div className="space-y-3">
            {profile.experience.map((e, i) => (
              <div key={i} className="border-l-2 border-indigo-200 pl-4">
                <h3 className="font-medium text-gray-900">{e.role}</h3>
                <p className="text-sm text-gray-600">{e.company} · {e.duration}</p>
                {e.description && <p className="text-sm text-gray-500 mt-1">{e.description}</p>}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">Add internships or work experience...</p>}
      </div>

      {/* SGPA */}
      {/* Academic Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><GraduationCap size={18} /> Academic Results</h2>
          <button onClick={() => setEditing('academics')} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} className="text-gray-500" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-indigo-700">{profile.cgpa?.toFixed(4) || '—'}</p>
            <p className="text-xs text-indigo-600">CGPA</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{profile.activeBacklogs || 0}</p>
            <p className="text-xs text-red-600">Active Backlogs</p>
          </div>
        </div>
        {profile.sgpaList?.length > 0 && (
          <div className="space-y-2">
            {[...profile.sgpaList].sort((a, b) => a.semester - b.semester).map((s) => (
              <div key={s.semester} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-600">Semester {s.semester}</span>
                <div className="flex gap-6">
                  <span className="font-mono font-bold text-indigo-700">{s.sgpa?.toFixed(2)} SGPA</span>
                  <span className="text-gray-500">{s.credits} credits</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Courses & Certifications */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Award size={18} /> Courses & Certifications</h2>
          <button onClick={() => setEditing('courses')} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} className="text-gray-500" /></button>
        </div>
        {profile.courses?.length > 0 ? (
          <div className="space-y-2">
            {profile.courses.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-sm text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.platform} {c.completedDate && `· ${c.completedDate}`}</p>
                </div>
                {c.certificateUrl && <a href={c.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">View cert</a>}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">Add courses you've completed...</p>}
        {profile.certifications?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Other Certifications</p>
            {profile.certifications.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-sm text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.issuer} {c.date && `· ${c.date}`}</p>
                </div>
                {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">View</a>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Documents</h2>
          <button onClick={() => setEditing('documents')} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} className="text-gray-500" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Upload size={20} className="mx-auto text-gray-400 mb-2" />
            <p className="text-xs font-medium text-gray-700">Resume</p>
            {profile.resumeUrl
              ? <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">View resume</a>
              : <p className="text-xs text-gray-400">Not uploaded</p>}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Upload size={20} className="mx-auto text-gray-400 mb-2" />
            <p className="text-xs font-medium text-gray-700">Overall Marks Card</p>
            {profile.marksheetUrl
              ? <a href={profile.marksheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">View marksheet</a>
              : <p className="text-xs text-gray-400">Not uploaded</p>}
          </div>
        </div>
        {profile.semMarksheets?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Semester Marks Cards</p>
            <div className="grid grid-cols-4 gap-2">
              {[...profile.semMarksheets].sort((a, b) => a.semester - b.semester).map((m) => (
                <a key={m.semester} href={m.url} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 rounded-lg p-2 text-center hover:bg-indigo-100 transition">
                  <p className="text-xs font-bold text-indigo-700">Sem {m.semester}</p>
                  <p className="text-xs text-indigo-600">View</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg capitalize">Edit {editing}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>

            {editing === 'header' && (
              <div className="space-y-4">
                <div>
                  <label className="label">Headline</label>
                  <input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Full Stack Developer | ISE 2024" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
                </div>
                <div>
                  <label className="label">LinkedIn URL</label>
                  <input className="input" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="label">GitHub URL</label>
                  <input className="input" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                </div>
                <div>
                  <label className="label">Portfolio URL</label>
                  <input className="input" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yoursite.com" />
                </div>
              </div>
            )}

            {editing === 'about' && (
              <div>
                <label className="label">About</label>
                <textarea className="input" rows={5} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Write about yourself, your interests, goals..." />
              </div>
            )}

            {editing === 'skills' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input className="input flex-1" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                  <button type="button" onClick={addSkill} className="btn-primary text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm flex items-center gap-1">
                      {s} <button onClick={() => removeSkill(s)} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {editing === 'projects' && (
              <div className="space-y-4">
                {projects.map((p, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2 relative">
                    <button onClick={() => removeProject(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    <input className="input" placeholder="Project title" value={p.title} onChange={(e) => updateProject(i, 'title', e.target.value)} />
                    <textarea className="input" rows={2} placeholder="Description" value={p.description} onChange={(e) => updateProject(i, 'description', e.target.value)} />
                    <input className="input" placeholder="Tech stack (e.g. React, Node.js)" value={p.techStack} onChange={(e) => updateProject(i, 'techStack', e.target.value)} />
                    <input className="input" placeholder="Project link (optional)" value={p.link} onChange={(e) => updateProject(i, 'link', e.target.value)} />
                  </div>
                ))}
                <button onClick={addProject} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"><Plus size={14} /> Add project</button>
              </div>
            )}

            {editing === 'experience' && (
              <div className="space-y-4">
                {experience.map((e, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2 relative">
                    <button onClick={() => removeExp(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    <input className="input" placeholder="Company" value={e.company} onChange={(ev) => updateExp(i, 'company', ev.target.value)} />
                    <input className="input" placeholder="Role" value={e.role} onChange={(ev) => updateExp(i, 'role', ev.target.value)} />
                    <input className="input" placeholder="Duration (e.g. Jun 2024 - Aug 2024)" value={e.duration} onChange={(ev) => updateExp(i, 'duration', ev.target.value)} />
                    <textarea className="input" rows={2} placeholder="Description" value={e.description} onChange={(ev) => updateExp(i, 'description', ev.target.value)} />
                  </div>
                ))}
                <button onClick={addExp} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"><Plus size={14} /> Add experience</button>
              </div>
            )}

            {editing === 'certifications' && (
              <div className="space-y-4">
                {certifications.map((c, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2 relative">
                    <button onClick={() => removeCert(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    <input className="input" placeholder="Certification title" value={c.title} onChange={(e) => updateCert(i, 'title', e.target.value)} />
                    <input className="input" placeholder="Issuer (e.g. Coursera, AWS)" value={c.issuer} onChange={(e) => updateCert(i, 'issuer', e.target.value)} />
                    <input className="input" placeholder="Date (e.g. Jan 2024)" value={c.date} onChange={(e) => updateCert(i, 'date', e.target.value)} />
                    <input className="input" placeholder="Certificate URL (optional)" value={c.url} onChange={(e) => updateCert(i, 'url', e.target.value)} />
                  </div>
                ))}
                <button onClick={addCert} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"><Plus size={14} /> Add certification</button>
              </div>
            )}

            {editing === 'academics' && (
              <div className="space-y-4">
                <div>
                  <label className="label">CGPA (auto-calculated from SGPA, or enter manually)</label>
                  <input type="number" step="0.01" min="0" max="10" className="input" value={cgpaInput} onChange={(e) => setCgpaInput(e.target.value)} placeholder="8.47" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Total Backlogs</label>
                    <input type="number" className="input" value={backlogs} onChange={(e) => setBacklogs(e.target.value)} min="0" />
                  </div>
                  <div>
                    <label className="label">Active Backlogs</label>
                    <input type="number" className="input" value={activeBacklogs} onChange={(e) => setActiveBacklogs(e.target.value)} min="0" />
                  </div>
                </div>
                <hr className="border-gray-200" />
                <p className="text-sm font-medium text-gray-700">SGPA per Semester</p>
                <div className="space-y-2">
                  {[1,2,3,4,5,6,7,8].map((sem) => {
                    const existing = sgpaList.find((s) => s.semester === sem);
                    return (
                      <div key={sem} className="grid grid-cols-3 gap-2 items-center">
                        <span className="text-sm text-gray-600">Sem {sem}</span>
                        <input type="number" step="0.01" min="0" max="10" className="input text-sm" placeholder="SGPA" value={existing?.sgpa || ''} onChange={(e) => {
                          const val = e.target.value;
                          setSgpaList((prev) => {
                            const updated = prev.filter((s) => s.semester !== sem);
                            if (val) updated.push({ semester: sem, sgpa: parseFloat(val), credits: existing?.credits || 20 });
                            return updated;
                          });
                        }} />
                        <input type="number" min="1" className="input text-sm" placeholder="Credits" value={existing?.credits || ''} onChange={(e) => {
                          const val = e.target.value;
                          setSgpaList((prev) => {
                            const updated = prev.filter((s) => s.semester !== sem);
                            if (existing?.sgpa || val) updated.push({ semester: sem, sgpa: existing?.sgpa || 0, credits: parseInt(val) || 0 });
                            return updated;
                          });
                        }} />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500">CGPA will auto-calculate from SGPA when you save, unless you manually set it above.</p>
              </div>
            )}

            {editing === 'courses' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Total Backlogs</label>
                    <input type="number" className="input" value={backlogs} onChange={(e) => setBacklogs(e.target.value)} min="0" />
                  </div>
                  <div>
                    <label className="label">Active Backlogs</label>
                    <input type="number" className="input" value={activeBacklogs} onChange={(e) => setActiveBacklogs(e.target.value)} min="0" />
                  </div>
                </div>
                <hr className="border-gray-200" />
                <p className="text-sm font-medium text-gray-700">Courses Completed</p>
                {courses.map((c, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2 relative">
                    <button onClick={() => removeCourse(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    <input className="input" placeholder="Course name" value={c.name} onChange={(e) => updateCourse(i, 'name', e.target.value)} />
                    <input className="input" placeholder="Platform (e.g. Coursera, Udemy, NPTEL)" value={c.platform} onChange={(e) => updateCourse(i, 'platform', e.target.value)} />
                    <input className="input" placeholder="Certificate URL" value={c.certificateUrl} onChange={(e) => updateCourse(i, 'certificateUrl', e.target.value)} />
                    <input className="input" placeholder="Completed date (e.g. Mar 2024)" value={c.completedDate} onChange={(e) => updateCourse(i, 'completedDate', e.target.value)} />
                  </div>
                ))}
                <button onClick={addCourse} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"><Plus size={14} /> Add course</button>
              </div>
            )}

            {editing === 'documents' && (
              <div className="space-y-4">
                <div>
                  <label className="label">Upload Resume (PDF/DOC)</label>
                  <input type="file" className="input" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files[0])} />
                  {profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs hover:underline mt-1 block">View current resume</a>}
                </div>
                <div>
                  <label className="label">Upload Overall Marks Card (PDF/Image)</label>
                  <input type="file" className="input" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setMarksheet(e.target.files[0])} />
                  {profile.marksheetUrl && <a href={profile.marksheetUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs hover:underline mt-1 block">View current marksheet</a>}
                </div>
                <hr className="border-gray-200" />
                <p className="text-sm font-medium text-gray-700">Semester-wise Marks Cards</p>
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4,5,6,7,8].map((sem) => {
                    const existing = profile.semMarksheets?.find((m) => m.semester === sem);
                    return (
                      <div key={sem} className="border border-gray-200 rounded-lg p-3">
                        <label className="label text-xs">Semester {sem}</label>
                        <input type="file" className="input text-xs" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setSemMarksheets({ ...semMarksheets, [sem]: e.target.files[0] })} />
                        {existing?.url && <a href={existing.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs hover:underline mt-1 block">View uploaded</a>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-5">
              <button onClick={() => handleSave(editing)} className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
