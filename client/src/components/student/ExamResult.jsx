// רכיב שאחרי הגשת הבחינה
const ExamResult = ({ finalResult, onGoToSubmissions }) => {
  const isPassed = finalResult.isPassed;
  const showScore = finalResult.releaseScoresImmediately;

  return (
    <div className="container mt-4 text-center animate__animated animate__fadeIn">
      <div className="card shadow border-0 p-5 bg-white rounded-4">
        <div className="mb-4">
          <div className={`display-1 ${showScore ? (isPassed ? 'text-success' : 'text-danger') : 'text-primary'} mb-2`}>
            <i className={`bi ${showScore ? (isPassed ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill') : 'bi-send-check-fill'}`}></i>
          </div>
          <h2 className="fw-bold">
            {showScore ? (isPassed ? 'Congratulations!' : 'Exam Completed') : 'Exam Submitted!'}
          </h2>
          <p className="text-muted fs-5">You've finished <strong>{finalResult.examTitle}</strong></p>
        </div>
        
        {showScore ? (
          <div className="card mx-auto shadow-sm border-0 bg-light rounded-4 mb-4" style={{maxWidth: '500px'}}>
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-6 border-end">
                  <div className="small text-uppercase fw-bold text-muted mb-1">Your Score</div>
                  <div className={`display-4 fw-bold ${isPassed ? 'text-success' : 'text-danger'}`}>
                    {finalResult.score}%
                  </div>
                </div>
                <div className="col-6">
                  <div className="small text-uppercase fw-bold text-muted mb-1">Result</div>
                  <div className={`h2 fw-bold mb-0 ${isPassed ? 'text-success' : 'text-danger'}`}>
                    {isPassed ? 'PASSED' : 'FAILED'}
                  </div>
                  <div className="small text-muted mt-1">Passing: {finalResult.passingScore}%</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card mx-auto shadow-sm border-0 bg-light rounded-4 mb-4" style={{maxWidth: '500px'}}>
            <div className="card-body p-4">
              <i className="bi bi-clock-history text-primary fs-3 mb-3 d-block"></i>
              <h5 className="fw-bold">Marking in Progress</h5>
              <p className="text-muted small mb-0">
                The teacher has chosen to review all submissions before releasing scores. 
                Your results will be available in the "My Feedback" tab once released.
              </p>
            </div>
          </div>
        )}

        {showScore && (
          <div className="alert alert-info border-0 shadow-sm mx-auto" style={{maxWidth: '500px'}}>
            <i className="bi bi-info-circle-fill me-2"></i>
            {finalResult.feedback}
          </div>
        )}

        <button 
          className="btn btn-primary mt-4 px-5 py-3 fw-bold rounded-pill shadow" 
          onClick={onGoToSubmissions}
        >
          View All My Submissions
        </button>
      </div>
    </div>
  );
};

export default ExamResult;
