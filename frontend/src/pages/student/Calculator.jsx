import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';

const gradePoints = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, P: 4, F: 0 };

export default function Calculator() {
  const [mode, setMode] = useState('sgpa');

  // SGPA state
  const [subjects, setSubjects] = useState([
    { name: '', credits: '', grade: 'O' },
    { name: '', credits: '', grade: 'A+' },
  ]);
  const [sgpaResult, setSgpaResult] = useState(null);
  const [semesterNo, setSemesterNo] = useState(1);

  // CGPA state
  const [semesters, setSemesters] = useState([
    { semester: 1, sgpa: '', credits: '', backlogCredits: '' },
  ]);
  const [cgpaResult, setCgpaResult] = useState(null);

  // SGPA calculation (backlog subjects get F = 0 grade points, credits still count)
  const calcSGPA = () => {
    const valid = subjects.filter((s) => s.credits && s.grade);
    if (valid.length === 0) return toast.error('Add at least one subject');
    const totalWeighted = valid.reduce((sum, s) => sum + parseFloat(s.credits) * gradePoints[s.grade], 0);
    const totalCredits = valid.reduce((sum, s) => sum + parseFloat(s.credits), 0);
    if (totalCredits === 0) return toast.error('Total credits cannot be zero');
    const hasBacklog = valid.some((s) => s.grade === 'F');
    const backlogCredits = valid.filter((s) => s.grade === 'F').reduce((sum, s) => sum + parseFloat(s.credits), 0);
    setSgpaResult({ sgpa: (totalWeighted / totalCredits).toFixed(4), totalCredits, hasBacklog, backlogCredits });
  };

  const saveSGPA = async () => {
    if (!sgpaResult) return;
    try {
      const { data: profile } = await api.get('/student/profile');
      const existing = profile.student.sgpaList || [];
      const updated = [...existing.filter((s) => s.semester !== parseInt(semesterNo)), { semester: parseInt(semesterNo), sgpa: parseFloat(sgpaResult.sgpa), credits: parseFloat(sgpaResult.totalCredits) }];
      await api.put('/student/profile', { sgpaList: updated });
      toast.success(`Semester ${semesterNo} SGPA saved and CGPA updated`);
    } catch {
      toast.error('Failed to save');
    }
  };

  // CGPA calculation with backlog support
  // Formula: Σ(SGPAᵢ × Total Creditsᵢ) / Σ(Total Creditsᵢ - Backlog Creditsᵢ)
  const calcCGPA = () => {
    const valid = semesters.filter((s) => s.sgpa && s.credits);
    if (valid.length === 0) return toast.error('Add at least one semester');
    const totalWeighted = valid.reduce((sum, s) => sum + parseFloat(s.sgpa) * parseFloat(s.credits), 0);
    const totalCredits = valid.reduce((sum, s) => {
      const backlog = parseFloat(s.backlogCredits) || 0;
      return sum + (parseFloat(s.credits) - backlog);
    }, 0);
    if (totalCredits === 0) return toast.error('Effective credits cannot be zero');
    const hasBacklogs = valid.some((s) => parseFloat(s.backlogCredits) > 0);
    setCgpaResult({ cgpa: (totalWeighted / totalCredits).toFixed(4), hasBacklogs });
  };

  const saveCGPA = async () => {
    if (!cgpaResult) return;
    const valid = semesters.filter((s) => s.sgpa && s.credits);
    try {
      await api.put('/student/profile', {
        sgpaList: valid.map((s) => ({
          semester: s.semester,
          sgpa: parseFloat(s.sgpa),
          credits: parseFloat(s.credits),
        })),
      });
      toast.success('CGPA saved to profile');
    } catch {
      toast.error('Failed to save');
    }
  };

  const updateSubject = (i, k, v) => {
    const updated = [...subjects];
    updated[i] = { ...updated[i], [k]: v };
    setSubjects(updated);
  };

  const updateSemester = (i, k, v) => {
    const updated = [...semesters];
    updated[i] = { ...updated[i], [k]: v };
    setSemesters(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SGPA / CGPA Calculator</h1>
        <p className="text-gray-500 text-sm mt-1">Calculate your academic performance (with backlog support)</p>
      </div>

      <div className="flex gap-2">
        {['sgpa', 'cgpa'].map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${mode === m ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            {m.toUpperCase()} Calculator
          </button>
        ))}
      </div>

      {mode === 'sgpa' && (
        <div className="card space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="label">Semester number</label>
              <input type="number" min="1" max="8" className="input w-32" value={semesterNo} onChange={(e) => setSemesterNo(e.target.value)} />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-medium flex items-center gap-1"><AlertTriangle size={14} /> Backlog subjects</p>
            <p className="text-xs mt-1">For subjects with backlog, select grade <strong>F (0)</strong>. The credits still count in total.</p>
          </div>

          <div>
            <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-5">Subject</div>
              <div className="col-span-3">Credits</div>
              <div className="col-span-3">Grade</div>
              <div className="col-span-1"></div>
            </div>
            {subjects.map((s, i) => (
              <div key={i} className={`grid grid-cols-12 gap-2 mb-2 ${s.grade === 'F' ? 'bg-red-50 rounded-lg p-1' : ''}`}>
                <input className="input col-span-5 text-sm" placeholder="Subject name" value={s.name} onChange={(e) => updateSubject(i, 'name', e.target.value)} />
                <input type="number" className="input col-span-3 text-sm" placeholder="Credits" min="0" max="5" value={s.credits} onChange={(e) => updateSubject(i, 'credits', e.target.value)} />
                <select className={`input col-span-3 text-sm ${s.grade === 'F' ? 'text-red-600 font-bold' : ''}`} value={s.grade} onChange={(e) => updateSubject(i, 'grade', e.target.value)}>
                  {Object.entries(gradePoints).map(([g, p]) => <option key={g} value={g}>{g} ({p}){g === 'F' ? ' ← Backlog' : ''}</option>)}
                </select>
                <button type="button" onClick={() => setSubjects(subjects.filter((_, j) => j !== i))} className="col-span-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setSubjects([...subjects, { name: '', credits: '', grade: 'O' }])} className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mt-1">
              <Plus size={14} /> Add subject
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={calcSGPA} className="btn-primary">Calculate SGPA</button>
            {sgpaResult && <button onClick={saveSGPA} className="btn-secondary flex items-center gap-2"><Save size={15} /> Save to profile</button>}
          </div>

          {sgpaResult && (
            <div className={`${sgpaResult.hasBacklog ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'} border rounded-xl p-5 text-center`}>
              <p className={`text-sm mb-1 ${sgpaResult.hasBacklog ? 'text-red-600' : 'text-indigo-600'}`}>Semester {semesterNo} SGPA {sgpaResult.hasBacklog && '(with backlog)'}</p>
              <p className={`text-5xl font-bold ${sgpaResult.hasBacklog ? 'text-red-700' : 'text-indigo-700'}`}>{sgpaResult.sgpa}</p>
              <p className={`text-xs mt-2 ${sgpaResult.hasBacklog ? 'text-red-500' : 'text-indigo-500'}`}>Total credits: {sgpaResult.totalCredits}</p>
              {sgpaResult.hasBacklog && <p className="text-xs text-red-600 mt-1">Backlog credits: {sgpaResult.backlogCredits}</p>}
              <p className="text-xs text-gray-500 mt-1">Formula: Σ(Cᵢ × Gᵢ) / ΣCᵢ (backlog subjects get 0 grade points)</p>
            </div>
          )}
        </div>
      )}

      {mode === 'cgpa' && (
        <div className="card space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-medium flex items-center gap-1"><AlertTriangle size={14} /> CGPA with Backlogs</p>
            <p className="text-xs mt-1">Enter backlog credits for semesters that have backlogs. The formula subtracts backlog credits from the denominator.</p>
          </div>

          <div>
            <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Sem</div>
              <div className="col-span-3">SGPA</div>
              <div className="col-span-3">Total Credits</div>
              <div className="col-span-3">Backlog Credits</div>
              <div className="col-span-1"></div>
            </div>
            {semesters.map((s, i) => (
              <div key={i} className={`grid grid-cols-12 gap-2 mb-2 ${parseFloat(s.backlogCredits) > 0 ? 'bg-red-50 rounded-lg p-1' : ''}`}>
                <input type="number" className="input col-span-2 text-sm" placeholder="Sem" min="1" max="8" value={s.semester} onChange={(e) => updateSemester(i, 'semester', parseInt(e.target.value))} />
                <input type="number" step="0.01" className="input col-span-3 text-sm" placeholder="SGPA" min="0" max="10" value={s.sgpa} onChange={(e) => updateSemester(i, 'sgpa', e.target.value)} />
                <input type="number" className="input col-span-3 text-sm" placeholder="Total credits" min="1" value={s.credits} onChange={(e) => updateSemester(i, 'credits', e.target.value)} />
                <input type="number" className="input col-span-3 text-sm text-red-600" placeholder="0" min="0" value={s.backlogCredits} onChange={(e) => updateSemester(i, 'backlogCredits', e.target.value)} />
                <button type="button" onClick={() => setSemesters(semesters.filter((_, j) => j !== i))} className="col-span-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setSemesters([...semesters, { semester: semesters.length + 1, sgpa: '', credits: '', backlogCredits: '' }])} className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mt-1">
              <Plus size={14} /> Add semester
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={calcCGPA} className="btn-primary">Calculate CGPA</button>
            {cgpaResult && <button onClick={saveCGPA} className="btn-secondary flex items-center gap-2"><Save size={15} /> Save to profile</button>}
          </div>

          {cgpaResult && (
            <div className={`${cgpaResult.hasBacklogs ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'} border rounded-xl p-5 text-center`}>
              <p className={`text-sm mb-1 ${cgpaResult.hasBacklogs ? 'text-red-600' : 'text-purple-600'}`}>Cumulative CGPA {cgpaResult.hasBacklogs && '(with backlogs)'}</p>
              <p className={`text-5xl font-bold ${cgpaResult.hasBacklogs ? 'text-red-700' : 'text-purple-700'}`}>{cgpaResult.cgpa}</p>
              <p className="text-xs text-gray-500 mt-2">Formula: Σ(SGPAᵢ × Creditsᵢ) / Σ(Creditsᵢ - Backlog Creditsᵢ)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
