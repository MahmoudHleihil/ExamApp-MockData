CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255),
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,

    uploaded_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    uploaded_by_role VARCHAR(20) NOT NULL,

    visibility VARCHAR(20) NOT NULL DEFAULT 'private',
    course_id TEXT,

    file_size_bytes BIGINT,
    page_count INTEGER,

    processing_status VARCHAR(30) NOT NULL DEFAULT 'ready',
    processing_error TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT documents_role_check
        CHECK (
            uploaded_by_role IN (
                'Student',
                'Teacher',
                'Admin'
            )
        ),

    CONSTRAINT documents_visibility_check
        CHECK (
            visibility IN (
                'private',
                'students',
                'teachers',
                'course',
                'public'
            )
        ),

    CONSTRAINT documents_processing_status_check
        CHECK (
            processing_status IN (
                'pending',
                'processing',
                'ready',
                'failed'
            )
        ),

    CONSTRAINT documents_file_size_check
        CHECK (
            file_size_bytes IS NULL
            OR file_size_bytes >= 0
        ),

    CONSTRAINT documents_page_count_check
        CHECK (
            page_count IS NULL
            OR page_count >= 0
        )
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    chunk_index INTEGER NOT NULL,
    text_content TEXT NOT NULL,

    page_number INTEGER,
    token_count INTEGER,

    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT document_chunks_index_check
        CHECK (chunk_index >= 0),

    CONSTRAINT document_chunks_page_check
        CHECK (
            page_number IS NULL
            OR page_number >= 1
        ),

    CONSTRAINT document_chunks_token_check
        CHECK (
            token_count IS NULL
            OR token_count >= 0
        ),

    CONSTRAINT document_chunk_index_unique
        UNIQUE (
            document_id,
            chunk_index
        )
);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by
    ON documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_documents_created_at
    ON documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_visibility
    ON documents(visibility);

CREATE INDEX IF NOT EXISTS idx_documents_processing_status
    ON documents(processing_status);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
    ON document_chunks(
        document_id,
        chunk_index
    );

CREATE INDEX IF NOT EXISTS idx_document_chunks_text_search
    ON document_chunks
    USING GIN (
        to_tsvector(
            'simple',
            text_content
        )
    );

DROP TRIGGER IF EXISTS documents_set_updated_at
    ON documents;

CREATE TRIGGER documents_set_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();