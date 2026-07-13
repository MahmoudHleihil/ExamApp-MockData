CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    subject VARCHAR(150),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',

    created_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    published BOOLEAN NOT NULL DEFAULT FALSE,
    release_scores_immediately BOOLEAN NOT NULL DEFAULT FALSE,

    password_hash TEXT,

    time_limit INTEGER,
    early_access_minutes INTEGER NOT NULL DEFAULT 0,
    is_always_available BOOLEAN NOT NULL DEFAULT FALSE,

    scheduled_date TIMESTAMPTZ,
    passing_score NUMERIC(5, 2) NOT NULL DEFAULT 60,

    source_document_id TEXT,
    source_document_title TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT exams_difficulty_check
        CHECK (difficulty IN ('easy', 'medium', 'hard')),

    CONSTRAINT exams_time_limit_check
        CHECK (time_limit IS NULL OR time_limit > 0),

    CONSTRAINT exams_early_access_check
        CHECK (early_access_minutes >= 0),

    CONSTRAINT exams_passing_score_check
        CHECK (
            passing_score >= 0
            AND passing_score <= 100
        )
);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,

    exam_id TEXT NOT NULL
        REFERENCES exams(id)
        ON DELETE CASCADE,

    position INTEGER NOT NULL,

    type VARCHAR(30) NOT NULL,
    question_text TEXT NOT NULL,

    options JSONB NOT NULL DEFAULT '[]'::JSONB,
    correct_answer JSONB NOT NULL,

    points NUMERIC(8, 2) NOT NULL DEFAULT 1,
    source_evidence TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT questions_type_check
        CHECK (
            type IN (
                'multiple-choice',
                'multiple-response',
                'true-false',
                'written'
            )
        ),

    CONSTRAINT questions_position_check
        CHECK (position >= 0),

    CONSTRAINT questions_points_check
        CHECK (points > 0),

    CONSTRAINT questions_exam_position_unique
        UNIQUE (exam_id, position)
);

CREATE INDEX IF NOT EXISTS idx_exams_created_by
    ON exams(created_by);

CREATE INDEX IF NOT EXISTS idx_exams_published
    ON exams(published);

CREATE INDEX IF NOT EXISTS idx_exams_scheduled_date
    ON exams(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_questions_exam_id
    ON questions(exam_id);

DROP TRIGGER IF EXISTS exams_set_updated_at
    ON exams;

CREATE TRIGGER exams_set_updated_at
BEFORE UPDATE ON exams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS questions_set_updated_at
    ON questions;

CREATE TRIGGER questions_set_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();