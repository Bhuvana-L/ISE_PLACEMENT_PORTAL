import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { FileText, Calculator, User, CheckCircle, Clock, Trash2 } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/forms').then(({ data }) => setForms(data.forms));
    api.get('/student/submissions').then(({ data }) => setSubmissions(data.submissions));
  }, []);

  const submittedCount = forms.filter((f) => f.submitted).length;
  const pendingCount = forms.filter((f) => !f.submitted).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-500 text-sm mt-1">Batch {user?.batch} · {user?.department} · {user?.usn}</p>
      </div>

      {user?.isVerified && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <div>
            <p className="font-medium text-green-900">Profile verified by coordinator</p>
            {user?.cgpa && <p className="text-sm text-green-700">Your CGPA: {user.cgpa.toFixed(4)}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total forms', value: forms.length, icon: FileText, color: 'bg-blue-50 text-blue-600' },
          { label: 'Submitted', value: submittedCount, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'CGPA', value: user?.cgpa?.toFixed(2) || '—', icon: Calculator, color: 'bg-purple-50 text-purple-600' },
        ].map((s) => (
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
          <h2 className="font-semibold mb-4">Pending forms</h2>
          {forms.filter((f) => !f.submitted).length === 0 && (
            <p className="text-gray-400 text-sm">All forms submitted!</p>
          )}
          <div className="space-y-2">
            {forms.filter((f) => !f.submitted).map((f) => (
              <Link key={f._id} to={`/student/forms`} className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition">
                <div>
                  <p className="text-sm font-medium text-yellow-900">{f.title}</p>
                  {f.deadline && <p className="text-xs text-yellow-700">Due {new Date(f.deadline).toLocaleDateString()}</p>}
                </div>
                <Clock size={16} className="text-yellow-600" />
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Quick access</h2>
          <div className="space-y-2">
            {[
              { to: '/student/forms', icon: FileText, label: 'View and fill forms' },
              { to: '/student/calculator', icon: Calculator, label: 'SGPA / CGPA calculator' },
              { to: '/student/profile', icon: User, label: 'Update profile & documents' },
            ].map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                <Icon size={18} className="text-indigo-500" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="card border border-red-200 bg-red-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-red-900">Delete Account</h2>
            <p className="text-sm text-red-700">Permanently delete your account and all data. This cannot be undone.</p>
          </div>
          <button onClick={() => setShowDeleteModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-lg text-red-900">Are you sure?</h2>
            <p className="text-sm text-gray-600">This will permanently delete your account, profile, and all submissions. <span className="font-bold text-red-700">This cannot be undone.</span></p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal('confirm')} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm">
                Yes, I want to delete
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation - Password */}
      {showDeleteModal === 'confirm' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-lg text-red-900">Final Confirmation</h2>
            <p className="text-sm text-gray-600">Enter your password to permanently delete your account.</p>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Enter your password" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!deletePassword) return toast.error('Enter your password');
                  setDeleting(true);
                  try {
                    await api.delete('/student/account', { data: { password: deletePassword } });
                    toast.success('Account deleted');
                    logout();
                    navigate('/login');
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to delete');
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
