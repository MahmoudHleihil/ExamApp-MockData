import { useState, useEffect } from 'react';
import { examService } from '../api/examService';
import PortalTabs from './student/PortalTabs';
import ExamSearch from './student/ExamSearch';
import ExamTaker from './student/ExamTaker';
import ExamResult from './student/ExamResult';
import FeedbackList from './student/FeedbackList';
import FeedbackDetail from './student/FeedbackDetail';

const StudentPortal = () => {
  const [activeTab, setActiveTab] = useState('take-exam'); // 'take-exam', 'my-feedback'
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

  // Feedback state
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [feedbackExam, setFeedbackExam] = useState(null);
  const [showFullReview, setShowFullReview] = useState(false);

  const studentName = 'Student User'; // Simulated logged in student

  const fetchStudentSubmissions = async () => {
    setFeedbackLoading(true);
    try {
      const data = await examService.getSubmissionsByStudent(studentName);
      setStudentSubmissions(data);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // טוען את ההגשות של הסטודנט בכל פעם שמשנים ל My Feedback
  useEffect(() => {
    if (activeTab === 'my-feedback') {
      fetchStudentSubmissions();
    }
  }, [activeTab]);

  // פונקציה אסינכרונית לטעינת המשוב
  const handleViewFeedback = async (submission) => {
    setFeedbackLoading(true);
    setSelectedFeedback(submission);
    setShowFullReview(false);
    try {
      const examData = await examService.getExamById(submission.examId);
      setFeedbackExam(examData);
    } catch (err) {
      console.error("Failed to fetch exam for feedback:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // פונקציית חיפוש על הבחינה לפי Id.
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
    } catch (_) {
      setError('Exam not found. Please check the ID.');
    } finally {
      setLoading(false);
    }
  };

  // פונקציית תחילת הבחינה.
  const startTakingExam = () => {
    // בדיקת הסיסמה.
    if (exam.password && enteredPassword !== exam.password) {
      setPasswordError('Incorrect password. Please try again.');
      return;
    }
    setIsExamStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  // פונקציה של שינוי התשובה של השאלה.
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

  // חישוב ציון המבחן.
  const calculateScore = () => {
    let totalPoints = 0;

    // הוספת נקודה אחת לכל תשובה נכונה.
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

    // חישוב והחזרת הציון.
    return (totalPoints / exam.questions.length) * 100;
  };

  // פונקציית הגשת המבחן.
  const handleSubmitExam = async () => {
    const score = calculateScore();
    // יצירת אובייקט התוצאה.
    const result = {
      id: Math.random().toString(36).substr(2, 9),
      examId: exam.id,
      examTitle: exam.title,
      score: score,
      studentName: studentName,
      date: new Date().toISOString(),
      answers: selectedAnswers,
      feedback: "",
      questionFeedback: {},
      isFeedbackVisible: false
    };

    // הגשת התוצאה.
    try {
      await examService.submitScore(result);
      setFinalResult(result);
      setIsSubmitted(true);
      setIsExamStarted(false);
    } catch (_) {
      setError('Failed to submit exam.');
    }
  };

  const handleGoToSubmissions = () => {
    setExam(null);
    setIsSubmitted(false);
    setExamId('');
    setFinalResult(null);
    setActiveTab('my-feedback');
  };

  // אחרי הגשת המבחן וקבלת הציון.
  if (isSubmitted && finalResult) {
    return <ExamResult finalResult={finalResult} onGoToSubmissions={handleGoToSubmissions} />;
  }

  // המבחן התחיל.
  if (isExamStarted && exam) {
    return (
      // הרכיב של הגישה למבחן
      <ExamTaker 
        exam={exam}
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        selectedAnswers={selectedAnswers}
        handleAnswerChange={handleAnswerChange}
        handleSubmitExam={handleSubmitExam}
      />
    );
  }

  return (
    <div className="container mt-4">
      {/* Navigation Tabs */}
      {!isExamStarted && (
        <PortalTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      <div className="row justify-content-center">
        <div className="col-md-10">
          {activeTab === 'take-exam' ? (
            // רכיב חיפוש על הבחינה
            <ExamSearch 
              examId={examId}
              setExamId={setExamId}
              handleStartExam={handleStartExam}
              loading={loading}
              error={error}
              exam={exam}
              isExamStarted={isExamStarted}
              enteredPassword={enteredPassword}
              setEnteredPassword={setEnteredPassword}
              passwordError={passwordError}
              setPasswordError={setPasswordError}
              startTakingExam={startTakingExam}
            />
          ) : (
            <>
              {selectedFeedback ? (
                // רכיב נתוני המשוב
                <FeedbackDetail 
                  selectedFeedback={selectedFeedback}
                  setSelectedFeedback={setSelectedFeedback}
                  feedbackExam={feedbackExam}
                  setFeedbackExam={setFeedbackExam}
                  showFullReview={showFullReview}
                  setShowFullReview={setShowFullReview}
                />
              ) : feedbackLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2 text-muted">Loading your results...</p>
                </div>
              ) : (
                // רכיב רשימת המשובים
                <FeedbackList 
                  studentSubmissions={studentSubmissions}
                  handleViewFeedback={handleViewFeedback}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
