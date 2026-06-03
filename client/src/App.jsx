import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import TeacherDashboard from './components/TeacherDashboard';
import StudentPortal from './components/StudentPortal';
import AdminDashboard from './components/AdminDashboard';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import NotificationCenter from './components/NotificationCenter';
import { userService } from './api/userService';

// Protected Route Component
const ProtectedRoute = ({ user, children, allowedRoles }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
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
      {/* Notifications */}
      <div className="me-3">
        <NotificationCenter user={user} />
      </div>
      <div className="text-end me-3">
        <span className={`badge ${user.role === 'Admin' ? 'bg-danger' : user.role === 'Teacher' ? 'bg-success' : 'bg-info'} d-block mb-1`}>{user.role}</span>
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

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('etest_user') || sessionStorage.getItem('etest_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [resetEmail, setResetEmail] = useState('');

  // אם אימות הכניסה הצליח אז קוראים לפונקציה זו לשמור את נתוני המשתמש באתר
  const handleLoginSuccess = (userData, rememberMe) => {
    setUser(userData);
    // אם נךחץ על תזכור אותי, אז הנתונים יישמרו ב localStorage שגם אם סגרנו את הדף האתר יזכור אותנו. אחרת נשמור אותם ב sessionStorage שהנתונים ימחקו אחרי סגירת הדף
    if (rememberMe) {
      localStorage.setItem('etest_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('etest_user', JSON.stringify(userData));
    }
    // redirect programmatically for automated workflow
    navigate('/dashboard');
  };

  // אם אימות הרישום הצליח אז קוראים לפונקציה זו לשמור את נתוני המשתמש באתר
  const handleRegisterSuccess = (userData) => {
    // For registration, we'll default to session storage for safety unless they login later with rememberMe
    if (userData) {
      setUser(userData);
      sessionStorage.setItem('etest_user', JSON.stringify(userData));
      navigate('/dashboard');
    }
  };

  // פונקציה אסינכרונית לטפל ביציאה 
  const handleLogout = async () => {
    await userService.logout();
    setUser(null);
    // מנקה את נתוני המשתמש השמורים באתר
    localStorage.removeItem('etest_user');
    sessionStorage.removeItem('etest_user');
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
        <Routes>
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
          <Route path="/dashboard" element={
            <ProtectedRoute user={user}>
              {user?.role === 'Admin' ? (
                <AdminDashboard user={user} />
              ) : user?.role === 'Teacher' ? (
                <TeacherDashboard user={user} />
              ) : (
                <StudentPortal user={user} />
              )}
            </ProtectedRoute>
          } />

          {/* Role specific routes (optional, but good for direct access) */}
          <Route path="/admin" element={<ProtectedRoute user={user} allowedRoles={['Admin']}><AdminDashboard user={user} /></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute user={user} allowedRoles={['Teacher']}><TeacherDashboard user={user} /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute user={user} allowedRoles={['Student']}><StudentPortal user={user} /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

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
    </div>
  );
}

export default App;
