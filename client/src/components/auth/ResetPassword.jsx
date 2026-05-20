import React, { useState } from 'react';
import { userService } from '../../api/userService';

const ResetPassword = ({ email, onResetSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // פונקציה אסינכרונית שמטפלת בהגשת טופס איתחול הסיסמה
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'danger', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await userService.resetPassword(email, newPassword);
      setStatus({ type: 'success', text: 'Password has been reset successfully! Redirecting to login...' });
      setTimeout(() => {
        onResetSuccess();
      }, 2000);
    } catch (err) {
      setStatus({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg border-0 rounded-4 mx-auto overflow-hidden animate__animated animate__zoomIn" style={{ maxWidth: '450px' }}>
      <div className="bg-primary p-4 text-center text-white">
        <i className="bi bi-shield-lock fs-1"></i>
        <h3 className="fw-bold mt-2">New Password</h3>
        <p className="mb-0 small opacity-75">Secure your account for {email}</p>
      </div>
      <div className="card-body p-4">
        {status.text && (
          <div className={`alert alert-${status.type} py-2 mb-4`}>
            {status.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-bold text-uppercase">New Password</label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
              placeholder="Enter at least 6 characters"
            />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-bold text-uppercase">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-type your password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
            disabled={loading || status.type === 'success'}
          >
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
