import React, { useState, useEffect } from 'react';
import { examService } from '../api/examService';

const TeacherDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examService.getAllExams();
        setExams(data);
      } catch (error) {
        console.error("Failed to fetch exams:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div className="container mt-4">
      <h2>Teacher Dashboard</h2>
      <div className="card shadow-sm mt-3">
        <div className="card-body">
          <h5 className="card-title">Manage Exams</h5>
          {loading ? (
            <p>Loading exams...</p>
          ) : (
            <div className="list-group mt-3">
              {exams.map(exam => (
                <div key={exam.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{exam.title}</strong>
                    <br />
                    <small className="text-muted">{exam.questions.length} Questions</small>
                  </div>
                  <span className="badge bg-primary rounded-pill">ID: {exam.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
