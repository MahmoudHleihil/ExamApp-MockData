import React, { useState, useEffect } from 'react';

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
  const [now, setNow] = useState(new Date());

  // setting the timer
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdown = (targetDate) => {
    const diff = new Date(targetDate) - now;
    if (diff <= 0) return null;
    
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isBeforeStart = exam && !exam.isAlwaysAvailable ? now < new Date(exam.scheduledDate) : false;
  const countdown = exam && !exam.isAlwaysAvailable ? getCountdown(exam.scheduledDate) : null;

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
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h4 className="fw-bold text-success mb-0">{exam.title}</h4>
                {exam.isAlwaysAvailable ? (
                  <span className="badge bg-success text-white px-3 py-2 rounded-pill shadow-sm">
                    <i className="bi bi-unlock-fill me-2"></i>
                    Always Open
                  </span>
                ) : isBeforeStart && (
                  <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">
                    <i className="bi bi-hourglass-split me-2"></i>
                    Starting in {countdown}
                  </span>
                )}
              </div>
              <div className="d-flex flex-wrap gap-3 mb-4 text-muted">
                <span><i className="bi bi-question-circle me-1"></i> {exam.questions.length} Questions</span>
                <span><i className="bi bi-clock me-1"></i> {exam.timeLimit} Minutes</span>
                {!exam.isAlwaysAvailable && (
                  <span><i className="bi bi-calendar-event me-1"></i> {new Date(exam.scheduledDate).toLocaleString()}</span>
                )}
                <span><i className="bi bi-award me-1"></i> {exam.passingScore}% to Pass</span>
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
              <button 
                className={`btn btn-lg w-100 fw-bold shadow-sm ${isBeforeStart ? 'btn-secondary' : 'btn-success'}`} 
                onClick={startTakingExam}
                disabled={isBeforeStart}
              >
                {isBeforeStart ? (
                  <>
                    <span className="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                    Waiting for Exam to Open...
                  </>
                ) : 'Start Exam Now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSearch;
