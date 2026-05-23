import React, { useState, useEffect } from 'react';
import { examService } from '../../api/examService';

// רכיב להצגת נתוני ההגשה
const SubmissionDetail = ({ submission, exam, onBack }) => {
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [questionFeedback, setQuestionFeedback] = useState(submission?.questionFeedback || {});
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(submission?.isFeedbackVisible || false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // בכל שינוי בהגשה טוענים אותה שוב
  useEffect(() => {
    setFeedback(submission?.feedback || '');
    setQuestionFeedback(submission?.questionFeedback || {});
    setIsFeedbackVisible(submission?.isFeedbackVisible || false);
    setSaveMessage('');
  }, [submission]);

  if (!submission || !exam) return null;

  // חישוב ציון המבחן.
  const calculateScore = () => {
    let totalPoints = 0;

    // הוספת נקודה אחת לכל תשובה נכונה.
    exam.questions.forEach(q => {
      const studentAns = submission.answers[q.id];
      const correctAns = q.correctAnswer;

      if (q.type === 'multiple-response') {
        // All correct options must be selected, and no incorrect ones
        if (Array.isArray(studentAns) && Array.isArray(correctAns)) {
          const isCorrect = studentAns.length === correctAns.length && 
                          studentAns.every(val => correctAns.includes(val));
          if (isCorrect) totalPoints++;
        }
      } else if (q.type === 'written') {
        if (typeof studentAns === 'string' && typeof correctAns === 'string') {
          if (studentAns.trim().toLowerCase() === correctAns.trim().toLowerCase()) {
            totalPoints++;
          }
        }
      } else {
        // multiple-choice, true-false
        if (studentAns === correctAns) {
          totalPoints++;
        }
      }
    });

    // חישוב והחזרת הציון.
    return (totalPoints / exam.questions.length) * 100;
  };

  // פונקציה אסינכרונית לשמירת המשוב
  const handleSaveFeedback = async () => {
    setIsSaving(true);
    setSaveMessage('');
    const finalScore = calculateScore();
    try {
      await examService.updateSubmissionFeedback(submission.id, feedback, questionFeedback, isFeedbackVisible, finalScore);
      setSaveMessage('Review released successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error("Failed to save feedback:", error);
      setSaveMessage('Failed to release review.');
    } finally {
      setIsSaving(false);
    }
  };

  // פונציה לשנות את המשוב על השאלה
  const handleQuestionFeedbackChange = (qId, text) => {
    setQuestionFeedback(prev => ({
      ...prev,
      [qId]: text
    }));
  };

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Marking Submission</h3>
          <p className="text-muted mb-0">{submission.studentName} - {exam.title}</p>
        </div>
        <button className="btn btn-outline-secondary px-4" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back to List
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 p-3 text-center">
            <small className="text-uppercase text-muted fw-bold mb-2">Calculated Score</small>
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
            <small className="text-uppercase text-muted fw-bold mb-2">Review Status</small>
            <h5 className="mt-2">
              <span className={`badge rounded-pill px-4 py-2 ${isFeedbackVisible ? 'bg-success' : 'bg-warning'}`}>
                {isFeedbackVisible ? 'Released' : 'Private'}
              </span>
            </h5>
          </div>
        </div>
      </div>

      {/* Teacher Feedback Section */}
      <div className="card border-0 shadow-sm mb-4 overflow-hidden">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">General Review & Overall Feedback</h5>
          {saveMessage && (
            <span className={`badge ${saveMessage.includes('success') ? 'bg-success' : 'bg-danger'} animate__animated animate__fadeIn`}>
              {saveMessage}
            </span>
          )}
        </div>
        <div className="card-body p-4 bg-light-subtle">
          <div className="mb-3">
            <label htmlFor="feedbackText" className="form-label fw-semibold">Overall Comments</label>
            <textarea 
              className="form-control border-0 shadow-sm" 
              id="feedbackText" 
              rows="3" 
              placeholder="Enter your overall feedback here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            ></textarea>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="form-check form-switch">
              {/* תיבת סימון לתת רשות לסטודנט לצפות במשוב */}
              <input 
                className="form-check-input" 
                type="checkbox" 
                role="switch" 
                id="visibilitySwitch"
                checked={isFeedbackVisible}
                onChange={(e) => setIsFeedbackVisible(e.target.checked)}
              />
              <label className="form-check-label fw-medium" htmlFor="visibilitySwitch">
                Release score and review to student
              </label>
            </div>
            <button 
              className="btn btn-success px-4 fw-bold shadow-sm" 
              onClick={handleSaveFeedback}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-upload me-2"></i>Apply & Release
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden mb-5">
        <div className="card-header bg-white border-0 py-3">
          <h5 className="fw-bold mb-0">Question Breakdown & Specific Feedback</h5>
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
                    <div className="col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border-start border-4 border-primary">
                        <small className="text-uppercase text-muted fw-bold d-block mb-1">Student Answer</small>
                        <div className="fw-semibold text-dark">
                          {Array.isArray(studentAns) ? studentAns.join(', ') : (studentAns || <span className="text-muted italic">No answer provided</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3 bg-light rounded-3 h-100 border-start border-4 border-success">
                        <small className="text-uppercase text-muted fw-bold d-block mb-1">Correct Answer</small>
                        <div className="fw-semibold text-dark">
                          {Array.isArray(correctAns) ? correctAns.join(', ') : correctAns}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3 bg-white border rounded-3 h-100">
                        <small className="text-uppercase text-muted fw-bold d-block mb-1 text-primary">Question Feedback</small>
                        <textarea 
                          className="form-control form-control-sm border-0 bg-transparent p-0" 
                          rows="2" 
                          placeholder="Specific feedback..."
                          value={questionFeedback[q.id] || ''}
                          onChange={(e) => handleQuestionFeedbackChange(q.id, e.target.value)}
                        />
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
