// רכיב שאחרי הגשת הבחינה
const ExamResult = ({
  finalResult,
  onGoToSubmissions,
}) => {
  if (!finalResult) {
    return (
      <div
        className="alert alert-danger"
        data-testid="student-result-error"
      >
        No exam result is available.
      </div>
    );
  }

  const percentage = Number(
    finalResult.percentage ??
      (
        Number(finalResult.maxScore) > 0
          ? (
              Number(finalResult.score) /
              Number(finalResult.maxScore)
            ) * 100
          : 0
      )
  );

  const passingScore = Number(
    finalResult.passingScore ?? 60
  );

  const isPassed =
    finalResult.isPassed !== undefined
      ? Boolean(finalResult.isPassed)
      : percentage >= passingScore;

  const showScore =
    finalResult.releaseScoresImmediately !== false &&
    finalResult.isScorePublished !== false;

  return (
    <div
      className="container mt-4 text-center animate__animated animate__fadeIn"
      data-testid="student-result"
    >
      <div className="card shadow border-0 p-5 bg-white rounded-4">
        <div className="mb-4">
          <div
            className={`display-1 ${
              showScore
                ? isPassed
                  ? "text-success"
                  : "text-danger"
                : "text-primary"
            } mb-2`}
          >
            <i
              className={`bi ${
                showScore
                  ? isPassed
                    ? "bi-check-circle-fill"
                    : "bi-exclamation-circle-fill"
                  : "bi-send-check-fill"
              }`}
            />
          </div>

          <h2 className="fw-bold">
            {showScore
              ? isPassed
                ? "Congratulations!"
                : "Exam Completed"
              : "Exam Submitted!"}
          </h2>

          <p
            className="text-muted fs-5"
            data-testid="student-result-exam-title"
          >
            You've finished{" "}
            <strong>
              {finalResult.examTitle}
            </strong>
          </p>
        </div>

        {showScore ? (
          <div
            className="card mx-auto shadow-sm border-0 bg-light rounded-4 mb-4"
            style={{
              maxWidth: "500px",
            }}
          >
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-6 border-end">
                  <div className="small text-uppercase fw-bold text-muted mb-1">
                    Your Score
                  </div>

                  <div
                    className={`display-4 fw-bold ${
                      isPassed
                        ? "text-success"
                        : "text-danger"
                    }`}
                    data-testid="student-score"
                  >
                    {percentage.toFixed(0)}%
                  </div>

                  <div className="small text-muted mt-2">
                    {Number(
                      finalResult.score ?? 0
                    )}{" "}
                    /{" "}
                    {Number(
                      finalResult.maxScore ?? 0
                    )}{" "}
                    points
                  </div>
                </div>

                <div className="col-6">
                  <div className="small text-uppercase fw-bold text-muted mb-1">
                    Result
                  </div>

                  <div
                    className={`h2 fw-bold mb-0 ${
                      isPassed
                        ? "text-success"
                        : "text-danger"
                    }`}
                    data-testid="student-pass-status"
                  >
                    {isPassed
                      ? "PASSED"
                      : "FAILED"}
                  </div>

                  <div className="small text-muted mt-1">
                    Passing: {passingScore}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="card mx-auto shadow-sm border-0 bg-light rounded-4 mb-4"
            style={{
              maxWidth: "500px",
            }}
            data-testid="student-score-pending"
          >
            <div className="card-body p-4">
              <i className="bi bi-clock-history text-primary fs-3 mb-3 d-block" />

              <h5 className="fw-bold">
                Marking in Progress
              </h5>

              <p className="text-muted small mb-0">
                The teacher has chosen to review all
                submissions before releasing scores.
                Your results will be available in the
                "My Feedback" tab once released.
              </p>
            </div>
          </div>
        )}

        {showScore &&
          finalResult.feedback && (
            <div
              className="alert alert-info border-0 shadow-sm mx-auto"
              style={{
                maxWidth: "500px",
              }}
              data-testid="student-result-feedback"
            >
              <i className="bi bi-info-circle-fill me-2" />
              {finalResult.feedback}
            </div>
          )}

        <button
          type="button"
          className="btn btn-primary mt-4 px-5 py-3 fw-bold rounded-pill shadow"
          onClick={onGoToSubmissions}
          data-testid="student-view-submissions"
        >
          View All My Submissions
        </button>
      </div>
    </div>
  );
};

export default ExamResult;