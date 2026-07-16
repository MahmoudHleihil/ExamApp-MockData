import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  examService,
} from "../../api/examService";

import {
  notificationService,
} from "../../api/notificationService";

const SubmissionDetail = ({
  submission,
  exam,
  onBack,
  onSubmissionUpdated,
}) => {
  const [
    currentSubmission,
    setCurrentSubmission,
  ] = useState(
    submission || null
  );

  const [
    feedback,
    setFeedback,
  ] = useState(
    submission?.feedback || ""
  );

  const [
    questionFeedback,
    setQuestionFeedback,
  ] = useState(
    submission?.questionFeedback ||
      {}
  );

  const [
    isFeedbackVisible,
    setIsFeedbackVisible,
  ] = useState(
    Boolean(
      submission?.isFeedbackVisible
    )
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  const [
    aiReviewLoading,
    setAiReviewLoading,
  ] = useState({});

  const [
    aiReviewError,
    setAiReviewError,
  ] = useState("");

  const [
    overrideValues,
    setOverrideValues,
  ] = useState({});

  const [
    manualGrades,
    setManualGrades,
  ] = useState({});

  useEffect(() => {
    const initialGrades = {};

    for (
      const answer
      of submission?.answerDetails || []
    ) {
      initialGrades[
        String(answer.questionId)
      ] = {
        awardedPoints:
          answer.awardedPoints ??
          "",

        feedback:
          answer.feedback ||
          "",
      };
    }

    setManualGrades(
      initialGrades
    );
  }, [submission]);
  
  const handleManualGrade =
    async (
    questionId,
    maxPoints
  ) => {
    if (!questionId) {
      setAiReviewError(
        "The stored submission answer has no question ID."
      );
      return;
    }
    const questionKey =
      String(questionId);

    const grade =
      manualGrades[
        questionKey
      ] || {};

    const awardedPoints =
      Number(
        grade.awardedPoints
      );

    if (
      grade.awardedPoints ===
        "" ||
      !Number.isFinite(
        awardedPoints
      )
    ) {
      setAiReviewError(
        "Enter a valid score."
      );

      return;
    }

    if (
      awardedPoints < 0 ||
      awardedPoints >
        maxPoints
    ) {
      setAiReviewError(
        `Score must be between 0 and ${maxPoints}.`
      );

      return;
    }

    setAiReviewLoading(
      (current) => ({
        ...current,
        [questionKey]: true,
      })
    );

    setAiReviewError("");

    try {
      const updatedSubmission =
        await examService
          .gradeWrittenAnswer(
            currentSubmission.id,
            questionId,
            {
              awardedPoints,

              feedback:
                grade.feedback ||
                "",
            }
          );

      updateLocalSubmission(
        updatedSubmission
      );
    } catch (error) {
      setAiReviewError(
        error?.message ||
          "Failed to grade written answer."
      );
    } finally {
      setAiReviewLoading(
        (current) => ({
          ...current,
          [questionKey]: false,
        })
      );
    }
  };

  useEffect(() => {
    setCurrentSubmission(
      submission || null
    );

    setFeedback(
      submission?.feedback || ""
    );

    setQuestionFeedback(
      submission?.questionFeedback ||
        {}
    );

    setIsFeedbackVisible(
      Boolean(
        submission
          ?.isFeedbackVisible
      )
    );

    setSaveMessage("");
    setAiReviewError("");
    setOverrideValues({});
  }, [submission]);

  const questions = useMemo(
    () =>
      Array.isArray(
        exam?.questions
      )
        ? exam.questions
        : [],
    [exam]
  );

  const answerDetails =
    useMemo(
      () =>
        Array.isArray(
          currentSubmission
            ?.answerDetails
        )
          ? currentSubmission
              .answerDetails
          : [],
      [currentSubmission]
    );

  const answersByQuestion =
    useMemo(() => {
      const map = new Map();

      for (
        const answer
        of answerDetails
      ) {
        map.set(
          String(
            answer.questionId
          ),
          answer
        );
      }

      return map;
    }, [answerDetails]);

  if (
    !currentSubmission ||
    !exam
  ) {
    return null;
  }

  const earnedPoints =
    Number(
      currentSubmission.score ??
        0
    );

  const maxPoints =
    Number(
      currentSubmission
        .maxScore ?? 0
    );

  const storedPercentage =
    Number(
      currentSubmission
        .percentage
    );

  const displayedPercentage =
    Number.isFinite(
      storedPercentage
    ) &&
    storedPercentage >= 0 &&
    storedPercentage <= 100
      ? storedPercentage
      : maxPoints > 0
        ? (
            earnedPoints /
            maxPoints
          ) * 100
        : 0;

  const submittedAt =
    currentSubmission
      .submittedAt ||
    currentSubmission.date ||
    currentSubmission.createdAt;

  const notifyParent = (
    updatedSubmission
  ) => {
    if (
      typeof onSubmissionUpdated ===
      "function"
    ) {
      onSubmissionUpdated(
        updatedSubmission
      );
    }
  };

  const updateLocalSubmission = (
    updatedSubmission
  ) => {
    if (!updatedSubmission) {
      return;
    }

    setCurrentSubmission(
      updatedSubmission
    );

    setFeedback(
      updatedSubmission.feedback ||
        ""
    );

    setIsFeedbackVisible(
      Boolean(
        updatedSubmission
          .isFeedbackVisible
      )
    );

    notifyParent(
      updatedSubmission
    );
  };

  const handleAiReview = async (
    questionId,
    action
  ) => {
    if (
      !currentSubmission?.id
    ) {
      setAiReviewError(
        "No submission is selected."
      );
      return;
    }

    const questionKey =
      String(questionId);

    setAiReviewError("");

    setAiReviewLoading(
      (current) => ({
        ...current,
        [questionKey]: true,
      })
    );

    try {
      const reviewData = {
        action,
      };

      if (
        action === "override"
      ) {
        const override =
          overrideValues[
            questionKey
          ] || {};

        const rawPoints =
          override.awardedPoints;

        if (
          rawPoints === "" ||
          rawPoints === undefined
        ) {
          throw new Error(
            "Enter a score before overriding."
          );
        }

        const awardedPoints =
          Number(rawPoints);

        if (
          !Number.isFinite(
            awardedPoints
          )
        ) {
          throw new Error(
            "Enter a valid score before overriding."
          );
        }

        const question =
          questions.find(
            (item) =>
              String(item.id) ===
              questionKey
          );

        const questionMax =
          Number(
            question?.points ??
              0
          );

        if (
          awardedPoints < 0 ||
          awardedPoints >
            questionMax
        ) {
          throw new Error(
            `Score must be between 0 and ${questionMax}.`
          );
        }

        reviewData.awardedPoints =
          awardedPoints;

        reviewData.feedback =
          String(
            override.feedback ||
              ""
          );
      }

      const updatedSubmission =
        await examService
          .reviewAiGradingSuggestion(
            currentSubmission.id,
            questionId,
            reviewData
          );

      updateLocalSubmission(
        updatedSubmission
      );

      setOverrideValues(
        (current) => ({
          ...current,

          [questionKey]: {
            awardedPoints: "",
            feedback: "",
          },
        })
      );
    } catch (error) {
      console.error(
        "Failed to review AI grading suggestion:",
        error
      );

      setAiReviewError(
        error?.message ||
          "Failed to review AI grading suggestion."
      );
    } finally {
      setAiReviewLoading(
        (current) => ({
          ...current,
          [questionKey]: false,
        })
      );
    }
  };

  const handleSaveFeedback =
    async () => {
      setIsSaving(true);
      setSaveMessage("");

      try {
        const updatedSubmission =
          await examService
            .updateSubmissionFeedback(
              currentSubmission.id,
              feedback,
              questionFeedback,
              isFeedbackVisible
            );

        updateLocalSubmission(
          updatedSubmission
        );

        if (
          isFeedbackVisible
        ) {
          try {
            await notificationService
              .addNotification({
                userId:
                  currentSubmission
                    .studentId,

                title:
                  "Feedback Released",

                message:
                  `Your results for "${exam.title}" are now available. Score: ${displayedPercentage.toFixed(
                    0
                  )}%`,

                type:
                  "feedback",
              });
          } catch (
            notificationError
          ) {
            console.error(
              "Failed to create grading notification:",
              notificationError
            );
          }
        }

        setSaveMessage(
          "Review released successfully!"
        );

        window.setTimeout(
          () =>
            setSaveMessage(
              ""
            ),
          3000
        );
      } catch (error) {
        console.error(
          "Failed to save feedback:",
          error
        );

        setSaveMessage(
          error?.message ||
            "Failed to release review."
        );
      } finally {
        setIsSaving(false);
      }
    };

  const handleQuestionFeedbackChange =
    (
      questionId,
      text
    ) => {
      setQuestionFeedback(
        (current) => ({
          ...current,
          [questionId]: text,
        })
      );
    };

  const renderValue = (
    value
  ) => {
    if (
      Array.isArray(value)
    ) {
      return value.length > 0
        ? value.join(", ")
        : "No answer provided";
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return (
        <span className="text-muted fst-italic">
          No answer provided
        </span>
      );
    }

    if (
      typeof value ===
      "object"
    ) {
      return JSON.stringify(
        value
      );
    }

    return String(value);
  };

  return (
    <div
      className="animate__animated animate__fadeIn"
      data-testid="submission-detail"
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3
            className="fw-bold text-dark mb-1"
            data-testid="submission-detail-title"
          >
            Marking Submission
          </h3>

          <p className="text-muted mb-0">
            <span data-testid="submission-detail-student">
              {
                currentSubmission
                  .studentName
              }
            </span>

            {" - "}

            <span data-testid="submission-detail-exam-title">
              {exam.title}
            </span>
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary px-4"
          onClick={onBack}
        >
          <i className="bi bi-arrow-left me-2" />
          Back to List
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 p-3 text-center">
            <small className="text-uppercase text-muted fw-bold mb-2">
              Calculated Score
            </small>

            <h2
              data-testid="submission-score"
              className={`display-5 fw-bold mb-0 ${
                displayedPercentage >=
                60
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {displayedPercentage.toFixed(
                0
              )}
              %
            </h2>

            <small className="text-muted">
              {earnedPoints} /{" "}
              {maxPoints} points
            </small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 p-3 text-center">
            <small className="text-uppercase text-muted fw-bold mb-2">
              Submitted On
            </small>

            <h5 className="fw-bold mb-0">
              {submittedAt
                ? new Date(
                    submittedAt
                  ).toLocaleDateString()
                : "Unknown"}
            </h5>

            <small className="text-muted">
              {submittedAt
                ? new Date(
                    submittedAt
                  ).toLocaleTimeString()
                : ""}
            </small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 p-3 text-center">
            <small className="text-uppercase text-muted fw-bold mb-2">
              Questions
            </small>

            <h2 className="display-5 fw-bold mb-0 text-primary">
              {questions.length}
            </h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 p-3 text-center">
            <small className="text-uppercase text-muted fw-bold mb-2">
              Review Status
            </small>

            <h5 className="mt-2">
              <span
                className={`badge rounded-pill px-4 py-2 ${
                  isFeedbackVisible
                    ? "bg-success"
                    : "bg-warning text-dark"
                }`}
              >
                {isFeedbackVisible
                  ? "Released"
                  : "Private"}
              </span>
            </h5>
          </div>
        </div>
      </div>

      {aiReviewError && (
        <div
          className="alert alert-danger"
          data-testid="teacher-ai-error"
        >
          {aiReviewError}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4 overflow-hidden">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">
            General Review &amp;
            Overall Feedback
          </h5>

          {saveMessage && (
            <span
              data-testid="submission-save-success"
              className={`badge ${
                /success/i.test(
                  saveMessage
                )
                  ? "bg-success"
                  : "bg-danger"
              } animate__animated animate__fadeIn`}
            >
              {saveMessage}
            </span>
          )}
        </div>

        <div className="card-body p-4 bg-light-subtle">
          <div className="mb-3">
            <label
              htmlFor="feedbackText"
              className="form-label fw-semibold"
            >
              Overall Comments
            </label>

            <textarea
              data-testid="submission-feedback"
              className="form-control border-0 shadow-sm"
              id="feedbackText"
              rows="3"
              placeholder="Enter your overall feedback here..."
              value={feedback}
              onChange={(
                event
              ) =>
                setFeedback(
                  event.target
                    .value
                )
              }
            />
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <div className="form-check form-switch">
              <input
                data-testid="submission-feedback-visible"
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="visibilitySwitch"
                checked={
                  isFeedbackVisible
                }
                onChange={(
                  event
                ) =>
                  setIsFeedbackVisible(
                    event.target
                      .checked
                  )
                }
              />

              <label
                className="form-check-label fw-medium"
                htmlFor="visibilitySwitch"
              >
                Release score and
                review to student
              </label>
            </div>

            <button
              type="button"
              data-testid="submission-save"
              className="btn btn-success px-4 fw-bold shadow-sm"
              onClick={
                handleSaveFeedback
              }
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-upload me-2" />
                  Apply &amp;
                  Release
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden mb-5">
        <div className="card-header bg-white border-0 py-3">
          <h5 className="fw-bold mb-0">
            Question Breakdown
            &amp; Specific
            Feedback
          </h5>
        </div>

        <div className="card-body p-0">
          <div className="list-group list-group-flush">
            {questions.map(
              (
                question,
                index
              ) => {
                const questionId =
                  String(
                    question.id
                  );

                const answerDetail =
                  answersByQuestion.get(
                    questionId
                  ) || {};

                const persistedQuestionId =
                  answerDetail.questionId ||
                  question.id;

                const studentAnswer =
                  answerDetail.answer ??
                  currentSubmission
                    .answers?.[
                    question.id
                  ];

                const correctAnswer =
                  question.correctAnswer;

                const awardedPoints =
                  answerDetail
                    .awardedPoints;

                const questionPoints =
                  Number(
                    question.points ??
                      answerDetail.points ??
                      0
                  );

                const isWritten =
                  question.type ===
                  "written";

                let isCorrect =
                  answerDetail.isCorrect;

                if (
                  isCorrect ===
                    undefined &&
                  !isWritten
                ) {
                  if (
                    question.type ===
                    "multiple-response"
                  ) {
                    const submitted =
                      Array.isArray(
                        studentAnswer
                      )
                        ? studentAnswer
                        : [];

                    const expected =
                      Array.isArray(
                        correctAnswer
                      )
                        ? correctAnswer
                        : [];

                    isCorrect =
                      submitted.length ===
                        expected.length &&
                      submitted.every(
                        (value) =>
                          expected.includes(
                            value
                          )
                      );
                  } else {
                    isCorrect =
                      studentAnswer ===
                      correctAnswer;
                  }
                }

                const isPending =
                  isWritten &&
                  awardedPoints ===
                    null;

                const loading =
                  Boolean(
                    aiReviewLoading[
                      questionId
                    ]
                  );

                const override =
                  overrideValues[
                    questionId
                  ] || {};

                return (
                  <div
                    key={
                      question.id
                    }
                    className="list-group-item p-4"
                    data-testid="submission-question"
                    data-question-id={
                      question.id
                    }
                  >
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <h6 className="fw-bold mb-0">
                        <span className="text-muted me-2">
                          Q
                          {index +
                            1}
                          .
                        </span>

                        {
                          question.text
                        }
                      </h6>

                      {isPending ? (
                        <span className="badge bg-warning-subtle text-warning-emphasis">
                          Pending Review
                        </span>
                      ) : (
                        <span
                          className={`badge ${
                            isCorrect
                              ? "bg-success-subtle text-success"
                              : "bg-danger-subtle text-danger"
                          }`}
                        >
                          {isCorrect
                            ? "Correct"
                            : "Incorrect"}
                        </span>
                      )}
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded-3 h-100 border-start border-4 border-primary">
                          <small className="text-uppercase text-muted fw-bold d-block mb-1">
                            Student
                            Answer
                          </small>

                          <div className="fw-semibold text-dark">
                            {renderValue(
                              studentAnswer
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded-3 h-100 border-start border-4 border-success">
                          <small className="text-uppercase text-muted fw-bold d-block mb-1">
                            Reference
                            Answer
                          </small>

                          <div className="fw-semibold text-dark">
                            {renderValue(
                              correctAnswer
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="p-3 bg-white border rounded-3 h-100">
                          <small className="text-uppercase text-muted fw-bold d-block mb-1 text-primary">
                            Question
                            Feedback
                          </small>

                          <textarea
                            className="form-control form-control-sm border-0 bg-transparent p-0"
                            rows="2"
                            placeholder="Specific feedback..."
                            value={
                              questionFeedback[
                                question.id
                              ] ??
                              answerDetail.feedback ??
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              handleQuestionFeedbackChange(
                                question.id,
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                    {isWritten && (
                      <div
                        className="card border-secondary mt-4"
                        data-testid="teacher-manual-grade"
                      >
                        <div className="card-body">
                          <h6 className="fw-bold mb-3">
                            Manual Written-Answer Grade
                          </h6>

                          <div className="row g-3">
                            <div className="col-md-3">
                              <label className="form-label">
                                Awarded points
                              </label>

                              <input
                                type="number"
                                min="0"
                                max={questionPoints}
                                step="0.5"
                                className="form-control"
                                value={
                                  manualGrades[
                                    questionId
                                  ]?.awardedPoints ??
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  setManualGrades(
                                    (current) => ({
                                      ...current,

                                      [questionId]: {
                                        ...current[
                                          questionId
                                        ],

                                        awardedPoints:
                                          event.target
                                            .value,
                                      },
                                    })
                                  )
                                }
                                data-testid="teacher-manual-points"
                              />
                            </div>

                            <div className="col-md-7">
                              <label className="form-label">
                                Teacher feedback
                              </label>

                              <textarea
                                rows="2"
                                className="form-control"
                                value={
                                  manualGrades[
                                    questionId
                                  ]?.feedback ??
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  setManualGrades(
                                    (current) => ({
                                      ...current,

                                      [questionId]: {
                                        ...current[
                                          questionId
                                        ],

                                        feedback:
                                          event.target
                                            .value,
                                      },
                                    })
                                  )
                                }
                                data-testid="teacher-manual-feedback"
                              />
                            </div>

                            <div className="col-md-2 d-flex align-items-end">
                              <button
                                type="button"
                                className="btn btn-primary w-100"
                                disabled={loading}
                                onClick={() =>
                                  handleManualGrade(
                                    persistedQuestionId,
                                    questionPoints
                                  )
                                }
                                data-testid="teacher-manual-save"
                              >
                                {loading
                                  ? "Saving..."
                                  : "Save Grade"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {isWritten &&
                      answerDetail.aiGradingStatus && (
                        <div
                          className="card border-primary-subtle bg-primary-subtle mt-4"
                          data-testid="teacher-ai-suggestion"
                          data-question-id={
                            question.id
                          }
                        >
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                              <div>
                                <h6 className="fw-bold mb-1">
                                  <i className="bi bi-stars me-2" />
                                  AI
                                  Grading
                                  Suggestion
                                </h6>

                                <div className="small text-muted">
                                  Teacher
                                  review
                                  is
                                  required
                                  before
                                  this
                                  becomes
                                  the
                                  final
                                  grade.
                                </div>
                              </div>

                              <span
                                className="badge bg-primary"
                                data-testid="teacher-ai-status"
                              >
                                {
                                  answerDetail.aiGradingStatus
                                }
                              </span>
                            </div>

                            <div className="row g-3 mb-3">
                              <div className="col-md-4">
                                <div className="bg-white rounded p-3 h-100">
                                  <div className="small text-muted text-uppercase fw-bold">
                                    Suggested
                                    Points
                                  </div>

                                  <div
                                    className="fs-4 fw-bold"
                                    data-testid="teacher-ai-points"
                                  >
                                    {answerDetail.aiAwardedPoints ??
                                      "—"}{" "}
                                    /{" "}
                                    {
                                      questionPoints
                                    }
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-4">
                                <div className="bg-white rounded p-3 h-100">
                                  <div className="small text-muted text-uppercase fw-bold">
                                    Confidence
                                  </div>

                                  <div
                                    className="fs-4 fw-bold"
                                    data-testid="teacher-ai-confidence"
                                  >
                                    {answerDetail.aiConfidence ===
                                      null ||
                                    answerDetail.aiConfidence ===
                                      undefined
                                      ? "—"
                                      : `${Math.round(
                                          Number(
                                            answerDetail.aiConfidence
                                          ) *
                                            100
                                        )}%`}
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-4">
                                <div className="bg-white rounded p-3 h-100">
                                  <div className="small text-muted text-uppercase fw-bold">
                                    Final
                                    Points
                                  </div>

                                  <div
                                    className="fs-4 fw-bold"
                                    data-testid="teacher-final-points"
                                  >
                                    {awardedPoints ??
                                      "Pending"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded p-3 mb-3">
                              <div className="small text-muted text-uppercase fw-bold mb-1">
                                AI
                                Feedback
                              </div>

                              <p
                                className="mb-0"
                                data-testid="teacher-ai-feedback"
                              >
                                {answerDetail.aiFeedback ||
                                  "No AI feedback was provided."}
                              </p>
                            </div>

                            {Array.isArray(
                              answerDetail.aiStrengths
                            ) &&
                              answerDetail
                                .aiStrengths
                                .length >
                                0 && (
                                <div className="bg-white rounded p-3 mb-3">
                                  <div className="small text-success text-uppercase fw-bold mb-2">
                                    Strengths
                                  </div>

                                  <ul className="mb-0">
                                    {answerDetail.aiStrengths.map(
                                      (
                                        strength,
                                        strengthIndex
                                      ) => (
                                        <li
                                          key={`${strength}-${strengthIndex}`}
                                        >
                                          {
                                            strength
                                          }
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}

                            {Array.isArray(
                              answerDetail.aiMissingConcepts
                            ) &&
                              answerDetail
                                .aiMissingConcepts
                                .length >
                                0 && (
                                <div className="bg-white rounded p-3 mb-3">
                                  <div className="small text-warning-emphasis text-uppercase fw-bold mb-2">
                                    Missing
                                    Concepts
                                  </div>

                                  <ul className="mb-0">
                                    {answerDetail.aiMissingConcepts.map(
                                      (
                                        concept,
                                        conceptIndex
                                      ) => (
                                        <li
                                          key={`${concept}-${conceptIndex}`}
                                        >
                                          {
                                            concept
                                          }
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}

                            {answerDetail.aiGradingStatus ===
                              "ai-suggestion-ready" && (
                              <>
                                <div className="d-flex flex-wrap gap-2 mb-4">
                                  <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() =>
                                      handleAiReview(
                                        question.id,
                                        "accept"
                                      )
                                    }
                                    disabled={
                                      loading
                                    }
                                    data-testid="teacher-ai-accept"
                                  >
                                    {loading
                                      ? "Saving..."
                                      : "Accept AI Suggestion"}
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                      handleAiReview(
                                        question.id,
                                        "reject"
                                      )
                                    }
                                    disabled={
                                      loading
                                    }
                                    data-testid="teacher-ai-reject"
                                  >
                                    Reject
                                  </button>
                                </div>

                                <div className="border-top pt-3">
                                  <h6 className="fw-bold">
                                    Override
                                    Suggestion
                                  </h6>

                                  <div className="row g-3">
                                    <div className="col-md-3">
                                      <label className="form-label">
                                        Awarded
                                        points
                                      </label>

                                      <input
                                        type="number"
                                        min="0"
                                        max={
                                          questionPoints
                                        }
                                        step="0.5"
                                        className="form-control"
                                        value={
                                          override.awardedPoints ??
                                          ""
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          setOverrideValues(
                                            (
                                              current
                                            ) => ({
                                              ...current,

                                              [questionId]:
                                                {
                                                  ...current[
                                                    questionId
                                                  ],

                                                  awardedPoints:
                                                    event
                                                      .target
                                                      .value,
                                                },
                                            })
                                          )
                                        }
                                        data-testid="teacher-ai-override-points"
                                      />
                                    </div>

                                    <div className="col-md-7">
                                      <label className="form-label">
                                        Teacher
                                        feedback
                                      </label>

                                      <input
                                        type="text"
                                        className="form-control"
                                        value={
                                          override.feedback ??
                                          ""
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          setOverrideValues(
                                            (
                                              current
                                            ) => ({
                                              ...current,

                                              [questionId]:
                                                {
                                                  ...current[
                                                    questionId
                                                  ],

                                                  feedback:
                                                    event
                                                      .target
                                                      .value,
                                                },
                                            })
                                          )
                                        }
                                        data-testid="teacher-ai-override-feedback"
                                      />
                                    </div>

                                    <div className="col-md-2 d-flex align-items-end">
                                      <button
                                        type="button"
                                        className="btn btn-warning w-100"
                                        onClick={() =>
                                          handleAiReview(
                                            question.id,
                                            "override"
                                          )
                                        }
                                        disabled={
                                          loading
                                        }
                                        data-testid="teacher-ai-override"
                                      >
                                        Override
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {[
                              "accepted",
                              "overridden",
                              "rejected",
                            ].includes(
                              answerDetail.aiGradingStatus
                            ) && (
                              <div
                                className="alert alert-light border mb-0"
                                data-testid="teacher-ai-reviewed"
                              >
                                AI
                                suggestion
                                review
                                completed:{" "}
                                <strong>
                                  {
                                    answerDetail.aiGradingStatus
                                  }
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
