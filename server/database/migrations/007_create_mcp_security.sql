CREATE TABLE IF NOT EXISTS mcp_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    email VARCHAR(320),
    role VARCHAR(20),

    tool_name VARCHAR(100) NOT NULL,
    args JSONB NOT NULL DEFAULT '{}'::JSONB,
    result JSONB,

    success BOOLEAN NOT NULL,
    error TEXT,

    duration_ms INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT mcp_audit_role_check
        CHECK (
            role IS NULL
            OR role IN (
                'Student',
                'Teacher',
                'Admin'
            )
        ),

    CONSTRAINT mcp_audit_duration_check
        CHECK (duration_ms >= 0)
);

CREATE TABLE IF NOT EXISTS mcp_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    tool_name VARCHAR(100) NOT NULL,
    args JSONB NOT NULL DEFAULT '{}'::JSONB,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    confirmed_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,

    CONSTRAINT mcp_confirmation_status_check
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'consumed',
                'expired',
                'cancelled'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_user_id
    ON mcp_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_tool_name
    ON mcp_audit_logs(tool_name);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_created_at
    ON mcp_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_success
    ON mcp_audit_logs(success);

CREATE INDEX IF NOT EXISTS idx_mcp_confirmations_lookup
    ON mcp_confirmations(
        id,
        user_id,
        tool_name,
        status
    );

CREATE INDEX IF NOT EXISTS idx_mcp_confirmations_expires_at
    ON mcp_confirmations(expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_confirmation_per_action
    ON mcp_confirmations(
        user_id,
        tool_name,
        MD5(args::TEXT)
    )
    WHERE status = 'pending';