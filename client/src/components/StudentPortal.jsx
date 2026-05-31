import { useState, useEffect } from 'react';
import { examService } from '../api/examService';
import { notificationService } from '../api/notificationService';
import PortalTabs from './student/PortalTabs';
import ExamSearch from './student/ExamSearch';
import ExamTaker from './student/ExamTaker';
import ExamResult from './student/ExamResult';
import FeedbackList from './student/FeedbackList';
import FeedbackDetail from './student/FeedbackDetail';

const StudentPortal = ({ user }) => {
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

  const studentName = user?.fullName || 'Student User'; 

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
      
      // Check if the exam is currently available or within early access
      if (!data.isAlwaysAvailable) {
        const now = new Date();
        const scheduledDate = new Date(data.scheduledDate);
        const earlyAccessDate = new Date(scheduledDate.getTime() - (data.earlyAccessMinutes || 0) * 60000);
        const expiryDate = new Date(scheduledDate.getTime() + (data.timeLimit || 60) * 60000);
        
        if (now < earlyAccessDate) {
          setError(`This exam is scheduled for ${scheduledDate.toLocaleString()}. Early access opens at ${earlyAccessDate.toLocaleTimeString()}.`);
          return;
        }
        
        if (now > expiryDate) {
          setError('This exam session has ended and is no longer available.');
          return;
        }
      }
      
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

  // פונקציית הגשת המבחן.
  const handleSubmitExam = async () => {
    // Calculate score automatically
    let totalPoints = 0;
    let earnedPoints = 0;
    
    exam.questions.forEach(q => {
      const points = q.points || 0;
      totalPoints += points;
      
      const studentAnswer = selectedAnswers[q.id];
      const correctAnswer = q.correctAnswer;
      
      if (q.type === 'multiple-response') {
        const studentSet = new Set(studentAnswer || []);
        const correctSet = new Set(correctAnswer || []);
        if (studentSet.size === correctSet.size && [...studentSet].every(val => correctSet.has(val))) {
          earnedPoints += points;
        }
      } else if (q.type === 'written') {
        if (studentAnswer?.trim().toLowerCase() === correctAnswer?.trim().toLowerCase()) {
          earnedPoints += points;
        }
      } else {
        if (studentAnswer === correctAnswer) {
          earnedPoints += points;
        }
      }
    });

    const calculatedScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = calculatedScore >= (exam.passingScore || 60);
    const releaseImmediately = exam.releaseScoresImmediately !== false; // Default to true if undefined

    // יצירת אובייקט התוצאה.
    const result = {
      id: Math.random().toString(36).substr(2, 9),
      examId: exam.id,
      examTitle: exam.title,
      score: calculatedScore,
      totalPoints,
      earnedPoints,
      passingScore: exam.passingScore || 60,
      isPassed,
      studentName: studentName,
      date: new Date().toISOString(),
      answers: selectedAnswers,
      feedback: isPassed ? "Congratulations! You passed." : "Keep studying and try again next time.",
      questionFeedback: {},
      isFeedbackVisible: releaseImmediately,
      releaseScoresImmediately: releaseImmediately
    };

    // הגשת התוצאה.
    try {
      await examService.submitScore(result);
      
      // Notify the teacher about the new submission
      notificationService.addNotification({
        role: 'Teacher',
        title: 'New Submission',
        message: `${studentName} submitted their exam: ${exam.title}. Score: ${calculatedScore}%`,
        type: 'submission'
      });

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
