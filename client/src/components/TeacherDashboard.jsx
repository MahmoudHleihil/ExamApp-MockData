import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { examService } from '../api/examService';
import ExamForm from './teacher/ExamForm';
import ExamList from './teacher/ExamList';
import ExamPreview from './teacher/ExamPreview';
import SubmissionList from './teacher/SubmissionList';
import SubmissionDetail from './teacher/SubmissionDetail';
import AIChatbot from './AIChatbot';
import FloatingFileUpload from "./documents/FloatingFileUpload";
import { mockDb } from '../api/mockDb';

const TeacherDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailExam, setDetailExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editExamId, setEditExamId] = useState(null);
  const [previewExam, setPreviewExam] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // אובייקט הבחינה ההתחלתית.
  const initialExamState = {
    title: '',
    password: '',
    timeLimit: 60,
    earlyAccessMinutes: 30,
    isAlwaysAvailable: false,
    releaseScoresImmediately: true,
    scheduledDate: new Date().toISOString(),
    passingScore: 60,
    questions: [
      { id: 'q1', type: 'multiple-choice', text: '', options: ['', '', '', ''], correctAnswer: '', points: 10 }
    ]
  };
  const [formData, setFormData] = useState(initialExamState);

  const [chatPrompt, setChatPrompt] = useState("");

  const handleGenerateFromMaterial = (document) => {
    setChatPrompt(
      `Generate a medium-difficulty exam with 10 multiple-choice questions using only the uploaded PDF "${document.title}". Save it as a draft.`
    );
  };

  // טעינת המבחנים
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

  // טעינת ההגשות.
  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const data = await examService.getAllSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // פונקציה אסינכרונית להצגת נתוני ההגשה
  const handleViewSubmissionDetails = async (submission) => {
    setDetailLoading(true);
    setSelectedSubmission(submission);
    try {
      const exam = await examService.getExamById(submission.examId);
      setDetailExam(exam);
      navigate(`/teacher/submissions/${submission.id}`);
    } catch (error) {
      console.error("Failed to fetch exam for submission:", error);
      alert("Failed to load submission details");
    } finally {
      setDetailLoading(false);
    }
  };

  // אחרי טעינת הרכיב הזה המבחנים נטענים.
  useEffect(() => {
    fetchExams();
    fetchSubmissions();
  }, []);

  // פונקציה לאמת הטופס של הבחינה.
  const validateForm = () => {
    if (!formData.title.trim()) return "Exam title is required";
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.text.trim()) return `Question ${i + 1} text is required`;
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        if (!q.correctAnswer) return `Question ${i + 1} requires a correct answer selection`;
      } else if (q.type === 'multiple-response') {
        if (!q.correctAnswer || q.correctAnswer.length === 0) 
          return `Question ${i + 1} requires at least one correct answer`;
      } else if (q.type === 'written') {
        if (!q.correctAnswer.trim()) return `Question ${i + 1} requires a sample correct answer`;
      }
    }
    return null;
  };

  // פונקציית שמירת המבחן.
  const handleSaveExam = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      if (isEditing) {
        await examService.updateExam(editExamId, formData);
      } else {
        await examService.createExam(formData);
      }
      resetToHome();
      await fetchExams();
      navigate('/teacher/exams');
    } catch (error) {
      alert(`Failed to ${isEditing ? 'update' : 'create'} exam`);
    }
  };

  // פונקציה אסינכרונית לטפל בלחיצה על כפתור עריכה של המבחן.
  const handleEditClick = async (id) => {
    try {
      console.log(
        "[Edit Exam] Loading:",
        id
      );

      const exam =
        await examService.getExamById(id);

      console.log(
        "[Edit Exam] API result:",
        exam
      );

      const normalizedQuestions =
        Array.isArray(exam.questions) &&
        exam.questions.length > 0
          ? exam.questions.map(
              (question, index) => ({
                id:
                  question.id ||
                  `q${index + 1}`,

                type:
                  question.type ||
                  "multiple-choice",

                text:
                  question.text ||
                  question.question ||
                  question.questionText ||
                  "",

                options:
                  Array.isArray(
                    question.options
                  )
                    ? question.options
                    : [],

                correctAnswer:
                  question.correctAnswer ??
                  question.correct_answer ??
                  "",

                points:
                  Number(
                    question.points
                  ) || 0,

                sourceEvidence:
                  question.sourceEvidence ||
                  question.source_evidence ||
                  null,
              })
            )
          : initialExamState.questions;

      const normalizedExam = {
        ...initialExamState,
        ...exam,
        questions:
          normalizedQuestions,
      };

      console.log(
        "[Edit Exam] Normalized:",
        normalizedExam
      );

      setFormData(normalizedExam);
      setEditExamId(id);
      setIsEditing(true);

      navigate(
        `/teacher/exams/edit/${encodeURIComponent(
          id
        )}`
      );
    } catch (error) {
      console.error(
        "[Edit Exam] Failed:",
        error
      );

      console.error(
        "[Edit Exam] Stack:",
        error?.stack
      );

      alert(
        error?.message ||
        "Failed to load exam for editing"
      );
    }
  };

  // פונקציה אסינכרונית למחיקת הבחינה.
  const handleDeleteExam = async (id) => {
    try {
      await examService.deleteExam(id);
      setDeletingId(null);
      fetchExams();
    } catch (error) {
      alert("Failed to delete exam");
    }
  };

  // פוקציה אסינכרונית ללחיצה על כפתור התצוגה הקודמת.
  const handlePreviewClick = async (id) => {
    try {
      const exam = await examService.getExamById(id);
      setPreviewExam(exam);
      navigate(`/teacher/exams/preview/${id}`);
    } catch (error) {
      alert("Failed to load exam for preview");
    }
  };

  // פונקצייה לחזור לדף ראשי.
  const resetToHome = () => {
    setIsEditing(false);
    setEditExamId(null);
    setFormData(initialExamState);
    setPreviewExam(null);
    setDeletingId(null);
    setSelectedSubmission(null);
    setDetailExam(null);
  };

  const TeacherHome = () => (
    <div className="row g-4 mt-2 justify-content-center animate__animated animate__fadeIn">
      <div className="col-md-4">
        <div className="card h-100 shadow-sm border-0 text-center p-4 hover-lift transition-all">
          <div className="card-body">
            <div className="display-4 text-primary mb-3">
              <i className="bi bi-plus-circle-dotted"></i>
            </div>
            <h4 className="fw-bold">Create New Exam</h4>
            <p className="text-muted">Design a new assessment with multiple question types.</p>
            <button className="btn btn-primary btn-lg w-100 mt-3 fw-bold" data-testid="create-exam-button"  onClick={() => { resetToHome(); navigate('/teacher/exams/new'); }}>
              Launch Creator
            </button>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card h-100 shadow-sm border-0 text-center p-4 hover-lift transition-all">
          <div className="card-body">
            <div className="display-4 text-info mb-3">
              <i className="bi bi-collection"></i>
            </div>
            <h4 className="fw-bold">Manage Exams</h4>
            <p className="text-muted">View, edit, or remove your existing exams.</p>
            <button className="btn btn-info btn-lg w-100 mt-3 text-white fw-bold" onClick={() => navigate('/teacher/exams')}>
              View All Exams
            </button>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card h-100 shadow-sm border-0 text-center p-4 hover-lift transition-all">
          <div className="card-body">
            <div className="display-4 text-success mb-3">
              <i className="bi bi-clipboard-check"></i>
            </div>
            <h4 className="fw-bold">Review Submissions</h4>
            <p className="text-muted">Grade student answers and see performance analytics.</p>
            <button 
              className="btn btn-success btn-lg w-100 mt-3 text-white fw-bold" 
              onClick={() => navigate('/teacher/submissions')}
              disabled={submissionsLoading}
            >
              {submissionsLoading ? <span className="spinner-border spinner-border-sm"></span> : 'View Results'}
            </button>
          </div>
        </div>
      </div>
      <div className="col-md-10 mt-5">
        <div className="card border-0 bg-light p-4 rounded-4">
          <div className="d-flex align-items-center justify-content-around text-center">
            <div>
              <h2 className="fw-bold text-primary mb-0">{exams.length}</h2>
              <small className="text-muted text-uppercase fw-bold">Active Exams</small>
            </div>
            <div className="vr opacity-10"></div>
            <div>
              <h2 className="fw-bold text-success mb-0">98%</h2>
              <small className="text-muted text-uppercase fw-bold">Avg. Completion</small>
            </div>
            <div className="vr opacity-10"></div>
            <div>
              <h2 className="fw-bold text-warning mb-0">{mockDb.studentScores.length}</h2>
              <small className="text-muted text-uppercase fw-bold">Recent Submissions</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mt-2" data-testid="teacher-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h2 className="fw-bold mb-0">Teacher Dashboard</h2>
      </div>

      {/* Nested Routes for Teacher Features */}
      <Routes>
        {/* Main Teacher Menu */}
        <Route path="/" element={<TeacherHome />} />
        
        {/* Exam Management Routes */}
        <Route path="exams" element={
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-dark">Manage Existing Exams</h3>
              <button className="btn btn-secondary px-4" onClick={() => navigate('/teacher')}>Back to Menu</button>
            </div>
            <ExamList 
              exams={exams} 
              loading={loading} 
              onEdit={handleEditClick} 
              onDelete={handleDeleteExam} 
              onPreview={handlePreviewClick} 
              deletingId={deletingId} 
              setDeletingId={setDeletingId} 
            />
          </div>
        } />
        
        {/* Create and Edit Exam Routes */}
        <Route path="exams/new" element={
          <ExamForm 
            formData={formData} 
            setFormData={setFormData} 
            isEditing={false} 
            onSave={handleSaveExam} 
            onCancel={() => navigate('/teacher')} 
          />
        } />
        <Route path="exams/edit/:id" element={
          <ExamForm 
            formData={formData} 
            setFormData={setFormData} 
            isEditing={true} 
            onSave={handleSaveExam} 
            onCancel={() => navigate('/teacher/exams')} 
          />
        } />
        
        {/* Exam Preview Route */}
        <Route path="exams/preview/:id" element={
          <ExamPreview 
            previewExam={previewExam} 
            onBack={() => navigate('/teacher/exams')} 
            onEdit={handleEditClick} 
          />
        } />
        
        {/* Student Submission Tracking Routes */}
        <Route path="submissions" element={
          <SubmissionList 
            submissions={submissions} 
            loading={submissionsLoading} 
            onBack={() => navigate('/teacher')} 
            onViewDetails={handleViewSubmissionDetails}
          />
        } />
        <Route path="submissions/:id" element={
          detailLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Loading details...</p>
            </div>
          ) : (
            <SubmissionDetail 
              submission={selectedSubmission} 
              exam={detailExam} 
              onBack={() => navigate('/teacher/submissions')} 
            />
          )
        } />
      </Routes>
      
      <FloatingFileUpload onGenerateExam={handleGenerateFromMaterial} />

      <AIChatbot
        user={user}
        context={{ dashboard: "teacher" }}
        initialPrompt={chatPrompt}
      />
    </div>
  );
};

export default TeacherDashboard;
