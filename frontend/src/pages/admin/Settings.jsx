import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Mail, Shield } from 'lucide-react';

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) return toast.error('Current password is required');
    if (newPassword && newPassword !== confirmPassword) return toast.error('New passwords do not match');
    if (newPassword && newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (!newEmail && !newPassword) return toast.error('Enter a new email or password to change');

    setSaving(true);
    try {
      const payload = { currentPassword };
      if (newEmail) payload.newEmail = newEmail;
      if (newPassword) payload.newPassword = newPassword;

      const { data } = await api.put('/auth/change-credentials', payload);
      toast.success(data.message);

      // Update token if returned
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setCurrentPassword('');
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Change your email and password</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Shield size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email} · {user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium">Enter your current password to make changes</p>
          </div>

          <div>
            <label className="label">Current Password *</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <hr className="border-gray-200" />

          <div>
            <label className="label flex items-center gap-2"><Mail size={14} /> New Email (leave blank to keep current)</label>
            <input
              type="email"
              className="input"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={user?.email}
            />
          </div>

          <div>
            <label className="label flex items-center gap-2"><KeyRound size={14} /> New Password (leave blank to keep current)</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {newPassword && (
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Update Credentials'}
          </button>
        </form>
      </div>
    </div>
  );
}
