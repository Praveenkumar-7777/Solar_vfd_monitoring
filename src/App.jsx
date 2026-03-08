import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Setup from './pages/Setup';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import DeviceData from './pages/DeviceData';
import CreateUser from './pages/CreateUser';
import CreateAdmin from './pages/CreateAdmin';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/setup" element={<Setup />} />

          {/* Protected Routes - Admin Only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-user"
            element={
              <ProtectedRoute adminOnly={true}>
                <CreateUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <CreateAdmin />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - User Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/devices/:deviceId"
            element={
              <ProtectedRoute>
                <DeviceData />
              </ProtectedRoute>
            }
          />

          {/* Redirect all unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
