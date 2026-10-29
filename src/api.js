import axios from "axios";
import { clearSession, getToken } from "./auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Requests that change the signed-in account's balance or profile; the header
// listens for this event to refresh the wallet badge and name.
export const ACCOUNT_UPDATED_EVENT = "verifyhub-account-updated";
const ACCOUNT_CHANGING_URLS = [/\/verifications\/verify$/, /\/retailer\/profile$/, /\/admin\/profile$/];

// A 401 on a request that carried a token means the session expired or was
// revoked: drop it and send the user back to the login page.
api.interceptors.response.use(
  (response) => {
    const { method, url } = response.config;
    if (method !== "get" && ACCOUNT_CHANGING_URLS.some((pattern) => pattern.test(url || ""))) {
      window.dispatchEvent(new Event(ACCOUNT_UPDATED_EVENT));
    }
    return response;
  },
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization);

    if (error.response?.status === 401 && sentToken) {
      clearSession();

      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "The server took too long to respond. Please try again."
      : "Unable to reach the server. Please check your connection and try again.";
  }

  const { status, data } = error.response;

  if (status === 422 && data?.errors) {
    const firstError = Object.values(data.errors).flat()[0];
    if (firstError) return firstError;
  }

  // Laravel's 404 message names internal model classes.
  if (status === 404) {
    return "The requested record was not found. It may have been removed.";
  }

  // 5xx messages can carry raw SQL/stack details, so never show them.
  if (status >= 500) {
    return "The server ran into a problem. Please try again in a moment.";
  }

  return data?.message || fallback;
};

export const logout = async () => {
  try {
    if (getToken()) {
      await api.post("/auth/logout");
    }
  } catch {
    // The token may already be invalid; the local session is cleared anyway.
  } finally {
    clearSession();
  }
};

export default api;
