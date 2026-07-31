import React, { useState, useEffect, useMemo, } from 'react';
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
  const [publishingId, setPublishingId] =useState(null);

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

  const handlePublishExam =
    async (examId) => {
      const response =
        await examService.publishExam(
          examId
        );

      const publishedExam =
        response?.exam ||
        response?.data ||
        response;

      setExams((current) =>
        current.map((exam) =>
          String(exam.id) ===
          String(examId)
            ? {
                ...exam,
                ...publishedExam,
                published: true,
                isPublished: true,
              }
            : exam
        )
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
      
      console.log(
        "Teacher submissions:",
        data
      );

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

        const refreshedExams =
          await examService.getAllExams();

        setExams(
          Array.isArray(refreshedExams)
            ? refreshedExams
            : refreshedExams?.exams ||
              refreshedExams?.data ||
              []
        );

        setEditExamId(null);
        navigate("/teacher/exams");
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
      await fetchExams();
    } catch (error) {
      console.error(
        "Failed to delete exam:",
        error
      );

      alert(
        error?.message ||
        "Failed to delete exam"
      );
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

  const dashboardStats = useMemo(() => {
    const examList =
      Array.isArray(exams)
        ? exams
        : [];

    const submissionList =
      Array.isArray(submissions)
        ? submissions
        : [];

    const publishedExams =
      examList.filter(
        (exam) =>
          exam.isPublished === true ||
          exam.published === true
      );

    const draftExams =
      examList.filter(
        (exam) =>
          exam.isPublished !== true &&
          exam.published !== true
      );

    const gradedSubmissions =
      submissionList.filter(
        (submission) =>
          submission.status === "graded" ||
          (submission.score !== null &&
          submission.score !== undefined)
      );

    const pendingSubmissions =
      submissionList.filter(
        (submission) =>
          ![
            "graded",
          ].includes(
            submission.status
          )
      );

    const publishedScores =
      submissionList.filter(
        (submission) =>
          submission.isScorePublished === true
      );

    const validPercentages =
      submissionList
        .map((submission) =>
          Number(
            submission.percentage
          )
        )
        .filter(
          (value) =>
            Number.isFinite(value)
        );

    const averageScore =
      validPercentages.length > 0
        ? validPercentages.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          validPercentages.length
        : 0;

    const highestScore =
      validPercentages.length > 0
        ? Math.max(
            ...validPercentages
          )
        : 0;

    const passingSubmissions =
      submissionList.filter(
        (submission) => {
          const percentage =
            Number(
              submission.percentage
            );

          if (
            !Number.isFinite(
              percentage
            )
          ) {
            return false;
          }

          const exam =
            examList.find(
              (item) =>
                String(item.id) ===
                String(
                  submission.examId
                )
            );

          const passingScore =
            Number(
              exam?.passingScore ??
              60
            );

          return (
            percentage >= passingScore
          );
        }
      );

    const gradedCount =
      gradedSubmissions.length;

    const passRate =
      gradedCount > 0
        ? (
            passingSubmissions.length /
            gradedCount
          ) * 100
        : 0;

    const uniqueStudents =
      new Set(
        submissionList
          .map(
            (submission) =>
              submission.studentId
          )
          .filter(Boolean)
          .map(String)
      ).size;

    return {
      totalExams:
        examList.length,

      publishedExams:
        publishedExams.length,

      draftExams:
        draftExams.length,

      totalSubmissions:
        submissionList.length,

      gradedSubmissions:
        gradedCount,

      pendingSubmissions:
        pendingSubmissions.length,

      publishedScores:
        publishedScores.length,

      averageScore:
        Number(
          averageScore.toFixed(1)
        ),

      highestScore:
        Number(
          highestScore.toFixed(1)
        ),

      passRate:
        Number(
          passRate.toFixed(1)
        ),

      uniqueStudents,
    };
  }, [
    exams,
    submissions,
  ]);

  const StatisticCard = ({
    title,
    value,
    icon,
    className = "primary",
    description,
  }) => (
    <div className="col-sm-6 col-xl-3">
      <div className="card h-100 border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-start justify-content-between">
            <div>
              <p className="text-muted text-uppercase small fw-bold mb-2">
                {title}
              </p>

              <h2
                className={`fw-bold text-${className} mb-1`}
              >
                {value}
              </h2>

              {description && (
                <small className="text-muted">
                  {description}
                </small>
              )}
            </div>

            <div
              className={`
                rounded-circle
                bg-${className}
                bg-opacity-10
                text-${className}
                d-flex
                align-items-center
                justify-content-center
                flex-shrink-0
              `}
              style={{
                width: "52px",
                height: "52px",
              }}
            >
              <i
                className={`bi ${icon} fs-4`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TeacherHome = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="row g-4 mt-2">
        <StatisticCard
          title="Total Exams"
          value={
            loading
              ? "..."
              : dashboardStats.totalExams
          }
          icon="bi-journal-text"
          className="primary"
          description={`${dashboardStats.publishedExams} published`}
        />

        <StatisticCard
          title="Submissions"
          value={
            submissionsLoading
              ? "..."
              : dashboardStats.totalSubmissions
          }
          icon="bi-clipboard-data"
          className="success"
          description={`${dashboardStats.pendingSubmissions} awaiting grading`}
        />

        <StatisticCard
          title="Average Score"
          value={
            submissionsLoading
              ? "..."
              : `${dashboardStats.averageScore}%`
          }
          icon="bi-graph-up-arrow"
          className="info"
          description={`Highest: ${dashboardStats.highestScore}%`}
        />

        <StatisticCard
          title="Pass Rate"
          value={
            submissionsLoading
              ? "..."
              : `${dashboardStats.passRate}%`
          }
          icon="bi-award"
          className="warning"
          description={`${dashboardStats.uniqueStudents} students`}
        />
      </div>

      <div className="row g-4 mt-2">
        <div className="col-lg-4">
          <div className="card h-100 shadow-sm border-0 text-center p-4 hover-lift transition-all rounded-4">
            <div className="card-body">
              <div className="display-4 text-primary mb-3">
                <i className="bi bi-plus-circle-dotted" />
              </div>

              <h4 className="fw-bold">
                Create New Exam
              </h4>

              <p className="text-muted">
                Design a new assessment with
                multiple question types.
              </p>

              <button
                className="btn btn-primary btn-lg w-100 mt-3 fw-bold"
                data-testid="create-exam-button"
                onClick={() => {
                  resetToHome();
                  navigate(
                    "/teacher/exams/new"
                  );
                }}
              >
                Launch Creator
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card h-100 shadow-sm border-0 text-center p-4 hover-lift transition-all rounded-4">
            <div className="card-body">
              <div className="display-4 text-info mb-3">
                <i className="bi bi-collection" />
              </div>

              <h4 className="fw-bold">
                Manage Exams
              </h4>

              <p className="text-muted">
                {dashboardStats.publishedExams}
                {" published and "}
                {dashboardStats.draftExams}
                {" draft exams."}
              </p>

              <button
                className="btn btn-info btn-lg w-100 mt-3 text-white fw-bold"
                onClick={() =>
                  navigate(
                    "/teacher/exams"
                  )
                }
              >
                View All Exams
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card h-100 shadow-sm border-0 text-center p-4 hover-lift transition-all rounded-4">
            <div className="card-body">
              <div className="display-4 text-success mb-3">
                <i className="bi bi-clipboard-check" />
              </div>

              <h4 className="fw-bold">
                Review Submissions
              </h4>

              <p className="text-muted">
                {dashboardStats.gradedSubmissions}
                {" graded and "}
                {dashboardStats.pendingSubmissions}
                {" pending submissions."}
              </p>

              <button
                className="btn btn-success btn-lg w-100 mt-3 text-white fw-bold"
                onClick={() =>
                  navigate(
                    "/teacher/submissions"
                  )
                }
                disabled={
                  submissionsLoading
                }
              >
                {submissionsLoading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  "View Results"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-2">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="fw-bold mb-1">
                    Grading Overview
                  </h4>

                  <p className="text-muted mb-0">
                    Current submission and
                    publication status.
                  </p>
                </div>

                <i className="bi bi-bar-chart-line fs-2 text-primary" />
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className="bg-light rounded-4 p-3 text-center">
                    <h3 className="fw-bold text-success mb-1">
                      {
                        dashboardStats
                          .gradedSubmissions
                      }
                    </h3>

                    <small className="text-muted">
                      Graded
                    </small>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="bg-light rounded-4 p-3 text-center">
                    <h3 className="fw-bold text-warning mb-1">
                      {
                        dashboardStats
                          .pendingSubmissions
                      }
                    </h3>

                    <small className="text-muted">
                      Pending
                    </small>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="bg-light rounded-4 p-3 text-center">
                    <h3 className="fw-bold text-info mb-1">
                      {
                        dashboardStats
                          .publishedScores
                      }
                    </h3>

                    <small className="text-muted">
                      Scores Published
                    </small>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-semibold">
                    Grading progress
                  </span>

                  <span className="text-muted">
                    {dashboardStats.totalSubmissions >
                    0
                      ? Math.round(
                          (
                            dashboardStats
                              .publishedScores /
                            dashboardStats
                              .totalSubmissions
                          ) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div
                  className="progress"
                  style={{
                    height: "12px",
                  }}
                >
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${
                        dashboardStats
                          .totalSubmissions >
                        0
                          ? (
                              dashboardStats
                                .publishedScores /
                              dashboardStats
                                .totalSubmissions
                            ) * 100
                          : 0
                      }%`,
                    }}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <h4 className="fw-bold mb-4">
                Exam Status
              </h4>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>
                  <i className="bi bi-check-circle text-success me-2" />
                  Published
                </span>

                <span className="badge bg-success rounded-pill">
                  {
                    dashboardStats
                      .publishedExams
                  }
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>
                  <i className="bi bi-pencil-square text-secondary me-2" />
                  Drafts
                </span>

                <span className="badge bg-secondary rounded-pill">
                  {
                    dashboardStats
                      .draftExams
                  }
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-people text-primary me-2" />
                  Students
                </span>

                <span className="badge bg-primary rounded-pill">
                  {
                    dashboardStats
                      .uniqueStudents
                  }
                </span>
              </div>
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
              onPublish={handlePublishExam}
              deletingId={deletingId} 
              setDeletingId={setDeletingId}
              publishingId={publishingId} 
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
              onSubmissionUpdated={(updated) => {
                setSelectedSubmission(updated);

                setSubmissions((current) =>
                  current.map((item) =>
                    item.id === updated.id
                      ? {
                          ...item,
                          ...updated,
                        }
                      : item
                  )
                );
              }}
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
