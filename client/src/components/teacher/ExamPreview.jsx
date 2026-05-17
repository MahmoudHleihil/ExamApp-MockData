import React from 'react';

const ExamPreview = ({ previewExam, onBack, onEdit }) => {
  return (
    <div className="container mt-4 animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Exam Preview</h2>
        <button className="btn btn-secondary" onClick={onBack}>Back to List</button>
      </div>
      <div className="card shadow mb-5 border-0">
        <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">{previewExam.title}</h4>
            <small className="opacity-75">Internal ID: {previewExam.id}</small>
          </div>
          {previewExam.password && (
            <div className="badge bg-warning text-dark p-2">
              <i className="bi bi-lock-fill me-1"></i>
              Password: <strong>{previewExam.password}</strong>
            </div>
          )}
        </div>
        <div className="card-body p-4">
          {previewExam.questions.map((q, idx) => (
            <div key={q.id || idx} className="mb-4 p-3 rounded bg-light border-start border-4 border-primary">
              <h5 className="fw-bold">{idx + 1}. {q.text} 
                <span className="badge bg-info text-dark ms-2 small fw-normal">{q.type}</span>
              </h5>
              <div className="mt-3 ms-3">
                {q.type === 'written' ? (
                  <div className="mt-2">
                    <input type="text" className="form-control bg-white" placeholder="Student will type here..." disabled />
                  </div>
                ) : (
                  <ul className="list-group shadow-sm">
                    {q.options.map((opt, oIdx) => (
                      <li key={oIdx} className="list-group-item d-flex align-items-center">
                        <input 
                          type={q.type === 'multiple-response' ? "checkbox" : "radio"} 
                          className="form-check-input me-3" 
                          disabled 
                        />
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 p-2 bg-success bg-opacity-10 rounded">
                  <span className="text-success fw-bold small">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Correct Answer: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="card-footer bg-white text-end py-3">
          <button className="btn btn-outline-primary px-4" onClick={() => onEdit(previewExam.id)}>
            Edit This Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamPreview;
