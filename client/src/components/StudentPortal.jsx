import React, { useState } from 'react';
import { examService } from '../api/examService';

const StudentPortal = () => {
  const [examId, setExamId] = useState('');
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartExam = async () => {
    if (!examId) return;
    setLoading(true);
    setError('');
    setExam(null);
    try {
      const data = await examService.getExamById(examId);
      setExam(data);
    } catch (err) {
      setError('Exam not found. Please check the ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Student Portal</h2>
      <div className="card shadow-sm mt-3">
        <div className="card-body">
          <h5 className="card-title">Enter Exam ID to Start</h5>
          <div className="input-group mb-3 mt-3">
            <input
              type="text"
              className="form-control"
              placeholder="Example: 1"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            />
            <button 
              className="btn btn-primary" 
              type="button" 
              onClick={handleStartExam}
              disabled={loading}
            >
              {loading ? 'Fetching...' : 'Start Exam'}
            </button>
          </div>
          
          {error && <div className="alert alert-danger">{error}</div>}

          {exam && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h4>Ready for: {exam.title}</h4>
              <p>{exam.questions.length} questions will be presented.</p>
              <button className="btn btn-success">Begin Now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
