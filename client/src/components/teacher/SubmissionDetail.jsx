import React from 'react';

// רכיב להצגת נתוני ההגשה
const SubmissionDetail = ({ submission, exam, onBack }) => {
  if (!submission || !exam) return null;

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Submission Details</h3>
          <p className="text-muted mb-0">{submission.studentName} - {exam.title}</p>
        </div>
        <button className="btn btn-outline-secondary px-4" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back to List
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 p-3 text-center">
            <small className="text-uppercase text-muted fw-bold mb-2">Final Score</small>
            <h2 className={`display-5 fw-bold mb-0 ${submission.score >= 60 ? 'text-success' : 'text-danger'}`}>
              {submission.score.toFixed(0)}%
            </h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 p-3 text-center">
            <small className="text-uppercase text-muted fw-bold mb-2">Submitted On</small>
            <h5 className="fw-bold mb-0">{new Date(submission.date).toLocaleDateString()}</h5>
            <small className="text-muted">{new Date(submission.date).toLocaleTimeString()}</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 p-3 text-center">
            <small className="text-uppercase text-muted fw-bold mb-2">Questions</small>
            <h2 className="display-5 fw-bold mb-0 text-primary">{exam.questions.length}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 p-3 text-center">
            <small className="text-uppercase text-muted fw-bold mb-2">Status</small>
            <h5 className="mt-2">
              <span className={`badge rounded-pill px-4 py-2 ${submission.score >= 60 ? 'bg-success' : 'bg-danger'}`}>
                {submission.score >= 60 ? 'Passed' : 'Failed'}
              </span>
            </h5>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-header bg-white border-0 py-3">
          <h5 className="fw-bold mb-0">Question Breakdown</h5>
        </div>
        <div className="card-body p-0">
          <div className="list-group list-group-flush">
            {exam.questions.map((q, index) => {
              const studentAns = submission.answers[q.id];
              const correctAns = q.correctAnswer;
              let isCorrect = false;

              if (q.type === 'multiple-response') {
                isCorrect = Array.isArray(studentAns) && Array.isArray(correctAns) &&
                            studentAns.length === correctAns.length && 
                            studentAns.every(val => correctAns.includes(val));
              } else if (q.type === 'written') {
                isCorrect = studentAns?.toString().trim().toLowerCase() === correctAns?.toString().trim().toLowerCase();
              } else {
                isCorrect = studentAns === correctAns;
              }

              return (
                <div key={q.id} className="list-group-item p-4">
                  <div className="d-flex justify-content-between mb-3">
                    <h6 className="fw-bold mb-0">
                      <span className="text-muted me-2">Q{index + 1}.</span> {q.text}
                    </h6>
                    <span className={`badge ${isCorrect ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} d-flex align-items-center`}>
                      <i className={`bi bi-${isCorrect ? 'check' : 'x'}-circle me-1`}></i>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100 border-start border-4 border-primary">
                        <small className="text-uppercase text-muted fw-bold d-block mb-1">Student Answer</small>
                        <div className="fw-semibold text-dark">
                          {Array.isArray(studentAns) ? studentAns.join(', ') : (studentAns || <span className="text-muted italic">No answer provided</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 h-100 border-start border-4 border-success">
                        <small className="text-uppercase text-muted fw-bold d-block mb-1">Correct Answer</small>
                        <div className="fw-semibold text-dark">
                          {Array.isArray(correctAns) ? correctAns.join(', ') : correctAns}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
