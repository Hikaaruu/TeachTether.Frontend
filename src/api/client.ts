import axios from "axios";
import { getToken } from "../auth/tokenStorage";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

function instantRedirect(path: string) {
  document.documentElement.style.opacity = "0";
  window.location.replace(path);
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const method = err.config?.method?.toUpperCase();

    console.error("API error:", err.response?.data || err.message);

    const currentPath = window.location.pathname;

    if (status === 401 && currentPath !== "/login") {
      return instantRedirect("/login");
    }
    if (status === 403) return instantRedirect("/403");

    if (method === "GET" && (status === 400 || status === 404)) {
      return instantRedirect("/404");
    }

    return Promise.reject(err);
  }
);
