import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
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

          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Sign in</h2>
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
            <p className="text-center text-sm text-gray-500 mt-3">
              New student?{' '}
              <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-gray-700 font-medium py-4">Built by Bhuvana L · ISE 2028</p>
    </div>
  );
}
