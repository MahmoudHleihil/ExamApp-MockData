import React from 'react';

// רכיב של רשימת המבחנים.
const ExamList = ({ exams, loading, onEdit, onDelete, onPreview, deletingId, setDeletingId }) => {
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
    <div className="card shadow-sm border-0 animate__animated animate__fadeIn">
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
              {exams.map(exam => (
                <tr key={exam.id}>
                  <td className="ps-4">
                    <span className="fw-bold text-dark">{exam.title}</span>
                  </td>
                  <td>
                    <span className="badge bg-secondary rounded-pill">{exam.questions.length} Questions</span>
                  </td>
                  <td>
                    <code className="bg-light p-1 rounded text-muted small">{exam.id}</code>
                  </td>
                  <td className="text-end pe-4">
                    {/* אם אנחנו במהלך מחיקת המבחן הזה אז שני Confirm Delete ו Cancel מוצגות, אחרת Preview, Edit ו Delete מוצג*/}
                    {deletingId === exam.id ? (
                      <div className="btn-group btn-group-sm animate__animated animate__pulse">
                        <button 
                          className="btn btn-danger fw-bold px-3" 
                          onClick={() => onDelete(exam.id)}
                        >
                          Confirm Delete
                        </button>
                        <button 
                          className="btn btn-secondary px-3" 
                          onClick={() => setDeletingId(null)}
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
                        >
                          Preview
                        </button>
                        <button 
                          className="btn btn-outline-primary" 
                          onClick={() => onEdit(exam.id)}
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-outline-danger" 
                          onClick={() => setDeletingId(exam.id)}
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
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
