CREATE TABLE IF NOT EXISTS exam_submissions (
    id TEXT PRIMARY KEY,

    exam_id TEXT NOT NULL
        REFERENCES exams(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'submitted',

    score NUMERIC(7, 2),
    max_score NUMERIC(7, 2),
    percentage NUMERIC(5, 2),

    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,

    feedback TEXT NOT NULL DEFAULT '',
    is_feedback_visible BOOLEAN NOT NULL DEFAULT FALSE,
    is_score_published BOOLEAN NOT NULL DEFAULT FALSE,

    graded_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT submissions_status_check
        CHECK (
            status IN (
                'in-progress',
                'submitted',
                'grading',
                'graded'
            )
        ),

    CONSTRAINT submissions_score_check
        CHECK (score IS NULL OR score >= 0),

    CONSTRAINT submissions_max_score_check
        CHECK (max_score IS NULL OR max_score > 0),

    CONSTRAINT submissions_percentage_check
        CHECK (
            percentage IS NULL
            OR (
                percentage >= 0
                AND percentage <= 100
            )
        ),

    CONSTRAINT one_submission_per_student_exam
        UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS submission_answers (
    id BIGSERIAL PRIMARY KEY,

    submission_id TEXT NOT NULL
        REFERENCES exam_submissions(id)
        ON DELETE CASCADE,

    question_id TEXT NOT NULL
        REFERENCES questions(id)
        ON DELETE CASCADE,

    answer JSONB,

    is_correct BOOLEAN,
    awarded_points NUMERIC(8, 2),

    feedback TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT answer_points_check
        CHECK (
            awarded_points IS NULL
            OR awarded_points >= 0
        ),

    CONSTRAINT one_answer_per_submission_question
        UNIQUE (submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_exam_id
    ON exam_submissions(exam_id);

CREATE INDEX IF NOT EXISTS idx_submissions_student_id
    ON exam_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_submissions_status
    ON exam_submissions(status);

CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at
    ON exam_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_submission_answers_submission_id
    ON submission_answers(submission_id);

CREATE INDEX IF NOT EXISTS idx_submission_answers_question_id
    ON submission_answers(question_id);

DROP TRIGGER IF EXISTS submissions_set_updated_at
    ON exam_submissions;

CREATE TRIGGER submissions_set_updated_at
BEFORE UPDATE ON exam_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS submission_answers_set_updated_at
    ON submission_answers;

CREATE TRIGGER submission_answers_set_updated_at
BEFORE UPDATE ON submission_answers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();