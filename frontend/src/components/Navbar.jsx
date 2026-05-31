import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap } from 'lucide-react';

const navLinks = {
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/coordinators', label: 'Coordinators' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/settings', label: 'Settings' },
  ],
  coordinator: [
    { to: '/coordinator', label: 'Dashboard' },
    { to: '/coordinator/forms', label: 'Forms' },
    { to: '/coordinator/submissions', label: 'Submissions' },
    { to: '/coordinator/students', label: 'Students' },
  ],
  student: [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/forms', label: 'Forms' },
    { to: '/student/calculator', label: 'Calculator' },
    { to: '/student/profile', label: 'Profile' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = navLinks[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadge = {
    admin: 'bg-purple-100 text-purple-800',
    coordinator: 'bg-teal-100 text-teal-800',
    student: 'bg-blue-100 text-blue-800',
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-indigo-600" size={24} />
            <span className="font-bold text-gray-900 text-lg">ISE Placement</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[user?.role]}`}>
                {user?.role}
                {user?.assignedBatch ? ` · ${user.assignedBatch}` : ''}
                {user?.batch ? ` · ${user.batch}` : ''}
              </span>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 transition rounded-lg hover:bg-red-50">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 pb-3 overflow-x-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
