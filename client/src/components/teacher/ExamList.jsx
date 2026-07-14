import React from 'react';

// רכיב של רשימת המבחנים.
const ExamList = ({ exams, loading, onEdit, onDelete, onPreview, onPublish, deletingId, setDeletingId, publishingId, }) => {
  // אם השאלות עדיין לא נטענו אז זה מוצג.
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading exams...</p>
      </div>
    );
  }

  // רשימת המבחנים.
  return (
    <div className="card shadow-sm border-0 animate__animated animate__fadeIn" data-testid="exam-list">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3">Exam Title</th>
                <th className="py-3">Questions</th>
                <th className="py-3">Exam ID</th>
                <th className="text-end pe-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => {
                const now = new Date();
                const scheduledDate = new Date(exam.scheduledDate);
                const expiryDate = new Date(scheduledDate.getTime() + (exam.timeLimit || 60) * 60000);
                const isExpired = !exam.isAlwaysAvailable && now > expiryDate;

                return (
                  <tr key={exam.id}
                  data-testid="exam-card"
                  data-exam-id={exam.id}>
                    <td className="ps-4">
                      <span className="fw-bold text-dark" 
                      data-testid="exam-card-title">{exam.title}</span>
                      <span
                        className={`badge ms-2 ${
                          exam.published || exam.isPublished
                            ? "bg-primary"
                            : "bg-secondary"
                        }`}
                        data-testid="exam-publish-status"
                      >
                        {exam.published || exam.isPublished
                          ? "Published"
                          : "Draft"}
                      </span>
                      {exam.isAlwaysAvailable ? (
                        <span className="badge bg-success text-white ms-2 small"
                        data-testid="exam-status">Always Open</span>
                      ) : isExpired && (
                        <span className="badge bg-warning text-dark ms-2 small" 
                        data-testid="exam-status">Expired</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-secondary rounded-pill"
                      data-testid="exam-question-count">{exam.questions.length} Questions</span>
                    </td>
                    <td>
                      <code className="bg-light p-1 rounded text-muted small"
                      data-testid="exam-id">{exam.id}</code>
                    </td>
                    <td className="text-end pe-4">
                      {/* אם אנחנו במהלך מחיקת המבחן הזה אז שני Confirm Delete ו Cancel מוצגות, אחרת Preview, Edit ו Delete מוצג*/}
                      {deletingId === exam.id ? (
                        <div className="btn-group btn-group-sm animate__animated animate__pulse">
                          <button 
                            className="btn btn-danger fw-bold px-3" 
                            onClick={() => onDelete(exam.id)}
                            data-testid="exam-confirm-delete"
                          >
                            Confirm Delete
                          </button>
                          <button 
                            className="btn btn-secondary px-3" 
                            onClick={() => setDeletingId(null)}
                            data-testid="exam-cancel-delete"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-info" 
                            onClick={() => onPreview(exam.id)}
                            title="Preview"
                            data-testid="exam-preview-button"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            onClick={() => onPublish(exam.id)}
                            disabled={
                              publishingId === exam.id ||
                              exam.published ||
                              exam.isPublished ||
                              isExpired
                            }
                            data-testid="exam-publish-button"
                            title={
                              exam.published || exam.isPublished
                                ? "Already published"
                                : "Publish"
                            }
                          >
                            {publishingId === exam.id
                              ? "Publishing..."
                              : exam.published || exam.isPublished
                                ? "Published"
                                : "Publish"}
                          </button>
                          <button 
                            className="btn btn-outline-primary" 
                            onClick={() => onEdit(exam.id)}
                            disabled={isExpired}
                            title={isExpired ? "Cannot edit expired exam" : "Edit"}
                            data-testid="exam-edit-button"
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-outline-danger" 
                            onClick={() => setDeletingId(exam.id)}
                            title="Delete"
                            data-testid="exam-delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* אם אין מבחנים אז זה מיוצג */}
              {exams.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox display-4 d-block mb-3 opacity-25"></i>
                    No exams found. Create your first one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamList;
