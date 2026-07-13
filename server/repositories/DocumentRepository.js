import pool from "../config/database.js";

class DocumentRepository {
  mapDocument(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      documentId: row.id,

      title: row.title,
      originalFilename:
        row.original_filename,

      filename:
        row.stored_filename,

      storedFilename:
        row.stored_filename,

      path: row.storage_path,
      storagePath:
        row.storage_path,

      mimeType: row.mime_type,

      uploadedBy:
        row.uploaded_by,

      uploadedByRole:
        row.uploaded_by_role,

      visibility:
        row.visibility,

      courseId:
        row.course_id,

      fileSizeBytes:
        row.file_size_bytes === null
          ? null
          : Number(
              row.file_size_bytes
            ),

      pageCount:
        row.page_count,

      processingStatus:
        row.processing_status,

      processingError:
        row.processing_error,

      chunksCount:
        row.chunks_count === undefined
          ? undefined
          : Number(
              row.chunks_count
            ),

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  mapChunk(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,

      documentId:
        row.document_id,

      chunkIndex:
        row.chunk_index,

      text:
        row.text_content,

      textContent:
        row.text_content,

      pageNumber:
        row.page_number,

      tokenCount:
        row.token_count,

      metadata:
        row.metadata || {},

      createdAt:
        row.created_at,
    };
  }

  async createDocument(
    document,
    client = pool
  ) {
    const result =
      await client.query(
        `
          INSERT INTO documents (
            title,
            original_filename,
            stored_filename,
            storage_path,
            mime_type,
            uploaded_by,
            uploaded_by_role,
            visibility,
            course_id,
            file_size_bytes,
            page_count,
            processing_status,
            processing_error
          )
          VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11,
            $12, $13
          )
          RETURNING *
        `,
        [
          document.title,
          document.originalFilename,
          document.storedFilename ||
            document.filename ||
            null,

          document.storagePath ||
            document.path,

          document.mimeType,

          document.uploadedBy,
          document.uploadedByRole,

          document.visibility ||
            "private",

          document.courseId ||
            null,

          document.fileSizeBytes ??
            null,

          document.pageCount ??
            null,

          document.processingStatus ||
            "ready",

          document.processingError ||
            null,
        ]
      );

    return this.mapDocument(
      result.rows[0]
    );
  }

  async createChunks(
    documentId,
    chunks,
    client = pool
  ) {
    const createdChunks = [];

    for (const chunk of chunks) {
      const result =
        await client.query(
          `
            INSERT INTO document_chunks (
              document_id,
              chunk_index,
              text_content,
              page_number,
              token_count,
              metadata
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6::JSONB
            )
            RETURNING *
          `,
          [
            documentId,
            chunk.chunkIndex,
            chunk.text ||
              chunk.textContent,

            chunk.pageNumber ??
              null,

            chunk.tokenCount ??
              null,

            JSON.stringify(
              chunk.metadata || {}
            ),
          ]
        );

      createdChunks.push(
        this.mapChunk(
          result.rows[0]
        )
      );
    }

    return createdChunks;
  }

