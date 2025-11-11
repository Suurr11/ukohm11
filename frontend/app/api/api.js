import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { Accept: "application/json" },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Hanya set Authorization jika belum ada (jangan override header manual)
      const hasAuthHeader =
        !!config.headers &&
        (config.headers.Authorization || config.headers.authorization);

      if (!hasAuthHeader) {
        const tokenKey =
          config.url && config.url.includes("/admin") ? "token_admin" : "token";
        const token = localStorage.getItem(tokenKey);

        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        } else if (config.headers) {
          // jangan hapus Authorization jika sudah manual; hanya hapus jika tidak ada
          delete config.headers.Authorization;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
