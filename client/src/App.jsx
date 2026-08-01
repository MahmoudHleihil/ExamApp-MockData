import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import TeacherDashboard from './components/TeacherDashboard';
import StudentPortal from './components/StudentPortal';
import AdminDashboard from './components/AdminDashboard';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import NotificationCenter from './components/NotificationCenter';
import { useAuth } from './api/AuthContext';

// Protected Route Component: Restricts access based on authentication and roles.
// Uses Outlet to render child routes if authorized.
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to home if user doesn't have the required role
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render nested routes
  return <Outlet />;
};

// Layout Component: Wraps pages with common UI like Header and Footer.
// The <Outlet /> is where nested page content is rendered.
const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container py-4">
      {!user ? (
        <PublicHeader navigate={navigate} />
      ) : (
        <PrivateHeader user={user} navigate={navigate} handleLogout={handleLogout} />
      )}

      <main className="animate__animated animate__fadeIn">
        {/* Child routes are injected here */}
        <Outlet />
      </main>

      <Footer user={user} />
    </div>
  );
};

const PublicHeader = ({ navigate }) => (
  <header className="d-flex justify-content-between align-items-center mb-5">
     <div className="d-flex align-items-center cursor-pointer" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="bg-primary text-white rounded-3 p-2 me-2 shadow-sm">
          <i className="bi bi-pencil-square fs-4"></i>
        </div>
        <h2 className="h4 fw-bold text-dark mb-0">E-Test <span className="text-primary">System</span></h2>
     </div>
     <div className="d-flex gap-2">
        <button className="btn btn-link text-dark text-decoration-none fw-bold" onClick={() => navigate('/login')}>Sign In</button>
        <button className="btn btn-primary px-4 fw-bold shadow-sm" onClick={() => navigate('/register')}>Get Started</button>
     </div>
  </header>
);

const PrivateHeader = ({ user, navigate, handleLogout }) => (
  <header className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom shadow-none">
    <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
      <h1 className="h4 fw-bold text-primary m-0">E-Test System</h1>
      <small className="text-muted">Welcome, <span className="text-dark fw-bold">{user.fullName}</span></small>
    </div>
    <div className="d-flex align-items-center">
      <div className="me-3">
        <NotificationCenter user={user} />
      </div>
      <div className="text-end me-3">
        <span className={`badge ${user.role === 'Admin' ? 'bg-danger' : user.role === 'Teacher' ? 'bg-success' : 'bg-info'} d-block mb-1`} data-testid="current-user-role">{user.role}</span>
        <span className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>{user.email}</span>
      </div>
      <button 
        className="btn btn-outline-danger btn-sm px-3 fw-bold border-2"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  </header>
);

const DashboardRedirect = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case "Admin":
      return (
        <Navigate
          to="/admin"
          replace
        />
      );

    case "Teacher":
      return (
        <Navigate
          to="/teacher"
          replace
        />
      );

    case "Student":
      return (
        <Navigate
          to="/student"
          replace
        />
      );

    default:
      return (
        <Navigate
          to="/"
          replace
        />
      );
  }
};

const Footer = ({ user }) => (
  <footer className="mt-5 pt-5 border-top">
    {!user ? (
      <div className="row">
        <div className="col-md-6 text-center text-md-start">
          <p className="text-muted small">© 2026 E-Test Mock Platform. Built for Excellence.</p>
        </div>
        <div className="col-md-6 text-center text-md-end">
          <div className="d-flex gap-3 justify-content-center justify-content-md-end">
            <a href="#" className="text-muted small text-decoration-none">Privacy Policy</a>
            <a href="#" className="text-muted small text-decoration-none">Terms of Service</a>
            <a href="#" className="text-muted small text-decoration-none">Contact Support</a>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center text-muted">
         <small>Logged in as {user.role} | Session active</small>
      </div>
    )}
  </footer>
);

function App() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [resetEmail, setResetEmail] = useState('');

  const handleLoginSuccess = (userData, rememberMe) => {
    login(userData, rememberMe);
    navigate('/dashboard');
  };

  const handleRegisterSuccess = (registeredUser) => {
    const isTeacher =
      registeredUser?.role === "Teacher";

    navigate("/login", {
      replace: true,
      state: {
        registrationSuccess: true,
        message: isTeacher
          ? "Registration completed. Your teacher account is awaiting administrator approval."
          : "Registration completed successfully. Please sign in.",
      },
    });
  };

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={!user ? <Home onStart={(mode) => navigate(`/${mode}`)} /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={
          !user ? (
            <div className="row justify-content-center py-4">
              <div className="col-xl-11">
                <Login 
                  onLoginSuccess={handleLoginSuccess} 
                  onSwitchToRegister={() => navigate('/register')} 
                  onSwitchToForgot={() => navigate('/forgot-password')}
                  onBackToHome={() => navigate('/')}
                />
              </div>
            </div>
          ) : <Navigate to="/dashboard" />
        } />
        <Route path="/register" element={
          !user ? (
            <div className="row justify-content-center py-4">
              <div className="col-xl-11">
                <Register 
                  onRegisterSuccess={handleRegisterSuccess} 
                  onSwitchToLogin={() => navigate('/login')} 
                  onBackToHome={() => navigate('/')}
                />
              </div>
            </div>
          ) : <Navigate to="/dashboard" />
        } />
        <Route path="/forgot-password" element={
          !user ? (
            <div className="row justify-content-center py-4">
              <div className="col-xl-11">
                <ForgotPassword 
                  onSwitchToLogin={() => navigate('/login')} 
                  onBackToHome={() => navigate('/')}
                  onLinkSent={(email) => {
                     setResetEmail(email);
                     setTimeout(() => navigate('/reset-password'), 3000);
                  }}
                />
              </div>
            </div>
          ) : <Navigate to="/dashboard" />
        } />
        <Route path="/reset-password" element={
          !user ? (
            <div className="row justify-content-center py-4">
              <div className="col-xl-11">
                <ResetPassword 
                  email={resetEmail || 'student@etest.com'} 
                  onResetSuccess={() => navigate('/login')} 
                />
              </div>
            </div>
          ) : <Navigate to="/dashboard" />
        } />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={
            <DashboardRedirect />
          } />
          
          <Route path="/admin/*" element={<AdminDashboard user={user} />} />
          <Route path="/teacher/*" element={<TeacherDashboard user={user} />} />
          <Route path="/student/*" element={<StudentPortal user={user} />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

export default App;
