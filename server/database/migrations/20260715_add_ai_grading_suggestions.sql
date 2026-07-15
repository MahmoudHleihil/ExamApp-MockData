ALTER TABLE submission_answers
ADD COLUMN IF NOT EXISTS ai_awarded_points NUMERIC(8, 2),
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(5, 4),
ADD COLUMN IF NOT EXISTS ai_feedback TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS ai_strengths JSONB NOT NULL DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS ai_missing_concepts JSONB NOT NULL DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS ai_grading_status VARCHAR(40),
ADD COLUMN IF NOT EXISTS ai_graded_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'submission_answers_ai_points_check'
    ) THEN
        ALTER TABLE submission_answers
        ADD CONSTRAINT submission_answers_ai_points_check
        CHECK (
            ai_awarded_points IS NULL
            OR ai_awarded_points >= 0
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'submission_answers_ai_confidence_check'
    ) THEN
        ALTER TABLE submission_answers
        ADD CONSTRAINT submission_answers_ai_confidence_check
        CHECK (
            ai_confidence IS NULL
            OR (
                ai_confidence >= 0
                AND ai_confidence <= 1
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'submission_answers_ai_status_check'
    ) THEN
        ALTER TABLE submission_answers
        ADD CONSTRAINT submission_answers_ai_status_check
        CHECK (
            ai_grading_status IS NULL
            OR ai_grading_status IN (
                'pending',
                'ai-suggestion-ready',
                'ai-grading-failed',
                'accepted',
                'overridden',
                'rejected'
            )
        );
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_submission_answers_ai_status
ON submission_answers(ai_grading_status);