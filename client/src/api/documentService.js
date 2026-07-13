const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const documentService = {
  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_BASE}/documents/upload`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    return parseResponse(response);
  },

  async listMaterials() {
    const response = await fetch(`${API_BASE}/documents`, {
      credentials: "include",
    });

    return parseResponse(response);
  },

  async deleteMaterial(documentId) {
    const response = await fetch(
      `${API_BASE}/documents/${encodeURIComponent(documentId)}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    return parseResponse(response);
  },
};