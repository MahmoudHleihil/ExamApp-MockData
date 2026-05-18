const FeedbackList = ({ studentSubmissions, handleViewFeedback }) => {
  return (
    <div className="animate__animated animate__fadeIn">
      <h3 className="fw-bold mb-4">My Exam Results</h3>
      {studentSubmissions.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center bg-light">
          <i className="bi bi-clipboard-x display-1 text-muted opacity-25 mb-3"></i>
          <p className="text-muted fs-5">You haven't submitted any exams yet.</p>
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded-4 overflow-hidden">
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Exam Title</th>
                <th>Date</th>
                <th>Status</th>
                <th>Score</th>
                <th className="text-end pe-4">Review</th>
              </tr>
            </thead>
            <tbody>
              {studentSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="ps-4 fw-semibold">{submission.examTitle}</td>
                  <td className="text-muted small">
                    {new Date(submission.date).toLocaleDateString()}
                  </td>
                  <td>
                    {submission.isFeedbackVisible ? (
                      <span className="badge bg-success-subtle text-success rounded-pill px-3">Marked</span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning rounded-pill px-3">Awaiting Review</span>
                    )}
                  </td>
                  <td>
                    {/* אם יש המשוב הציון מוצג */}
                    {submission.isFeedbackVisible ? (
                      <span className={`fw-bold ${submission.score >= 60 ? 'text-success' : 'text-danger'}`}>
                        {submission.score.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-muted small">---</span>
                    )}
                  </td>
                  <td className="text-end pe-4">
                    {/* אם יש משוב אז נטען הכפתור לצפייה במשוב אחרת נראה Private */}
                    {submission.isFeedbackVisible ? (
                      <button 
                        className="btn btn-sm btn-primary px-3 rounded-pill fw-bold"
                        onClick={() => handleViewFeedback(submission)}
                      >
                        View Results
                      </button>
                    ) : (
                      <span className="text-muted small italic">
                        <i className="bi bi-lock-fill me-1"></i> Private
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
