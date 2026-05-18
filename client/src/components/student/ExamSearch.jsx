const ExamSearch = ({ 
  examId, 
  setExamId, 
  handleStartExam, 
  loading, 
  error, 
  exam, 
  isExamStarted, 
  enteredPassword, 
  setEnteredPassword, 
  passwordError, 
  setPasswordError, 
  startTakingExam 
}) => {
  return (
    <div className="animate__animated animate__fadeIn">
      <div className="text-center mb-5">
        <h2 className="fw-bold">Student Portal</h2>
        <p className="text-muted">Enter your exam ID to begin your assessment.</p>
      </div>

      <div className="card shadow-sm border-0 overflow-hidden mx-auto" style={{maxWidth: '700px'}}>
        <div className="card-body p-4">
          <div className="input-group input-group-lg mb-3">
            <input
              type="text"
              className="form-control border-primary"
              placeholder="Enter Exam ID (e.g., 1)"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            />
            <button 
              className="btn btn-primary px-4" 
              type="button" 
              onClick={handleStartExam}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : 'Find Exam'}
            </button>
          </div>
          
          {error && <div className="alert alert-danger mt-3">{error}</div>}

          {exam && !isExamStarted && (
            <div className="mt-4 p-4 border-start border-4 border-success bg-light rounded shadow-sm animate__animated animate__fadeIn">
              <h4 className="fw-bold text-success mb-2">{exam.title}</h4>
              <div className="d-flex gap-3 mb-4 text-muted">
                <span><i className="bi bi-question-circle me-1"></i> {exam.questions.length} Questions</span>
                <span><i className="bi bi-clock me-1"></i> Self-paced</span>
              </div>
              
              {/* הזנת סיסמת הבחינה אם יש */}
              {exam.password && (
                <div className="mb-3">
                  <label className="form-label fw-bold small text-uppercase text-muted">This exam is password protected</label>
                  <input 
                    type="password" 
                    className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                    placeholder="Enter password to start"
                    value={enteredPassword}
                    onChange={(e) => {
                      setEnteredPassword(e.target.value);
                      setPasswordError('');
                    }}
                  />
                  {/* שגיאה בסיסמה */}
                  {passwordError && <div className="invalid-feedback">{passwordError}</div>}
                </div>
              )}

              {/* תחילת הבחינה */}
              <button className="btn btn-success btn-lg w-100 fw-bold" onClick={startTakingExam}>
                Start Exam Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSearch;
