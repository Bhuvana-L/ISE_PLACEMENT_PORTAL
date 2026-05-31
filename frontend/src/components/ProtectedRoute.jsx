import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <Outlet />
      </main>
      <footer className="text-center py-3 text-xs text-gray-300">
        Crafted with ♥ by Bhuvana L · ISE 2028
      </footer>
    </div>
  );
}
