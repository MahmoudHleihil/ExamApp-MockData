import { useMemo } from "react";

const FeedbackList = ({
  studentSubmissions,
  handleViewFeedback,
}) => {
  const submissions =
    Array.isArray(studentSubmissions)
      ? studentSubmissions
      : [];

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

  const feedbackStats =
    useMemo(() => {
      const publishedResults =
        submissions.filter(
          (submission) =>
            Boolean(
              submission
                .isScorePublished
            )
        );

      const visibleFeedback =
        submissions.filter(
          (submission) =>
            Boolean(
              submission
                .isFeedbackVisible
            )
        );

      const publishedPercentages =
        publishedResults
          .map(getPercentage)
          .filter(
            (percentage) =>
              Number.isFinite(
                percentage
              )
          );

      const averageScore =
        publishedPercentages
          .length > 0
          ? publishedPercentages
              .reduce(
                (
                  total,
                  percentage
                ) =>
                  total +
                  percentage,
                0
              ) /
            publishedPercentages
              .length
          : 0;

      const passedExams =
        publishedResults.filter(
          (submission) => {
            const percentage =
              getPercentage(
                submission
              );

            const passingScore =
              Number(
                submission
                  .passingScore ??
                60
              );

            return (
              percentage >=
              passingScore
            );
          }
        );

      const failedExams =
        publishedResults.filter(
          (submission) => {
            const percentage =
              getPercentage(
                submission
              );

            const passingScore =
              Number(
                submission
                  .passingScore ??
                60
              );

            return (
              percentage <
              passingScore
            );
          }
        );

      const awaitingReview =
        submissions.filter(
          (submission) =>
            !submission
              .isFeedbackVisible
        );

      const highestScore =
        publishedPercentages
          .length > 0
          ? Math.max(
              ...publishedPercentages
            )
          : 0;

      return {
        totalSubmissions:
          submissions.length,

        publishedResults:
          publishedResults.length,

        visibleFeedback:
          visibleFeedback.length,

        awaitingReview:
          awaitingReview.length,

        passedExams:
          passedExams.length,

        failedExams:
          failedExams.length,

        averageScore:
          Number(
            averageScore.toFixed(
              1
            )
          ),

        highestScore:
          Number(
            highestScore.toFixed(
              1
            )
          ),
      };
    }, [submissions]);

  const StatisticCard = ({
    title,
    value,
    icon,
    color,
    description,
  }) => (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm rounded-4 h-100">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <small className="text-muted text-uppercase fw-bold">
                {title}
              </small>

              <h2
                className={`fw-bold text-${color} mt-2 mb-1`}
              >
                {value}
              </h2>

              <small className="text-muted">
                {description}
              </small>
            </div>

            <div
              className={`
                bg-${color}
                bg-opacity-10
                text-${color}
                rounded-circle
                d-flex
                align-items-center
                justify-content-center
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

  return (
    <div
      data-testid="student-feedback-list"
      className="animate__animated animate__fadeIn"
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">
            My Exam Results
          </h3>

          <p className="text-muted mb-0">
            Track your results,
            feedback, and progress.
          </p>
        </div>

        <i className="bi bi-bar-chart-line fs-2 text-primary" />
      </div>

      {submissions.length > 0 && (
        <>
          <div className="row g-3 mb-4">
            <StatisticCard
              title="Submitted"
              value={
                feedbackStats
                  .totalSubmissions
              }
              icon="bi-clipboard-check"
              color="primary"
              description="Total completed exams"
            />

            <StatisticCard
              title="Results Published"
              value={
                feedbackStats
                  .publishedResults
              }
              icon="bi-eye"
              color="info"
              description={`${feedbackStats.awaitingReview} awaiting review`}
            />

            <StatisticCard
              title="Average Score"
              value={`${feedbackStats.averageScore}%`}
              icon="bi-graph-up-arrow"
              color="success"
              description={`Highest: ${feedbackStats.highestScore}%`}
            />

            <StatisticCard
              title="Passed"
              value={
                feedbackStats
                  .passedExams
              }
              icon="bi-award"
              color="warning"
              description={`${feedbackStats.failedExams} not passed`}
            />
          </div>

          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-1">
                    Results Overview
                  </h5>

                  <small className="text-muted">
                    Published versus
                    pending exam results
                  </small>
                </div>

                <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                  {
                    feedbackStats
                      .visibleFeedback
                  }
                  {" reviews available"}
                </span>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className="bg-light rounded-4 p-3 text-center">
                    <h3 className="fw-bold text-success mb-1">
                      {
                        feedbackStats
                          .passedExams
                      }
                    </h3>

                    <small className="text-muted">
                      Passed
                    </small>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="bg-light rounded-4 p-3 text-center">
                    <h3 className="fw-bold text-danger mb-1">
                      {
                        feedbackStats
                          .failedExams
                      }
                    </h3>

                    <small className="text-muted">
                      Not Passed
                    </small>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="bg-light rounded-4 p-3 text-center">
                    <h3 className="fw-bold text-warning mb-1">
                      {
                        feedbackStats
                          .awaitingReview
                      }
                    </h3>

                    <small className="text-muted">
                      Awaiting Review
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {submissions.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center bg-light rounded-4">
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
              {submissions.map(
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

                  const passingScore =
                    Number(
                      submission
                        .passingScore ??
                      60
                    );

                  const hasPassed =
                    percentage >=
                    passingScore;

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
                          submission
                            .examTitle
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
                            <i className="bi bi-check-circle me-1" />
                            Marked
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning rounded-pill px-3">
                            <i className="bi bi-hourglass-split me-1" />
                            Awaiting Review
                          </span>
                        )}
                      </td>

                      <td>
                        {canViewScore ? (
                          <div>
                            <span
                              className={`fw-bold ${
                                hasPassed
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

                            <small
                              className={`d-block ${
                                hasPassed
                                  ? "text-success"
                                  : "text-danger"
                              }`}
                            >
                              {hasPassed
                                ? "Passed"
                                : "Not Passed"}
                            </small>
                          </div>
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
                            <i className="bi bi-eye me-1" />
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