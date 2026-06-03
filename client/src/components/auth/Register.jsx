import { useState } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../api/userService';

const Register = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Student'
  });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // מטפלת בשינוי הערכים בטופס
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // פונקציה אסינכרונית שמטפלת בהגשת טופס ההרשמה
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    setLoading(true);

    try {
      const user = await userService.register(formData);
      onRegisterSuccess(user);
    } catch (err) {
      if (err.message.includes('successful')) {
        setStatusMsg({ type: 'success', text: err.message });
      } else {
        setStatusMsg({ type: 'danger', text: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-0 shadow-lg rounded-4 overflow-hidden animate__animated animate__zoomIn" style={{ minHeight: '650px' }}>
      {/* Left side - Info */}
      <div className="col-lg-6 d-none d-lg-flex bg-success p-5 flex-column justify-content-between text-white position-relative">
        <div className="position-relative z-1">
          <Link to="/" className="btn btn-link text-white p-0 mb-5 text-decoration-none">
            <i className="bi bi-arrow-left me-2"></i> Back to home
          </Link>
          <h2 className="display-5 fw-bold mb-4">Start Your Journey with E-Test</h2>
          <p className="lead opacity-75">Create an account to join the world's most intuitive assessment platform.</p>
        </div>
        <div className="mt-auto position-relative z-1">
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            <span>Instant Student Access</span>
          </div>
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            <span>Teacher Approval Workflow</span>
          </div>
          <p className="small opacity-50 mb-0">© 2026 E-Test System. All rights reserved.</p>
        </div>
        <div className="position-absolute bg-white opacity-10 rounded-circle" style={{ width: '300px', height: '300px', top: '-100px', right: '-100px' }}></div>
      </div>

      {/* Right side - Form */}
      <div className="col-lg-6 bg-white p-5 d-flex align-items-center">
        <div className="w-100">
          <h3 className="fw-bold mb-2">Create Account</h3>
          <p className="text-muted mb-4">Join our community today</p>
          
          {statusMsg.text && (
            <div className={`alert alert-${statusMsg.type} py-2 animate__animated animate__fadeIn`}>
              {statusMsg.type === 'success' ? <i className="bi bi-check-circle-fill me-2"></i> : <i className="bi bi-exclamation-triangle-fill me-2"></i>}
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-uppercase">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-control bg-light"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-uppercase">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control bg-light"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="name@example.com"
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-uppercase">Password</label>
              <input
                type="password"
                name="password"
                className="form-control bg-light"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a strong password"
              />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold text-uppercase">I am a...</label>
              <div className="d-flex gap-3">
                <div 
                  className={`flex-fill p-3 border rounded-3 text-center cursor-pointer transition-all ${formData.role === 'Student' ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'Student' }))}
                  style={{ cursor: 'pointer' }}
                >
                  <i className={`bi bi-person mb-1 d-block fs-4 ${formData.role === 'Student' ? 'text-primary' : 'text-muted'}`}></i>
                  <span className="small fw-bold">Student</span>
                </div>
                <div 
                  className={`flex-fill p-3 border rounded-3 text-center cursor-pointer transition-all ${formData.role === 'Teacher' ? 'border-success bg-success-subtle' : 'bg-light'}`}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'Teacher' }))}
                  style={{ cursor: 'pointer' }}
                >
                  <i className={`bi bi-briefcase mb-1 d-block fs-4 ${formData.role === 'Teacher' ? 'text-success' : 'text-muted'}`}></i>
                  <span className="small fw-bold">Teacher</span>
                </div>
              </div>
              {formData.role === 'Teacher' && (
                <div className="mt-2 text-success small">
                  <i className="bi bi-info-circle me-1"></i> Teacher accounts require admin approval.
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-success w-100 py-3 fw-bold mb-4 shadow-sm"
              disabled={loading || statusMsg.type === 'success'}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating Account...
                </>
              ) : (
                'Register Now'
              )}
            </button>

            <div className="text-center">
              <span className="text-muted small">Already have an account? </span>
              <Link
                to="/login"
                className="btn btn-link p-0 small fw-bold text-decoration-none"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
