// URL backend diambil dari env VITE_API_URL (set saat build / di file .env frontend).
// Fallback: localhost saat development, server Koyeb saat build production.
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8080"
    : "https://exclusive-dyann-alvacodee-aebd964c.koyeb.app")
).replace(/\/+$/, "");
