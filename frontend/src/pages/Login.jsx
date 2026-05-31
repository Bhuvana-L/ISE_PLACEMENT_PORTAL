import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Shield, Users, UserCircle, ArrowLeft } from 'lucide-react';

const roles = [
  { key: 'admin', label: 'Admin', icon: Shield, color: 'bg-purple-50 border-purple-200 hover:bg-purple-100', iconColor: 'text-purple-600', desc: 'Department admin access' },
  { key: 'coordinator', label: 'Placement Coordinator', icon: Users, color: 'bg-teal-50 border-teal-200 hover:bg-teal-100', iconColor: 'text-teal-600', desc: 'Manage batch & students' },
  { key: 'student', label: 'Student', icon: UserCircle, color: 'bg-blue-50 border-blue-200 hover:bg-blue-100', iconColor: 'text-blue-600', desc: 'Access your portal' },
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
              <GraduationCap size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">GSSS ISE Placement Portal</h1>
            <p className="text-gray-500 mt-1 text-sm">Information Science & Engineering</p>
          </div>

          {/* Role Selection */}
          {!selectedRole && (
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-600 font-medium mb-4">Login as</p>
              {roles.map((role) => (
                <button
                  key={role.key}
                  onClick={() => setSelectedRole(role.key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition cursor-pointer ${role.color}`}
                >
                  <div className={`p-3 rounded-xl bg-white shadow-sm ${role.iconColor}`}>
                    <role.icon size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Login Form */}
          {selectedRole && (
            <div className="card">
              <button onClick={() => setSelectedRole(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                <ArrowLeft size={14} /> Back
              </button>
              <h2 className="text-xl font-semibold mb-1">Sign in as {roles.find((r) => r.key === selectedRole)?.label}</h2>
              <p className="text-sm text-gray-500 mb-5">Enter your credentials</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
              <div className="text-center mt-3">
                <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">Forgot password?</Link>
              </div>
              {selectedRole === 'student' && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  New student?{' '}
                  <Link to="/register" className="text-indigo-600 font-medium hover:underline">Create account</Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="text-center text-sm text-gray-700 font-medium py-4">Built by Bhuvana L · ISE 2028</p>
    </div>
  );
}
