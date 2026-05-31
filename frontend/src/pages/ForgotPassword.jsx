import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { KeyRound, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password, 4: success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, newPassword });
      toast.success('Password reset successfully!');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <KeyRound size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-1 text-sm">ISE Placement Portal</p>
        </div>

        {/* Step indicators */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex items-center gap-2 ${s < step ? 'text-green-600' : s === step ? 'text-indigo-600' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  s < step ? 'bg-green-100 border-green-500' : s === step ? 'bg-indigo-100 border-indigo-500' : 'border-gray-300'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Enter your email</h2>
            <p className="text-sm text-gray-500 mb-4">We'll send a 6-digit OTP to verify your identity</p>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              <Link to="/login" className="text-indigo-600 font-medium hover:underline">Back to login</Link>
            </p>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Enter OTP</h2>
            <p className="text-sm text-gray-500 mb-4">Check your email <span className="font-medium text-gray-700">{email}</span> for the 6-digit code</p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="label">OTP Code</label>
                <input
                  type="text"
                  className="input text-center text-2xl tracking-widest font-mono"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => { setStep(1); setOtp(''); }} className="btn-secondary w-full">
                Resend OTP
              </button>
            </form>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Set new password</h2>
            <p className="text-sm text-gray-500 mb-4">Choose a strong password (min 6 characters)</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="card text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Password Reset Successful!</h2>
            <p className="text-sm text-gray-500">You can now login with your new password.</p>
            <Link to="/login" className="btn-primary inline-block w-full">Go to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
