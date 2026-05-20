import React, { useState } from 'react';
import { userService } from '../../api/userService';

const Login = ({ onLoginSuccess, onSwitchToRegister, onSwitchToForgot, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // פונקציהס אסינכרונית להגשת טופס הכניסה לחשבון
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await userService.login(email, password);
      onLoginSuccess(user, rememberMe);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-0 shadow-lg rounded-4 overflow-hidden animate__animated animate__zoomIn" style={{ minHeight: '600px' }}>
      {/* Left side - Info */}
      <div className="col-lg-6 d-none d-lg-flex bg-primary p-5 flex-column justify-content-between text-white position-relative">
        <div className="position-relative z-1">
          <button className="btn btn-link text-white p-0 mb-5 text-decoration-none" onClick={onBackToHome}>
            <i className="bi bi-arrow-left me-2"></i> Back to home
          </button>
          <h2 className="display-5 fw-bold mb-4">Welcome Back to <br/>E-Test System</h2>
          <p className="lead opacity-75">Sign in to access your dashboard, manage exams, and track progress.</p>
        </div>
        <div className="mt-auto position-relative z-1">
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            <span>Secure & Encrypted Sessions</span>
          </div>
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            <span>Role-Based Access Control</span>
          </div>
          <p className="small opacity-50 mb-0">© 2026 E-Test System. All rights reserved.</p>
        </div>
        {/* Decorative circle */}
        <div className="position-absolute bg-white opacity-10 rounded-circle" style={{ width: '300px', height: '300px', bottom: '-100px', left: '-100px' }}></div>
      </div>

      {/* Right side - Form */}
      <div className="col-lg-6 bg-white p-5 d-flex align-items-center">
        <div className="w-100">
          <div className="mb-5 text-center d-lg-none">
             <h2 className="fw-bold text-primary">E-Test System</h2>
          </div>
          <h3 className="fw-bold mb-2">Sign In</h3>
          <p className="text-muted mb-4">Enter your credentials to continue</p>
          
          {error && (
            <div className={`alert ${error.includes('pending') ? 'alert-warning' : 'alert-danger'} py-2 animate__animated animate__shakeX`}>
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-uppercase">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                <input
                  type="email"
                  className="form-control bg-light border-start-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="d-flex justify-content-between">
                <label className="form-label small fw-bold text-uppercase">Password</label>
                <button 
                  type="button" 
                  className="btn btn-link p-0 small text-decoration-none"
                  onClick={onSwitchToForgot}
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
                <input
                  type="password"
                  className="form-control bg-light border-start-0"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="mb-4 d-flex align-items-center">
              <input 
                type="checkbox" 
                className="form-check-input mt-0 me-2" 
                id="rememberMe" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label small text-muted cursor-pointer" htmlFor="rememberMe" style={{ cursor: 'pointer' }}>Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-3 fw-bold mb-4 shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center">
              <span className="text-muted small">Don't have an account? </span>
              <button
                type="button"
                className="btn btn-link p-0 small fw-bold text-decoration-none"
                onClick={onSwitchToRegister}
              >
                Create an account
              </button>
            </div>
          </form>
          
          {/* להתחבר דרך גוגל או חשבון אחר */}
          <div className="mt-5 pt-3 border-top text-center">
            <p className="small text-muted mb-3">Or continue with</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-light border text-dark btn-sm px-3"><i className="bi bi-google me-2"></i> Google</button>
              <button className="btn btn-outline-light border text-dark btn-sm px-3"><i className="bi bi-github me-2"></i> GitHub</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
