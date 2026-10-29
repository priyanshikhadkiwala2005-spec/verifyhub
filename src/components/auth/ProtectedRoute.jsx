import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api";
import { clearSession, getRole, getToken, ROLE_HOME } from "../../auth";

export default function ProtectedRoute({ role, children }) {
  const token = getToken();
  const currentRole = getRole();
  const allowed = Boolean(token) && currentRole === role;

  // Confirm the stored token is still valid once per page load.
  // A 401 here is handled by the api interceptor (clears session, back to login).
  useEffect(() => {
    if (!allowed) return;

    api
      .get("/auth/me")
      .then(({ data }) => {
        if (data?.data?.role !== role) {
          clearSession();
          window.location.replace("/");
        }
      })
      .catch(() => {});
  }, [allowed, role]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (currentRole !== role) {
    return <Navigate to={ROLE_HOME[currentRole] ?? "/"} replace />;
  }

  return children;
}
