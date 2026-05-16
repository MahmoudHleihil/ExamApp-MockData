import React, { useState } from 'react';
import { examService } from '../api/examService';

// הרכיב של פורטל הסטודנטים.
const StudentPortal = () => {
  // המצבים של חיפוש ובחירת המבחן.
  const [examId, setExamId] = useState('');
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Exam-taking state
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  // פונקציה אסינכרונית שמעדכנת את המבחן המיוצג לפי Id.
  const handleStartExam = async () => {
    if (!examId) return;
    setLoading(true);
    setError('');
    setExam(null);
    setIsExamStarted(false);
    setIsSubmitted(false);
    try {
      const data = await examService.getExamById(examId);
      setExam(data);
    } catch (err) {
      setError('Exam not found. Please check the ID.');
    } finally {
      setLoading(false);
    }
  };

  // פונקציה שמתחילה את המבחן.
  const startTakingExam = () => {
    setIsExamStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  // פונקציה ששומרת את התשובות הנבחרות.
  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // פונקציה שמעבירה לשאלה הבאה.
  const handleNextQuestion = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // פונקציה שמחזירה השאלה הקודמת.
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // פונקציה אסינכרונית להגשת המבחן עם הציון שהתקבל.
  const handleSubmitExam = async () => {
    let correctCount = 0;
    exam.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = {
      examId: exam.id,
      examTitle: exam.title,
      score: (correctCount / exam.questions.length) * 100,
      studentName: 'Student User', // Hardcoded for mock implementation
      date: new Date().toISOString()
    };

    try {
      await examService.submitScore(finalScore);
      setScore(finalScore.score);
      setIsSubmitted(true);
      setIsExamStarted(false);
    } catch (err) {
      setError('Failed to submit exam.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mt-4 text-center">
        <div className="card shadow p-5">
          <h2 className="text-success mb-4">Exam Completed!</h2>
          <h4>Your Score: <span className="badge bg-primary">{score.toFixed(1)}%</span></h4>
          <button 
            className="btn btn-outline-secondary mt-4" 
            onClick={() => {
              setExam(null);
              setIsSubmitted(false);
              setExamId('');
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // הצגת המבחן הנבחר.
  if (isExamStarted && exam) {
    const question = exam.questions[currentQuestionIndex];
    return (
      <div className="container mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white d-flex justify-content-between">
            <h4 className="mb-0">{exam.title}</h4>
            <span>Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
          </div>
          <div className="card-body">
            <h5>{question.text}</h5>
            <div className="list-group mt-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`list-group-item list-group-item-action ${selectedAnswers[question.id] === option ? 'active' : ''}`}
                  onClick={() => handleAnswerSelect(question.id, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="card-footer d-flex justify-content-between">
            <button 
              className="btn btn-secondary" 
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>
            {currentQuestionIndex === exam.questions.length - 1 ? (
              <button 
                className="btn btn-success" 
                onClick={handleSubmitExam}
                disabled={Object.keys(selectedAnswers).length < exam.questions.length}
              >
                Submit Exam
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleNextQuestion}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // הצדת חיפוש ובחירת המבחן.
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
              <button className="btn btn-success" onClick={startTakingExam}>Begin Now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
