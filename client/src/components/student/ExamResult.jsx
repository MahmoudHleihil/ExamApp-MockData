// רכיב שאחרי הגשת הבחינה
const ExamResult = ({ finalResult, onGoToSubmissions }) => {
  return (
    <div className="container mt-4 text-center">
      <div className="card shadow border-0 p-5 bg-light">
        <div className="mb-4">
          <div className="display-1 text-primary mb-2">
            <i className="bi bi-send-check"></i>
          </div>
          <h2 className="fw-bold">Exam Submitted!</h2>
          <p className="text-muted">Your answers for <strong>{finalResult.examTitle}</strong> have been received.</p>
        </div>
        
        <div className="card mx-auto shadow-sm" style={{maxWidth: '450px'}}>
          <div className="card-body p-4">
            <i className="bi bi-info-circle text-info fs-3 mb-3 d-block"></i>
            <h5 className="fw-bold">Marking in Progress</h5>
            <p className="text-muted small mb-0">
              Your score and detailed feedback will be available once the teacher finishes reviewing your work. 
              Please check the "My Feedback" tab later.
            </p>
          </div>
        </div>

        <button 
          className="btn btn-primary mt-5 px-5" 
          onClick={onGoToSubmissions}
        >
          Go to Submissions
        </button>
      </div>
    </div>
  );
};

export default ExamResult;
