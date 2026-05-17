import React, { useState } from 'react';
import { examService } from '../api/examService';

const StudentPortal = () => {
  const [examId, setExamId] = useState('');
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Exam-taking state
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const handleStartExam = async () => {
    if (!examId) return;
    setLoading(true);
    setError('');
    setExam(null);
    setIsExamStarted(false);
    setIsSubmitted(false);
    setEnteredPassword('');
    setPasswordError('');
    try {
      const data = await examService.getExamById(examId);
      setExam(data);
    } catch (err) {
      setError('Exam not found. Please check the ID.');
    } finally {
      setLoading(false);
    }
  };

  const startTakingExam = () => {
    if (exam.password && enteredPassword !== exam.password) {
      setPasswordError('Incorrect password. Please try again.');
      return;
    }
    setIsExamStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const handleAnswerChange = (questionId, answer, type) => {
    if (type === 'multiple-response') {
      setSelectedAnswers(prev => {
        const current = prev[questionId] || [];
        if (current.includes(answer)) {
          return { ...prev, [questionId]: current.filter(a => a !== answer) };
        } else {
          return { ...prev, [questionId]: [...current, answer] };
        }
      });
    } else {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    }
  };

  const calculateScore = () => {
    let totalPoints = 0;
    exam.questions.forEach(q => {
      const studentAns = selectedAnswers[q.id];
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
    return (totalPoints / exam.questions.length) * 100;
  };

  const handleSubmitExam = async () => {
    const score = calculateScore();
    const result = {
      examId: exam.id,
      examTitle: exam.title,
      score: score,
      studentName: 'Student User',
      date: new Date().toISOString(),
      answers: selectedAnswers
    };

    try {
      await examService.submitScore(result);
      setFinalResult(result);
      setIsSubmitted(true);
      setIsExamStarted(false);
    } catch (err) {
      setError('Failed to submit exam.');
    }
  };

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

  if (isSubmitted && finalResult) {
    return (
      <div className="container mt-4 text-center">
        <div className="card shadow border-0 p-5 bg-light">
          <div className="mb-4">
            <div className="display-1 text-success mb-2">
              <i className="bi bi-check-circle"></i>
            </div>
            <h2 className="fw-bold">Exam Completed!</h2>
            <p className="text-muted">Well done on finishing the <strong>{finalResult.examTitle}</strong> exam.</p>
          </div>
          
          <div className="card mx-auto shadow-sm" style={{maxWidth: '300px'}}>
            <div className="card-body">
              <h6 className="text-uppercase small text-muted mb-1">Your Score</h6>
              <h1 className={`display-4 fw-bold ${finalResult.score >= 60 ? 'text-success' : 'text-danger'}`}>
                {finalResult.score.toFixed(0)}%
              </h1>
            </div>
          </div>

          <button 
            className="btn btn-primary mt-5 px-5" 
            onClick={() => {
              setExam(null);
              setIsSubmitted(false);
              setExamId('');
              setFinalResult(null);
            }}
          >
            Finish & Exit
          </button>
        </div>
      </div>
    );
  }

  if (isExamStarted && exam) {
    const question = exam.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

    return (
      <div className="container mt-4">
        <div className="progress mb-4" style={{height: '8px'}}>
          <div className="progress-bar" role="progressbar" style={{width: `${progress}%`}}></div>
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
                onClick={handleSubmitExam}
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
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Student Portal</h2>
            <p className="text-muted">Enter your exam ID to begin your assessment.</p>
          </div>

          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="card-body p-4">
              <div className="input-group input-group-lg mb-3">
                <input
                  type="text"
                  className="form-control border-primary"
                  placeholder="Enter Exam ID (e.g., 1)"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                />
                <button 
                  className="btn btn-primary px-4" 
                  type="button" 
                  onClick={handleStartExam}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : 'Find Exam'}
                </button>
              </div>
              
              {error && <div className="alert alert-danger mt-3">{error}</div>}

              {exam && !isExamStarted && (
                <div className="mt-4 p-4 border-start border-4 border-success bg-light rounded shadow-sm animate__animated animate__fadeIn">
                  <h4 className="fw-bold text-success mb-2">{exam.title}</h4>
                  <div className="d-flex gap-3 mb-4 text-muted">
                    <span><i className="bi bi-question-circle me-1"></i> {exam.questions.length} Questions</span>
                    <span><i className="bi bi-clock me-1"></i> Self-paced</span>
                  </div>
                  
                  {exam.password && (
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-uppercase text-muted">This exam is password protected</label>
                      <input 
                        type="password" 
                        className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                        placeholder="Enter password to start"
                        value={enteredPassword}
                        onChange={(e) => {
                          setEnteredPassword(e.target.value);
                          setPasswordError('');
                        }}
                      />
                      {passwordError && <div className="invalid-feedback">{passwordError}</div>}
                    </div>
                  )}

                  <button className="btn btn-success btn-lg w-100 fw-bold" onClick={startTakingExam}>
                    Start Exam Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
