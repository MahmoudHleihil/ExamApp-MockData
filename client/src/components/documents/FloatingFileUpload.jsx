import { useState, useEffect } from "react";
import { documentService } from "../../api/documentService";

export default function FloatingFileUpload({ onGenerateExam }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [showFiles, setShowFiles] = useState(false);
  const [deletingId, setDeletingId] = useState(null);


  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatus("Please choose a PDF file first.");
      return;
    }

    try {
      setIsUploading(true);
      setStatus("Uploading and processing PDF...");

      const result = await documentService.uploadFile(file);

      setStatus(
        `Uploaded: ${result.document.title}. Chunks created: ${result.chunksCreated}`
      );

      await loadMaterials();
      setShowFiles(true);

      setFile(null);
    } catch (error) {
      setStatus(error.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (document) => {
    const confirmed = window.confirm(
      `Delete "${document.title}"?\n\nThis will also delete all extracted document chunks.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(document.documentId);
      setStatus("");

      await documentService.deleteMaterial(
        document.documentId
      );

      setMaterials((current) =>
        current.filter(
          (item) =>
            item.documentId !== document.documentId
        )
      );

      setStatus(`Deleted: ${document.title}`);
    } catch (error) {
      setStatus(error.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await documentService.listMaterials();
      setMaterials(data);
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    if (isOpen) loadMaterials();
  }, [isOpen]);

  return (
    <div
      className="position-fixed bottom-0 start-0 m-4 z-3"
      style={{ maxWidth: "350px" }}
    >
      {isOpen && (
        <div
          className="card shadow-lg border-0 mb-3 rounded-4 overflow-hidden"
          style={{ width: "330px" }}
        >
          <div className="card-header bg-success text-white py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <i className="bi bi-file-earmark-pdf me-2 fs-5"></i>
              <h6 className="mb-0 fw-bold">Upload Course Material</h6>
            </div>

            <button
              className="btn btn-sm btn-link text-white p-0"
              onClick={() => setIsOpen(false)}
              title="Close Upload"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="card-body bg-light p-3">
            <form onSubmit={handleUpload}>
              <input
                type="file"
                accept="application/pdf"
                className="form-control mb-3"
                disabled={isUploading}
                onChange={(e) => setFile(e.target.files[0])}
              />

              <button
                type="submit"
                className="btn btn-success w-100 rounded-pill"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-upload me-2"></i>
                    Upload PDF
                  </>
                )}
              </button>
            </form>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                onClick={() => setShowFiles((current) => !current)}
              >
                <span>
                  <i className="bi bi-folder2-open me-2"></i>
                  Uploaded materials
                </span>

                <span className="badge text-bg-secondary">
                  {materials.length}
                </span>
              </button>
            </div>

            {showFiles && (
              <div
                className="list-group mt-2"
                style={{
                  maxHeight: "70px",
                  overflowY: "auto",
                }}
              >
                {materials.length === 0 ? (
                  <div className="list-group-item text-muted small">
                    No PDFs uploaded yet.
                  </div>
                ) : (
                  materials.map((document) => (
                    <div
                      key={document.documentId}
                      className="list-group-item py-2 px-2"
                    >
                      <div className="d-flex justify-content-between align-items-center gap-2">
                        <div className="overflow-hidden">
                          <div
                            className="fw-semibold text-truncate"
                            title={document.title}
                          >
                            <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                            {document.title}
                          </div>

                          <small className="text-muted">
                            {document.chunksCount} chunks
                          </small>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger flex-shrink-0"
                          onClick={() => handleDelete(document)}
                          disabled={
                            deletingId === document.documentId
                          }
                          title={`Delete ${document.title}`}
                        >
                          {deletingId === document.documentId ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            <i className="bi bi-trash"></i>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onGenerateExam?.(document)}
                          title={`Generate exam from ${document.title}`}
                        >
                          <i className="bi bi-magic"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {status && (
              <div className="alert alert-info mt-3 mb-0 small">
                {status}
              </div>
            )}

            <div className="text-center mt-2">
              <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                <i className="bi bi-shield-check me-1"></i>
                Teacher/Admin only
              </small>
            </div>
          </div>
        </div>
      )}

      <button
        className="btn btn-success rounded-circle shadow-lg p-3 d-flex align-items-center justify-content-center"
        style={{ width: "60px", height: "60px" }}
        onClick={() => setIsOpen(!isOpen)}
        title="Upload Course Material"
      >
        <i className="bi bi-cloud-upload fs-3"></i>
      </button>
    </div>
  );
}