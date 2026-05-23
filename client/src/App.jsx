import React, { useState } from 'react';
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

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('etest_user') || sessionStorage.getItem('etest_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [viewMode, setViewMode] = useState('home'); // 'home', 'login', 'register', 'forgot', 'reset'
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
  };

  // אם אימות הרישום הצליח אז קוראים לפונקציה זו לשמור את נתוני המשתמש באתר
  const handleRegisterSuccess = (userData) => {
    // For registration, we'll default to session storage for safety unless they login later with rememberMe
    if (userData) {
      setUser(userData);
      sessionStorage.setItem('etest_user', JSON.stringify(userData));
    }
  };

  // פונקציה אסינכרונית לטפל ביציאה 
  const handleLogout = async () => {
    await userService.logout();
    setUser(null);
    setViewMode('home');
    // מנקה את נתוני המשתמש השמורים באתר
    localStorage.removeItem('etest_user');
    sessionStorage.removeItem('etest_user');
  };

  // אם עדיין לא נכנסנו לחשבון שלנו
  if (!user) {
    return (
      <div className="container py-4">
        <header className="d-flex justify-content-between align-items-center mb-5">
           <div className="d-flex align-items-center cursor-pointer" onClick={() => setViewMode('home')} style={{ cursor: 'pointer' }}>
              <div className="bg-primary text-white rounded-3 p-2 me-2 shadow-sm">
                <i className="bi bi-pencil-square fs-4"></i>
              </div>
              <h2 className="h4 fw-bold text-dark mb-0">E-Test <span className="text-primary">System</span></h2>
           </div>
           <div className="d-flex gap-2">
              <button className="btn btn-link text-dark text-decoration-none fw-bold" onClick={() => setViewMode('login')}>Sign In</button>
              <button className="btn btn-primary px-4 fw-bold shadow-sm" onClick={() => setViewMode('register')}>Get Started</button>
           </div>
        </header>

        <main>
          {viewMode === 'home' && <Home onStart={(mode) => setViewMode(mode)} />}
          
          {(viewMode === 'login' || viewMode === 'register' || viewMode === 'forgot' || viewMode === 'reset') && (
            <div className="row justify-content-center py-4">
              <div className="col-xl-11">
                {viewMode === 'login' && (
                  <Login 
                    onLoginSuccess={handleLoginSuccess} 
                    onSwitchToRegister={() => setViewMode('register')} 
                    onSwitchToForgot={() => setViewMode('forgot')}
                    onBackToHome={() => setViewMode('home')}
                  />
                )}
                {viewMode === 'register' && (
                  <Register 
                    onRegisterSuccess={handleRegisterSuccess} 
                    onSwitchToLogin={() => setViewMode('login')} 
                    onBackToHome={() => setViewMode('home')}
                  />
                )}
                {viewMode === 'forgot' && (
                  <ForgotPassword 
                    onSwitchToLogin={() => setViewMode('login')} 
                    onBackToHome={() => setViewMode('home')}
                    onLinkSent={(email) => {
                       setResetEmail(email);
                       // Auto-navigate to reset view for mock purposes
                       setTimeout(() => setViewMode('reset'), 3000);
                    }}
                  />
                )}
                {viewMode === 'reset' && (
                   <ResetPassword 
                     email={resetEmail || 'student@etest.com'} 
                     onResetSuccess={() => setViewMode('login')} 
                   />
                )}
              </div>
            </div>
          )}
        </main>
        
        <footer className="mt-5 pt-5 border-top">
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
        </footer>
      </div>
    );
  }

  // אחרי שנכנסנו לחשבון שלנו
  return (
    <div className="container py-4">
      <header className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom shadow-none">
        <div>
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

      <main className="animate__animated animate__fadeIn">
        {user.role === 'Admin' ? (
          <AdminDashboard user={user} />
        ) : user.role === 'Teacher' ? (
          <TeacherDashboard user={user} />
        ) : (
          <StudentPortal user={user} />
        )}
      </main>

      <footer className="mt-5 pt-4 border-top text-center text-muted">
        <small>Logged in as {user.role} | Session active</small>
      </footer>
    </div>
  );
}

export default App;
