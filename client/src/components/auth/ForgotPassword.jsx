import React, { useState } from 'react';
import { userService } from '../../api/userService';

const ForgotPassword = ({ onSwitchToLogin, onBackToHome, onLinkSent }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // פונקציה אסינכרונית להגשת הבקשה לשינוי הסיסמה עם הסיסמה החדשה
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await userService.requestPasswordReset(email);
      setStatus({ type: 'success', text: response.message });
      if (onLinkSent) onLinkSent(email);
    } catch (err) {
      setStatus({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-0 shadow-lg rounded-4 overflow-hidden animate__animated animate__fadeIn" style={{ minHeight: '500px' }}>
      <div className="col-lg-5 bg-dark p-5 text-white d-flex flex-column justify-content-center">
        <button className="btn btn-link text-white p-0 mb-4 text-start text-decoration-none" onClick={onBackToHome}>
          <i className="bi bi-arrow-left me-2"></i> Back to home
        </button>
        <h2 className="fw-bold mb-3">Forgot Password?</h2>
        <p className="opacity-75">No worries! Enter your email and we'll send you a link to reset your password.</p>
      </div>
      <div className="col-lg-7 bg-white p-5 d-flex align-items-center">
        <div className="w-100">
          <h3 className="fw-bold mb-4">Reset Request</h3>
          
          {status.text && (
            <div className={`alert alert-${status.type} py-3 mb-4`}>
              <i className={`bi ${status.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
              {status.text}
            </div>
          )}

          {!status.text || status.type === 'danger' ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label small fw-bold text-uppercase">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope"></i></span>
                  <input
                    type="email"
                    className="form-control bg-light border-start-0"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your registered email"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 py-3 fw-bold mb-3 shadow-sm"
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
               <p className="text-muted small mb-4">For this mock version, we've logged the reset link to the browser's console (F12).</p>
               <div className="bg-light p-3 rounded mb-4">
                  <code className="text-break small">Check the console to find the simulated reset link!</code>
               </div>
            </div>
          )}

          <div className="text-center mt-3">
            <button className="btn btn-link p-0 small fw-bold text-decoration-none" onClick={onSwitchToLogin}>
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
