const FeedbackDetail = ({
  selectedFeedback,
  setSelectedFeedback,
  feedbackExam,
  setFeedbackExam,
  showFullReview,
  setShowFullReview,
}) => {
  const review =
    feedbackExam ||
    selectedFeedback;

  if (!review) {
    return (
      <div
        className="alert alert-warning"
        data-testid="student-feedback-empty"
      >
        No submission review is available.
      </div>
    );
  }

  const percentage =
    review.percentage === null ||
    review.percentage === undefined
      ? null
      : Number(review.percentage);

  const questions =
    Array.isArray(review.questions)
      ? review.questions
      : [];

  const submittedAt =
    review.submittedAt ||
    review.date ||
    null;

  const handleBack = () => {
    setSelectedFeedback(null);
    setFeedbackExam(null);
    setShowFullReview(false);
  };

  return (
    <div
      className="animate__animated animate__fadeIn"
      data-testid="student-feedback-detail"
    >
      <button
        type="button"
        className="btn btn-link mb-3 p-0"
        onClick={handleBack}
        data-testid="student-feedback-back"
      >
        <i className="bi bi-arrow-left me-1" />
        Back to Submissions
      </button>

      {!showFullReview ? (
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="card-header bg-primary text-white py-3">
            <h5
              className="mb-0 fw-bold"
              data-testid="student-feedback-exam-title"
            >
              Review for {review.examTitle}
            </h5>
          </div>

          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
              <div>
                <h6 className="text-muted small text-uppercase fw-bold mb-1">
                  Your Final Score
                </h6>

                {review.isScorePublished &&
                percentage !== null ? (
                  <h3
                    className={`fw-bold mb-0 ${
                      percentage >= 60
                        ? "text-success"
                        : "text-danger"
                    }`}
                    data-testid="student-feedback-score"
                  >
                    {percentage.toFixed(0)}%
                  </h3>
                ) : (
                  <div
                    className="text-muted fw-semibold"
                    data-testid="student-feedback-score-hidden"
                  >
                    Not released
                  </div>
                )}
              </div>

              <div className="text-end">
                <h6 className="text-muted small text-uppercase fw-bold mb-1">
                  Date Submitted
                </h6>

                <p className="mb-0 fw-medium">
                  {submittedAt
                    ? new Date(
                        submittedAt
                      ).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>

            {review.isFeedbackVisible ? (
              <div
                className="p-4 bg-light rounded-4 border-start border-4 border-primary mb-4"
                data-testid="student-feedback-general"
              >
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-chat-left-text me-2" />
                  Teacher&apos;s Overall Comments
                </h6>

                <p
                  className="mb-0 lh-base text-dark"
                  style={{
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {review.feedback ||
                    "No overall feedback was provided."}
                </p>
              </div>
            ) : (
              <div
                className="alert alert-secondary"
                data-testid="student-feedback-hidden"
              >
                Feedback has not been released yet.
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                className="btn btn-outline-primary px-5 fw-bold"
                onClick={() =>
                  setShowFullReview(
                    true
                  )
                }
                disabled={
                  questions.length === 0
                }
                data-testid="student-feedback-open-review"
              >
                <i className="bi bi-eye me-2" />
                View Detailed Question Review
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate__animated animate__fadeIn">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold text-dark mb-0">
              Detailed Review:{" "}
              {review.examTitle}
            </h4>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() =>
                setShowFullReview(
                  false
                )
              }
              data-testid="student-feedback-close-review"
            >
              Close Breakdown
            </button>
          </div>

          <div className="list-group shadow-sm rounded-4 overflow-hidden mb-5">
            {questions.map(
              (
                question,
                index
              ) => {
                const studentAnswer =
                  question.studentAnswer;

                return (
                  <div
                    key={
                      question.questionId
                    }
                    className="list-group-item p-4"
                    data-testid="student-feedback-question"
                    data-question-id={
                      question.questionId
                    }
                  >
                    <div className="d-flex justify-content-between mb-3">
                      <h6
                        className="fw-bold mb-0"
                        data-testid="student-feedback-question-text"
                      >
                        <span className="text-muted me-2">
                          {index + 1}.
                        </span>

                        {question.text}
                      </h6>

                      {review.isScorePublished && (
                        <span
                          className="badge bg-primary-subtle text-primary"
                          data-testid="student-feedback-question-points"
                        >
                          {Number(
                            question.awardedPoints ??
                              0
                          )}{" "}
                          /{" "}
                          {Number(
                            question.points ??
                              0
                          )}
                        </span>
                      )}
                    </div>

                    <div className="p-2 px-3 bg-light rounded border-start border-3 border-primary mb-3">
                      <small
                        className="text-uppercase text-muted fw-bold d-block mb-1"
                        style={{
                          fontSize:
                            "0.7rem",
                        }}
                      >
                        Your Answer
                      </small>

                      <span
                        className="small"
                        data-testid="student-feedback-student-answer"
                      >
                        {Array.isArray(
                          studentAnswer
                        )
                          ? studentAnswer.join(
                              ", "
                            )
                          : String(
                              studentAnswer ??
                                "N/A"
                            )}
                      </span>
                    </div>

                    {review.isFeedbackVisible && (
                      <div
                        className="p-3 bg-warning-subtle rounded border-start border-4 border-warning"
                        data-testid="student-feedback-question-comment"
                      >
                        <small
                          className="text-uppercase text-warning-emphasis fw-bold d-block mb-1"
                          style={{
                            fontSize:
                              "0.7rem",
                          }}
                        >
                          Teacher&apos;s Note
                        </small>

                        <p className="small mb-0">
                          {question.feedback ||
                            "No feedback was provided for this question."}
                        </p>
                      </div>
                    )}
                  </div>
                );
              }
            )}

            {questions.length ===
              0 && (
              <div
                className="alert alert-secondary mb-0"
                data-testid="student-feedback-no-questions"
              >
                No question review is available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDetail;