import React, { useState, useEffect } from 'react';

const ExamTaker = ({ 
  exam, 
  currentQuestionIndex, 
  setCurrentQuestionIndex, 
  selectedAnswers, 
  handleAnswerChange, 
  handleSubmitExam 
}) => {
  const [timeLeft, setTimeLeft] = useState((exam.timeLimit || 30) * 60); // Time in seconds
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // handles the timer and submits the exam after the time has finished
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmitExam]);

  // the timer format from seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const question = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  // טעינת התשובות
  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return (
          <div className="list-group mt-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`list-group-item list-group-item-action ${selectedAnswers[question.id] === option ? 'active' : ''}`}
                onClick={() => handleAnswerChange(question.id, option, question.type)}
              >
                {option}
              </button>
            ))}
          </div>
        );
      case 'multiple-response':
        return (
          <div className="list-group mt-3">
            {question.options.map((option, index) => {
              const isSelected = (selectedAnswers[question.id] || []).includes(option);
              return (
                <button
                  key={index}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${isSelected ? 'list-group-item-primary' : ''}`}
                  onClick={() => handleAnswerChange(question.id, option, question.type)}
                >
                  {option}
                  {isSelected && <span className="badge bg-primary rounded-pill">Selected</span>}
                </button>
              );
            })}
            <div className="form-text mt-2">Select all that apply.</div>
          </div>
        );
      case 'written':
        return (
          <div className="mt-3">
            <textarea
              className="form-control"
              rows="3"
              placeholder="Type your answer here..."
              value={selectedAnswers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="progress flex-grow-1 me-4" style={{height: '10px'}}>
          <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{width: `${progress}%`}}></div>
        </div>
        <div className={`badge ${timeLeft < 60 ? 'bg-danger animate__animated animate__pulse animate__infinite' : 'bg-dark'} px-3 py-2 fs-6 shadow-sm d-flex align-items-center`}>
          <i className="bi bi-clock-fill me-2"></i>
          <span className="font-monospace">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="card shadow border-0">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-primary fw-bold">{exam.title}</h4>
          <span className="badge bg-secondary py-2 px-3">Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
        </div>
        <div className="card-body p-4">
          <h5 className="card-title mb-4 lh-base">{question.text}</h5>
          {renderQuestionInput(question)}
        </div>
        <div className="card-footer bg-white border-0 p-4 d-flex justify-content-between">
          <button 
            className="btn btn-outline-secondary px-4" 
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          
          {currentQuestionIndex === exam.questions.length - 1 ? (
            <button 
              className="btn btn-success px-5 fw-bold" 
              onClick={() => setShowConfirmModal(true)}
            >
              Submit Exam
            </button>
          ) : (
            <button 
              className="btn btn-primary px-5" 
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="card shadow-lg border-0 animate__animated animate__zoomIn" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="card-body p-4 text-center">
              <div className="display-4 text-warning mb-3">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <h4 className="fw-bold mb-3">Ready to Submit?</h4>
              <p className="text-muted mb-4">
                You are about to finish the exam. Once submitted, you cannot change your answers.
              </p>
              <div className="d-grid gap-2">
                <button className="btn btn-success btn-lg fw-bold" onClick={handleSubmitExam}>
                  Yes, Submit Now
                </button>
                <button className="btn btn-light" onClick={() => setShowConfirmModal(false)}>
                  Cancel and Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTaker;
