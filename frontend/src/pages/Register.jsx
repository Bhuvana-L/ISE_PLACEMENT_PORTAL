import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    usn: '', department: 'ISE', batch: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register(data);
      toast.success('Account created successfully!');
      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const currentYear = new Date().getFullYear();
  const batches = Array.from({ length: 6 }, (_, i) => String(currentYear + i));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create student account</h1>
          <p className="text-gray-500 mt-1 text-sm">ISE Placement Portal</p>
          <p className="text-xs text-amber-600 mt-1">Your USN must be approved by your coordinator to register</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full name</label>
                <input className="input" value={form.name} onChange={set('name')} placeholder="Bhuvana K" required />
              </div>
              <div className="col-span-2">
                <label className="label">Email address</label>
                <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="bhuvana@example.com" required />
              </div>
              <div>
                <label className="label">USN</label>
                <input className="input uppercase" value={form.usn} onChange={set('usn')} placeholder="1IS21IS001" required />
              </div>
              <div>
                <label className="label">Batch (graduation year)</label>
                <select className="input" value={form.batch} onChange={set('batch')} required>
                  <option value="">Select batch</option>
                  {batches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <input className="input" value={form.department} onChange={set('department')} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input type="password" className="input" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
