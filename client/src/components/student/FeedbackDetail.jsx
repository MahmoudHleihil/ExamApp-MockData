const FeedbackDetail = ({ 
  selectedFeedback, 
  setSelectedFeedback, 
  feedbackExam, 
  setFeedbackExam, 
  showFullReview, 
  setShowFullReview 
}) => {
  return (
    <div className="animate__animated animate__fadeIn">
      <button className="btn btn-link mb-3 p-0" onClick={() => { setSelectedFeedback(null); setFeedbackExam(null); }}>
        <i className="bi bi-arrow-left me-1"></i> Back to Submissions
      </button>
      
      {/* הםשוב */}
      {!showFullReview ? (
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="card-header bg-primary text-white py-3">
            <h5 className="mb-0 fw-bold">Review for {selectedFeedback.examTitle}</h5>
          </div>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
              <div>
                <h6 className="text-muted small text-uppercase fw-bold mb-1">Your Final Score</h6>
                <h3 className={`fw-bold mb-0 ${selectedFeedback.score >= 60 ? 'text-success' : 'text-danger'}`}>
                  {selectedFeedback.score.toFixed(0)}%
                </h3>
              </div>
              <div className="text-end">
                <h6 className="text-muted small text-uppercase fw-bold mb-1">Date Submitted</h6>
                <p className="mb-0 fw-medium">{new Date(selectedFeedback.date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="p-4 bg-light rounded-4 border-start border-4 border-primary mb-4">
              <h6 className="fw-bold mb-3"><i className="bi bi-chat-left-text me-2"></i>Teacher's Overall Comments</h6>
              <p className="mb-0 lh-base text-dark" style={{whiteSpace: 'pre-wrap'}}>
                {selectedFeedback.feedback || "Great work! You've successfully completed the assessment."}
              </p>
            </div>

            <div className="text-center">
              <button 
                className="btn btn-outline-primary px-5 fw-bold" 
                onClick={() => setShowFullReview(true)}
                disabled={!feedbackExam}
              >
                <i className="bi bi-eye me-2"></i>View Detailed Question Review
              </button>
            </div>
          </div>
        </div>
      ) : (
        // המשוב המפןרט
        <div className="animate__animated animate__fadeIn">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold text-dark mb-0">Detailed Review: {selectedFeedback.examTitle}</h4>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowFullReview(false)}>
              Close Breakdown
            </button>
          </div>

          <div className="list-group shadow-sm rounded-4 overflow-hidden mb-5">
            {feedbackExam.questions.map((q, index) => {
              const studentAns = selectedFeedback.answers[q.id];
              const correctAns = q.correctAnswer;
              const qFeedback = selectedFeedback.questionFeedback?.[q.id];
              
              const isCorrect = q.type === 'multiple-response' 
                ? (Array.isArray(studentAns) && Array.isArray(correctAns) &&
                   studentAns.length === correctAns.length && 
                   studentAns.every(val => correctAns.includes(val)))
                : q.type === 'written'
                ? (studentAns?.toString().trim().toLowerCase() === correctAns?.toString().trim().toLowerCase())
                : (studentAns === correctAns);

              return (
                <div key={q.id} className="list-group-item p-4">
                  <div className="d-flex justify-content-between mb-3">
                    <h6 className="fw-bold mb-0">
                      <span className="text-muted me-2">{index + 1}.</span> {q.text}
                    </h6>
                    <span className={`badge ${isCorrect ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <div className="p-2 px-3 bg-light rounded border-start border-3 border-primary">
                        <small className="text-uppercase text-muted fw-bold d-block mb-1" style={{fontSize: '0.7rem'}}>Your Answer</small>
                        <span className="small">{Array.isArray(studentAns) ? studentAns.join(', ') : (studentAns || 'N/A')}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-2 px-3 bg-light rounded border-start border-3 border-success">
                        <small className="text-uppercase text-muted fw-bold d-block mb-1" style={{fontSize: '0.7rem'}}>Correct Answer</small>
                        <span className="small">{Array.isArray(correctAns) ? correctAns.join(', ') : correctAns}</span>
                      </div>
                    </div>
                  </div>

                  {qFeedback && (
                    <div className="p-3 bg-warning-subtle rounded border-start border-4 border-warning">
                      <small className="text-uppercase text-warning-emphasis fw-bold d-block mb-1" style={{fontSize: '0.7rem'}}>Teacher's Note</small>
                      <p className="small mb-0 italic">{qFeedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDetail;
