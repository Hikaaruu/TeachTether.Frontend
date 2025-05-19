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

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API error:", err.response?.data || err.message);
    return Promise.reject(err); // always rethrow so local component can catch
  }
);
