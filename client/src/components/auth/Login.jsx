import { useState } from 'react';
import { Link, useLocation, } from 'react-router-dom';
import { userService } from '../../api/userService';

const savedUsers = [
  {
    role: 'Admin',
    email: 'admin@etest.com',
    password: 'password123',
    icon: 'bi-shield-lock-fill',
    color: 'danger',
  },
  {
    role: 'Teacher',
    email: 'teacher@etest.com',
    password: 'password123',
    icon: 'bi-person-workspace',
    color: 'primary',
  },
  {
    role: 'Student',
    email: 'student@etest.com',
    password: 'password123',
    icon: 'bi-mortarboard-fill',
    color: 'success',
  },
];

const Login = ({ onLoginSuccess, onSwitchToForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const location =
    useLocation();

  const registrationMessage =
    location.state?.message;
  
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

  const fillCredentials = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  const copyToClipboard = async (value, fieldId) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldId);

      window.setTimeout(() => {
        setCopiedField('');
      }, 1500);
    } catch (err) {
      console.error('Failed to copy credentials:', err);
    }
  };

  return (
    <div
      className="row g-0 shadow-lg rounded-4 overflow-hidden animate__animated animate__zoomIn"
      style={{ minHeight: '600px' }}
    >
      {/* Left side - Info */}
      <div className="col-lg-6 d-none d-lg-flex bg-primary p-5 flex-column justify-content-between text-white position-relative">
        <div className="position-relative z-1">
          <Link
            to="/"
            className="btn btn-link text-white p-0 mb-5 text-decoration-none"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to home
          </Link>

          <h2 className="display-5 fw-bold mb-4">
            Welcome Back to
            <br />
            E-Test System
          </h2>

          <p className="lead opacity-75">
            Sign in to access your dashboard, manage exams, and track progress.
          </p>
        </div>

        <div className="mt-auto position-relative z-1">
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            <span>Secure &amp; Encrypted Sessions</span>
          </div>

          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            <span>Role-Based Access Control</span>
          </div>

          <p className="small opacity-50 mb-0">
            © 2026 E-Test System. All rights reserved.
          </p>
        </div>

        <div
          className="position-absolute bg-white opacity-10 rounded-circle"
          style={{
            width: '300px',
            height: '300px',
            bottom: '-100px',
            left: '-100px',
          }}
        ></div>
      </div>

      {registrationMessage && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle-fill me-2" />
          {registrationMessage}
        </div>
      )}

      {/* Right side - Form */}
      <div className="col-lg-6 bg-white p-4 p-md-5 d-flex align-items-center">
        <div className="w-100">
          <div className="mb-5 text-center d-lg-none">
            <h2 className="fw-bold text-primary">E-Test System</h2>
          </div>

          <h3 className="fw-bold mb-2">Sign In</h3>
          <p className="text-muted mb-4">
            Enter your credentials to continue
          </p>

          {/* Quick login accounts */}
          <div className="card border-0 bg-light rounded-4 mb-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="fw-bold mb-1">
                    <i className="bi bi-lightning-charge-fill text-warning me-2"></i>
                    Quick Login
                  </h6>

                  <p className="small text-muted mb-0">
                    Select a saved test account
                  </p>
                </div>

                <span className="badge bg-warning-subtle text-warning-emphasis">
                  Development
                </span>
              </div>

              <div className="d-flex flex-column gap-2">
                {savedUsers.map((user) => {
                  const emailFieldId = `${user.role}-email`;
                  const passwordFieldId = `${user.role}-password`;

                  return (
                    <div
                      key={user.role}
                      className="bg-white border rounded-3 p-3"
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                          <div
                            className={`bg-${user.color}-subtle text-${user.color} rounded-circle d-flex align-items-center justify-content-center me-2`}
                            style={{
                              width: '36px',
                              height: '36px',
                              flexShrink: 0,
                            }}
                          >
                            <i className={`bi ${user.icon}`}></i>
                          </div>

                          <span className="fw-bold">{user.role}</span>
                        </div>

                        <button
                          type="button"
                          className={`btn btn-${user.color} btn-sm`}
                          onClick={() => fillCredentials(user)}
                          data-testid={`quick-login-${user.role.toLowerCase()}`}
                        >
                          <i className="bi bi-box-arrow-in-right me-1"></i>
                          Use
                        </button>
                      </div>

                      <div className="small">
                        <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                          <span className="text-muted text-truncate">
                            <strong>Email:</strong> {user.email}
                          </span>

                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none flex-shrink-0"
                            onClick={() =>
                              copyToClipboard(user.email, emailFieldId)
                            }
                            aria-label={`Copy ${user.role} email`}
                            title="Copy email"
                          >
                            <i
                              className={`bi ${
                                copiedField === emailFieldId
                                  ? 'bi-check-lg text-success'
                                  : 'bi-copy'
                              }`}
                            ></i>
                          </button>
                        </div>

                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <span className="text-muted">
                            <strong>Password:</strong>{' '}
                            <code>{user.password}</code>
                          </span>

                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none flex-shrink-0"
                            onClick={() =>
                              copyToClipboard(user.password, passwordFieldId)
                            }
                            aria-label={`Copy ${user.role} password`}
                            title="Copy password"
                          >
                            <i
                              className={`bi ${
                                copiedField === passwordFieldId
                                  ? 'bi-check-lg text-success'
                                  : 'bi-copy'
                              }`}
                            ></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div
              className={`alert ${
                error.includes('pending')
                  ? 'alert-warning'
                  : 'alert-danger'
              } py-2 animate__animated animate__shakeX`}
              role="alert"
              data-testid="login-error"
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="login-form">
            <div className="mb-3">
              <label className="form-label small fw-bold text-uppercase">
                Email Address
              </label>

              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-envelope text-muted"></i>
                </span>

                <input
                  type="email"
                  className="form-control bg-light border-start-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  aria-label="Email"
                  autoComplete="email"
                  data-testid="login-email"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between">
                <label className="form-label small fw-bold text-uppercase">
                  Password
                </label>

                <button
                  type="button"
                  className="btn btn-link p-0 small text-decoration-none"
                  onClick={onSwitchToForgot}
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-lock text-muted"></i>
                </span>

                <input
                  type="password"
                  className="form-control bg-light border-start-0"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  aria-label="Password"
                  autoComplete="current-password"
                  data-testid="login-password"
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

              <label
                className="form-check-label small text-muted"
                htmlFor="rememberMe"
                style={{ cursor: 'pointer' }}
              >
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-3 fw-bold mb-4 shadow-sm"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign In
                </>
              )}
            </button>

            <div className="text-center">
              <span className="text-muted small">
                Don&apos;t have an account?{' '}
              </span>

              <Link
                to="/register"
                className="btn btn-link p-0 small fw-bold text-decoration-none"
              >
                Create an account
              </Link>
            </div>
          </form>

          <div className="mt-5 pt-3 border-top text-center">
            <p className="small text-muted mb-3">Or continue with</p>

            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-outline-light border text-dark btn-sm px-3"
              >
                <i className="bi bi-google me-2"></i>
                Google
              </button>

              <button
                type="button"
                className="btn btn-outline-light border text-dark btn-sm px-3"
              >
                <i className="bi bi-github me-2"></i>
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;