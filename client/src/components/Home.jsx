import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home-page animate__animated animate__fadeIn">
      {/* Hero Section */}
      <section className="py-5 text-center bg-light rounded-5 mb-5 shadow-sm overflow-hidden position-relative">
        <div className="container py-5 position-relative z-1">
          <div className="row align-items-center">
            <div className="col-lg-7 text-lg-start">
              <h1 className="display-3 fw-bold text-dark mb-3">
                Smart Exams, <span className="text-primary">Instant Results.</span>
              </h1>
              <p className="lead text-muted mb-4 fs-4">
                The all-in-one platform for teachers to create, students to excel, and admins to oversee. Secure, efficient, and professional.
              </p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                <Link 
                  to="/register"
                  className="btn btn-primary btn-lg px-5 py-3 fw-bold shadow text-decoration-none"
                >
                  Join for Free
                </Link>
                <Link 
                  to="/login"
                  className="btn btn-outline-dark btn-lg px-5 py-3 fw-bold text-decoration-none"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block">
              <div className="position-relative">
                <div className="bg-primary rounded-circle position-absolute" style={{ width: '400px', height: '400px', top: '-50px', right: '-50px', opacity: '0.1' }}></div>
                <img 
                  src="https://img.freepik.com/free-vector/online-certification-illustration_23-2148575514.jpg" 
                  alt="E-Test Illustration" 
                  className="img-fluid rounded-4 shadow-lg position-relative z-1"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Designed for Everyone</h2>
            <p className="text-muted">A specialized experience tailored to your specific role.</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm p-4 text-center hover-lift">
                <div className="bg-primary-subtle text-primary rounded-circle p-3 mx-auto mb-3" style={{ width: '70px' }}>
                  <i className="bi bi-mortarboard-fill fs-2"></i>
                </div>
                <h4 className="fw-bold">For Students</h4>
                <p className="text-muted">Access exams anywhere, get instant grades, and detailed feedback to improve your performance.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm p-4 text-center hover-lift">
                <div className="bg-success-subtle text-success rounded-circle p-3 mx-auto mb-3" style={{ width: '70px' }}>
                  <i className="bi bi-journal-check fs-2"></i>
                </div>
                <h4 className="fw-bold">For Teachers</h4>
                <p className="text-muted">Create complex exams in minutes, automate grading, and track student progress with ease.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm p-4 text-center hover-lift">
                <div className="bg-danger-subtle text-danger rounded-circle p-3 mx-auto mb-3" style={{ width: '70px' }}>
                  <i className="bi bi-shield-lock-fill fs-2"></i>
                </div>
                <h4 className="fw-bold">For Admins</h4>
                <p className="text-muted">Full system oversight, user management, and detailed analytics to keep the platform secure.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-5 bg-dark text-white rounded-5 my-5">
        <div className="container">
          <div className="row text-center gy-4">
            <div className="col-6 col-md-3">
              <h2 className="fw-bold mb-0">10k+</h2>
              <small className="text-white-50">Exams Taken</small>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="fw-bold mb-0">500+</h2>
              <small className="text-white-50">Active Teachers</small>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="fw-bold mb-0">99%</h2>
              <small className="text-white-50">Satisfaction Rate</small>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="fw-bold mb-0">24/7</h2>
              <small className="text-white-50">Support</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