  async createWithChunks(
    document,
    chunks
  ) {
    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const createdDocument =
        await this.createDocument(
          document,
          client
        );

      const createdChunks =
        await this.createChunks(
          createdDocument.id,
          chunks,
          client
        );

      await client.query(
        "COMMIT"
      );

      return {
        document:
          createdDocument,

        chunks:
          createdChunks,

        chunksCreated:
          createdChunks.length,
      };
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      throw error;
    } finally {
      client.release();
    }
  }

  async findById(
    documentId
  ) {
    const result =
      await pool.query(
        `
          SELECT
            d.*,
            COUNT(c.id)::INTEGER
              AS chunks_count
          FROM documents d
          LEFT JOIN document_chunks c
            ON c.document_id = d.id
          WHERE d.id = $1
          GROUP BY d.id
          LIMIT 1
        `,
        [documentId]
      );

    return this.mapDocument(
      result.rows[0]
    );
  }

  async findByTitle(
    title,
    user = null
  ) {
    const values = [
      `%${String(title)
        .trim()
        .toLowerCase()}%`,
    ];

    let accessClause = "";

    if (
      user &&
      user.role !== "Admin"
    ) {
      values.push(user.id);

      accessClause = `
        AND (
          d.uploaded_by = $2
          OR d.visibility = 'public'
          OR (
            d.visibility = 'students'
            AND $3 = 'Student'
          )
          OR (
            d.visibility = 'teachers'
            AND $3 IN (
              'Teacher',
              'Admin'
            )
          )
        )
      `;

      values.push(user.role);
    }

    const result =
      await pool.query(
        `
          SELECT
            d.*,
            COUNT(c.id)::INTEGER
              AS chunks_count
          FROM documents d
          LEFT JOIN document_chunks c
            ON c.document_id = d.id
          WHERE LOWER(d.title)
            LIKE $1
          ${accessClause}
          GROUP BY d.id
          ORDER BY
            CASE
              WHEN LOWER(d.title) =
                REPLACE(
                  $1,
                  '%',
                  ''
                )
              THEN 0
              ELSE 1
            END,
            d.created_at DESC
        `,
        values
      );

    return result.rows.map(
      (row) =>
        this.mapDocument(row)
    );
  }

  async findAccessibleForUser(
    user
  ) {
    const result =
      await pool.query(
        `
          SELECT
            d.*,
            COUNT(c.id)::INTEGER
              AS chunks_count
          FROM documents d
          LEFT JOIN document_chunks c
            ON c.document_id = d.id
          WHERE
            $2 = 'Admin'
            OR d.uploaded_by = $1
            OR d.visibility = 'public'
            OR (
              d.visibility = 'students'
              AND $2 = 'Student'
            )
            OR (
              d.visibility = 'teachers'
              AND $2 IN (
                'Teacher',
                'Admin'
              )
            )
          GROUP BY d.id
          ORDER BY d.created_at DESC
        `,
        [
          user.id,
          user.role,
        ]
      );

    return result.rows.map(
      (row) =>
        this.mapDocument(row)
    );
  }

  async findOwnedByUser(
    userId
  ) {
    const result =
      await pool.query(
        `
          SELECT
            d.*,
            COUNT(c.id)::INTEGER
              AS chunks_count
          FROM documents d
          LEFT JOIN document_chunks c
            ON c.document_id = d.id
          WHERE d.uploaded_by = $1
          GROUP BY d.id
          ORDER BY d.created_at DESC
        `,
        [userId]
      );

    return result.rows.map(
      (row) =>
        this.mapDocument(row)
    );
  }

  async getChunks(
    documentId,
    options = {}
  ) {
    const limit =
      Number(options.limit || 100);

    const result =
      await pool.query(
        `
          SELECT
            id,
            document_id,
            chunk_index,
            text_content,
            page_number,
            token_count,
            metadata,
            created_at
          FROM document_chunks
          WHERE document_id = $1
          ORDER BY chunk_index ASC
          LIMIT $2
        `,
        [
          documentId,
          limit,
        ]
      );

    return result.rows.map(
      (row) =>
        this.mapChunk(row)
    );
  }

  async searchChunks({
    query,
    user,
    documentId = null,
    limit = 8,
  }) {
    const cleanQuery =
      String(query || "").trim();

    const values = [
      user.id,
      user.role,
      cleanQuery,
    ];

    let documentClause = "";

    if (documentId) {
      values.push(documentId);

      documentClause = `
        AND d.id = $4
      `;
    }

    values.push(limit);

    const limitParameter =
      `$${values.length}`;

    const result =
      await pool.query(
        `
          SELECT
            c.id,
            c.document_id,
            c.chunk_index,
            c.text_content,
            c.page_number,
            c.token_count,
            c.metadata,
            c.created_at,

            d.title
              AS document_title,

            ts_rank(
              to_tsvector(
                'simple',
                c.text_content
              ),
              plainto_tsquery(
                'simple',
                $3
              )
            ) AS rank

          FROM document_chunks c
          JOIN documents d
            ON d.id = c.document_id

          WHERE
            (
              $2 = 'Admin'
              OR d.uploaded_by = $1
              OR d.visibility =
                'public'
              OR (
                d.visibility =
                  'students'
                AND $2 =
                  'Student'
              )
              OR (
                d.visibility =
                  'teachers'
                AND $2 IN (
                  'Teacher',
                  'Admin'
                )
              )
            )

            ${documentClause}

            AND (
              $3 = ''
              OR to_tsvector(
                'simple',
                c.text_content
              ) @@ plainto_tsquery(
                'simple',
                $3
              )
              OR c.text_content
                ILIKE '%' || $3 || '%'
            )

          ORDER BY
            rank DESC,
            c.chunk_index ASC

          LIMIT ${limitParameter}
        `,
        values
      );

    return result.rows.map(
      (row) => ({
        ...this.mapChunk(row),

        documentTitle:
          row.document_title,

        score:
          Number(row.rank || 0),
      })
    );
  }

  async updateStatus(
    documentId,
    {
      processingStatus,
      processingError = null,
      pageCount,
    }
  ) {
    const result =
      await pool.query(
        `
          UPDATE documents
          SET
            processing_status =
              COALESCE(
                $1,
                processing_status
              ),

            processing_error =
              $2,

            page_count =
              COALESCE(
                $3,
                page_count
              )

          WHERE id = $4
          RETURNING *
        `,
        [
          processingStatus ||
            null,

          processingError,

          pageCount ??
            null,

          documentId,
        ]
      );

    return this.mapDocument(
      result.rows[0]
    );
  }

  async delete(
    documentId
  ) {
    const result =
      await pool.query(
        `
          DELETE FROM documents
          WHERE id = $1
          RETURNING
            id,
            title,
            storage_path
        `,
        [documentId]
      );

    const row =
      result.rows[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      documentId: row.id,
      title: row.title,
      path: row.storage_path,
    };
  }

  async getDebugInfo() {
    const documentResult =
      await pool.query(`
        SELECT
          COUNT(*)::INTEGER
            AS documents_count
        FROM documents
      `);

    const chunkResult =
      await pool.query(`
        SELECT
          COUNT(*)::INTEGER
            AS chunks_count
        FROM document_chunks
      `);

    const samples =
      await pool.query(`
        SELECT
          c.id,
          c.document_id,
          c.chunk_index,
          LEFT(
            c.text_content,
            300
          ) AS text_content,
          d.title AS document_title
        FROM document_chunks c
        JOIN documents d
          ON d.id = c.document_id
        ORDER BY c.created_at DESC
        LIMIT 3
      `);

    return {
      documentsCount:
        documentResult
          .rows[0]
          .documents_count,

      chunksCount:
        chunkResult
          .rows[0]
          .chunks_count,

      sampleChunks:
        samples.rows,
    };
  }
}

export default new DocumentRepository();