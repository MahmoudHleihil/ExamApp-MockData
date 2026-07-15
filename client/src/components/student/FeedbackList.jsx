const FeedbackList = ({
  studentSubmissions,
  handleViewFeedback,
}) => {
  const getPercentage = (
    submission
  ) => {
    const storedPercentage =
      Number(
        submission.percentage
      );

    if (
      Number.isFinite(
        storedPercentage
      )
    ) {
      return storedPercentage;
    }

    const score =
      Number(
        submission.score ?? 0
      );

    const maxScore =
      Number(
        submission.maxScore ?? 0
      );

    return maxScore > 0
      ? (
          score /
          maxScore
        ) * 100
      : 0;
  };

  return (
    <div
      data-testid="student-feedback-list"
      className="animate__animated animate__fadeIn"
    >
      <h3 className="fw-bold mb-4">
        My Exam Results
      </h3>

      {studentSubmissions.length ===
      0 ? (
        <div className="card border-0 shadow-sm p-5 text-center bg-light">
          <i className="bi bi-clipboard-x display-1 text-muted opacity-25 mb-3" />

          <p className="text-muted fs-5">
            You haven&apos;t submitted
            any exams yet.
          </p>
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded-4 overflow-hidden">
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead className="table-light">
              <tr>
                <th className="ps-4">
                  Exam Title
                </th>
                <th>Date</th>
                <th>Status</th>
                <th>Score</th>
                <th className="text-end pe-4">
                  Review
                </th>
              </tr>
            </thead>

            <tbody>
              {studentSubmissions.map(
                (submission) => {
                  const percentage =
                    getPercentage(
                      submission
                    );

                  const canViewFeedback =
                    Boolean(
                      submission
                        .isFeedbackVisible
                    );

                  const canViewScore =
                    Boolean(
                      submission
                        .isScorePublished
                    );

                  const submittedAt =
                    submission
                      .submittedAt ||
                    submission.date;

                  return (
                    <tr
                      key={
                        submission.id
                      }
                      data-testid="student-feedback-card"
                      data-submission-id={
                        submission.id
                      }
                      data-exam-id={
                        submission.examId
                      }
                    >
                      <td
                        className="ps-4 fw-semibold"
                        data-testid="student-feedback-list-exam-title"
                      >
                        {
                          submission.examTitle
                        }
                      </td>

                      <td className="text-muted small">
                        {submittedAt
                          ? new Date(
                              submittedAt
                            ).toLocaleDateString()
                          : "Unknown"}
                      </td>

                      <td>
                        {canViewFeedback ? (
                          <span className="badge bg-success-subtle text-success rounded-pill px-3">
                            Marked
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning rounded-pill px-3">
                            Awaiting Review
                          </span>
                        )}
                      </td>

                      <td>
                        {canViewScore ? (
                          <span
                            className={`fw-bold ${
                              percentage >=
                              60
                                ? "text-success"
                                : "text-danger"
                            }`}
                            data-testid="student-feedback-list-score"
                          >
                            {percentage.toFixed(
                              0
                            )}
                            %
                          </span>
                        ) : (
                          <span
                            className="text-muted small"
                            data-testid="student-feedback-list-score-hidden"
                          >
                            ---
                          </span>
                        )}
                      </td>

                      <td className="text-end pe-4">
                        {canViewFeedback ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary px-3 rounded-pill fw-bold"
                            onClick={() =>
                              handleViewFeedback(
                                submission
                              )
                            }
                            data-testid="student-feedback-view"
                          >
                            View Results
                          </button>
                        ) : (
                          <span
                            className="text-muted small"
                            data-testid="student-feedback-private"
                          >
                            <i className="bi bi-lock-fill me-1" />
                            Private
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
