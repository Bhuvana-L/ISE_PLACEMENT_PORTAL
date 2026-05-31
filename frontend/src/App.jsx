import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import AdminDashboard from './pages/admin/Dashboard';
import AdminCoordinators from './pages/admin/Coordinators';
import AdminStudents from './pages/admin/Students';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

import CoordDashboard from './pages/coordinator/Dashboard';
import CoordForms from './pages/coordinator/Forms';
import CoordSubmissions from './pages/coordinator/Submissions';
import CoordStudents from './pages/coordinator/Students';

import StudentDashboard from './pages/student/Dashboard';
import StudentForms from './pages/student/Forms';
import Calculator from './pages/student/Calculator';
import StudentProfile from './pages/student/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="coordinators" element={<AdminCoordinators />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Coordinator routes */}
          <Route path="/coordinator" element={<ProtectedRoute role="coordinator" />}>
            <Route index element={<CoordDashboard />} />
            <Route path="forms" element={<CoordForms />} />
            <Route path="submissions" element={<CoordSubmissions />} />
            <Route path="students" element={<CoordStudents />} />
          </Route>

          {/* Student routes */}
          <Route path="/student" element={<ProtectedRoute role="student" />}>
            <Route index element={<StudentDashboard />} />
            <Route path="forms" element={<StudentForms />} />
            <Route path="calculator" element={<Calculator />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
