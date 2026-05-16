import React, { useState, useEffect } from 'react';
import { examService } from '../api/examService';

// רכיב הדשבורד של המורה.
const TeacherDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Exam Form State
  const [newExam, setNewExam] = useState({
    title: '',
    questions: [
      { id: 'q1', text: '', options: ['', '', '', ''], correctAnswer: '' }
    ]
  });

  // פונקציה אסינכרונית לבקש ולעדכן המבחנים ברכיב.
  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await examService.getAllExams();
      setExams(data);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
    } finally {
      setLoading(false);
    }
  };

  // רץ רק אחרי שהרכיב נטען.
  useEffect(() => {
    fetchExams();
  }, []);

  // פונקציה של הוספת שאלה.
  const handleAddQuestion = () => {
    setNewExam(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: `q${prev.questions.length + 1}`, text: '', options: ['', '', '', ''], correctAnswer: '' }
      ]
    }));
  };

  // פונקציה של עדכון השאלה.
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...newExam.questions];
    updatedQuestions[index][field] = value;
    setNewExam(prev => ({ ...prev, questions: updatedQuestions }));
  };

  // פונקציה של שינוי בחירת תשובה.
  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...newExam.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setNewExam(prev => ({ ...prev, questions: updatedQuestions }));
  };

  // פונקציה של ייצור בחינה.
  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await examService.createExam(newExam);
      setShowAddForm(false);
      setNewExam({
        title: '',
        questions: [{ id: 'q1', text: '', options: ['', '', '', ''], correctAnswer: '' }]
      });
      fetchExams();
    } catch (error) {
      alert("Failed to create exam");
    }
  };

  // הצגת הרכיב.
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Teacher Dashboard</h2>
        <button 
          className={`btn ${showAddForm ? 'btn-secondary' : 'btn-success'}`}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Exam'}
        </button>
      </div>

      // טופס הוספת המבחן.
      {showAddForm && (
        <div className="card shadow-sm mt-3">
          <div className="card-body">
            <h5 className="card-title">Create New Exam</h5>
            <form onSubmit={handleCreateExam}>
              <div className="mb-3">
                <label className="form-label">Exam Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newExam.title} 
                  onChange={(e) => setNewExam({...newExam, title: e.target.value})}
                  required 
                />
              </div>
              
              <h6>Questions</h6>
              {newExam.questions.map((q, qIndex) => (
                <div key={qIndex} className="border p-3 mb-3 rounded">
                  <div className="mb-2">
                    <label className="form-label">Question {qIndex + 1}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={q.text} 
                      onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="row g-2">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="col-md-6">
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          placeholder={`Option ${oIndex + 1}`}
                          value={opt} 
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          required 
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="form-label small text-muted">Correct Answer</label>
                    <select 
                      className="form-select form-select-sm" 
                      value={q.correctAnswer} 
                      onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                      required
                    >
                      <option value="">Select correct option</option>
                      {q.options.map((opt, oIndex) => (
                        <option key={oIndex} value={opt}>{opt || `Option ${oIndex + 1}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddQuestion}>
                  + Add Question
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      // הצגת המבחנים.
      <div className="card shadow-sm mt-3">
        <div className="card-body">
          <h5 className="card-title">Manage Existing Exams</h5>
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
