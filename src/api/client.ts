import axios from "axios";
import { getToken } from "../auth/tokenStorage";

export const api = axios.create({
  baseURL: "/api", // let Vite proxy redirect to backend
});

api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

function instantRedirect(path: string) {
  // make current UI invisible *now*
  document.documentElement.style.opacity = "0";
  window.location.replace(path);
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const method = err.config?.method?.toUpperCase();

    console.error("API error:", err.response?.data || err.message);

    // auth
    if (status === 401) return instantRedirect("/login");
    if (status === 403) return instantRedirect("/403");

    // wrong / missing resource on GET
    if (method === "GET" && (status === 400 || status === 404)) {
      return instantRedirect("/404");
    }

    return Promise.reject(err);
  }
);
