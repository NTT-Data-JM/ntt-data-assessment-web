/** Assessment API base URL (ntt-data-assessment-api). */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8091";
