import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { examService } from '../api/examService';
import { notificationService } from '../api/notificationService';
import PortalTabs from './student/PortalTabs';
import ExamSearch from './student/ExamSearch';
import ExamTaker from './student/ExamTaker';
import ExamResult from './student/ExamResult';
import FeedbackList from './student/FeedbackList';
import FeedbackDetail from './student/FeedbackDetail';
import AIChatbot from './AIChatbot';

const StudentPortal = ({ user }) => {
  const navigate = useNavigate();
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
  const [
    alreadySubmitted,
    setAlreadySubmitted,
  ] = useState(false);

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
      const response =
        await examService.getMySubmissions();
        console.log(
          "Student submissions response:",
          JSON.stringify(
            response,
            null,
            2
          )
        );
      const submissions =
        Array.isArray(response)
          ? response
          : Array.isArray(
              response?.submissions
            )
            ? response.submissions
            : Array.isArray(
                response?.data
              )
              ? response.data
              : [];

      setStudentSubmissions(
        submissions
      );
    } catch (error) {
      console.error(
        "Failed to fetch submissions:",
        error
      );

      setStudentSubmissions([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentSubmissions();
  }, []);

  // פונקציה אסינכרונית לטעינת המשוב
  const handleViewFeedback = async (
    submission
  ) => {
    setFeedbackLoading(true);
    setShowFullReview(false);

    try {
      const review =
        await examService
          .getStudentSubmissionReview(
            submission.id
          );

      setSelectedFeedback(review);
      setFeedbackExam(review);

      navigate(
        `/student/feedback/${submission.id}`
      );
    } catch (error) {
      console.error(
        "Failed to load submission review:",
        error
      );

      setError(
        error?.message ||
        "Failed to load submission review."
      );
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
      const data = await examService.getExamForStudent(examId);
      
      const existingSubmission =
        studentSubmissions.find(
          (submission) =>
            String(submission.examId) ===
            String(data.id)
        );

      if (existingSubmission) {
        setAlreadySubmitted(true);
      } else {
        setAlreadySubmitted(false);
      }

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
  const startTakingExam = async () => {
    if (!exam?.id) {
      setError(
        "No active exam was found."
      );
      return;
    }

    setPasswordError("");
    setLoading(true);

    try {
      if (exam.passwordRequired) {
        if (!enteredPassword.trim()) {
          setPasswordError(
            "Please enter the exam password."
          );
          return;
        }

        await examService
          .verifyExamPassword(
            exam.id,
            enteredPassword
          );
      }

      setIsExamStarted(true);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);

      navigate(
        `/student/exams/${exam.id}/take`
      );
    } catch (error) {
      if (
        error?.status === 403 ||
        /incorrect exam password/i.test(
          error?.message || ""
        )
      ) {
        setPasswordError(
          "Incorrect password. Please try again."
        );
        return;
      }

      setError(
        error?.message ||
        "Failed to start exam."
      );
    } finally {
      setLoading(false);
    }
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
    if (!exam?.id) {
      setError("No active exam was found.");
      return;
    }

    try {
      setError("");

      const response =
        await examService.submitScore({
          examId: exam.id,
          answers: selectedAnswers,
        });

      const submission =
        response?.submission ||
        response?.data ||
        response;

      const percentage =
        Number(
          submission.percentage ??
            (
              Number(submission.maxScore) > 0
                ? (
                    Number(submission.score) /
                    Number(submission.maxScore)
                  ) * 100
                : 0
            )
        );

      const result = {
        ...submission,

        examId:
          submission.examId ||
          exam.id,

        examTitle:
          submission.examTitle ||
          exam.title,

        passingScore:
          exam.passingScore || 60,

        percentage,

        isPassed:
          percentage >=
          Number(
            exam.passingScore || 60
          ),

        releaseScoresImmediately:
          Boolean(
            submission.isScorePublished
          ),

        feedback:
          submission.feedback || "",
      };

      notificationService.addNotification({
        role: "Teacher",
        title: "New Submission",
        message:
          `${studentName} submitted their exam: ${exam.title}.`,
        type: "submission",
      });

      setFinalResult(result);
      setIsSubmitted(true);
      setIsExamStarted(false);

      navigate(
        `/student/exams/${exam.id}/result`,
        {
          state: {
            result,
          },
        }
      );
    } catch (error) {
      console.error(
        "Failed to submit exam:",
        error
      );

      setError(
        error?.message ||
        "Failed to submit exam."
      );
    }
  };

  const handleGoToSubmissions = () => {
    setExam(null);
    setIsSubmitted(false);
    setExamId('');
    setFinalResult(null);
    navigate('/student/feedback');
  };

  return (
    <div className="container mt-4" data-testid="student-dashboard">
      {/* Nested Routes for Student Features */}
      <Routes>
        {/* Default redirect to exams list */}
        <Route path="/" element={<Navigate to="exams" replace />} />
        
        {/* Exam Search and Discovery Route */}
        <Route path="exams" element={
          <div className="row justify-content-center">
            <div className="col-md-10">
              <PortalTabs />
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
                alreadySubmitted={alreadySubmitted}
              />
            </div>
          </div>
        } />

        {/* Active Exam Session Route */}
        <Route path="exams/:id/take" element={
          exam ? (
            <ExamTaker 
              exam={exam}
              currentQuestionIndex={currentQuestionIndex}
              setCurrentQuestionIndex={setCurrentQuestionIndex}
              selectedAnswers={selectedAnswers}
              handleAnswerChange={handleAnswerChange}
              handleSubmitExam={handleSubmitExam}
            />
          ) : <Navigate to="/student/exams" replace />
        } />

        {/* Exam Completion Result Route */}
        <Route path="exams/:id/result" element={
          finalResult ? (
            <ExamResult finalResult={finalResult} onGoToSubmissions={handleGoToSubmissions} />
          ) : <Navigate to="/student/exams" replace />
        } />

        {/* Feedback and Results History Route */}
        <Route path="feedback" element={
          <div className="row justify-content-center">
            <div className="col-md-10">
              <PortalTabs />
              {feedbackLoading && !selectedFeedback ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2 text-muted">Loading your results...</p>
                </div>
              ) : (
                <FeedbackList 
                  studentSubmissions={studentSubmissions}
                  handleViewFeedback={handleViewFeedback}
                />
              )}
            </div>
          </div>
        } />

        {/* Detailed Feedback Review Route */}
        <Route path="feedback/:id" element={
          <div className="row justify-content-center">
            <div className="col-md-10">
              <FeedbackDetail 
                selectedFeedback={selectedFeedback}
                setSelectedFeedback={(val) => {
                  setSelectedFeedback(val);
                  if (!val) navigate('/student/feedback');
                }}
                feedbackExam={feedbackExam}
                setFeedbackExam={setFeedbackExam}
                showFullReview={showFullReview}
                setShowFullReview={setShowFullReview}
              />
            </div>
          </div>
        } />
      </Routes>

      <AIChatbot user={user} context={{ dashboard: "student" }} />
    </div>
  );
};

export default StudentPortal;
