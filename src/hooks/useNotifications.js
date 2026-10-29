import { useCallback, useEffect, useState } from "react";
import api from "../api";

// GET /notifications returns the signed-in admin's or retailer's notifications;
// PUT /notifications/{id}/read and POST /notifications/mark-all-read update them.
const REFRESH_MS = 60000;

// The backend auto-creates this admin entry on every fetch; it is not tied to a real report.
const PLACEHOLDER_IDS = ["NTF_REPORT_GEN"];

// Backend links use "/admin/..." while the admin pages live under "/super-admin/...".
const toAppLink = (link) => (link?.startsWith("/admin/") ? link.replace("/admin/", "/super-admin/") : link || null);

function timeAgo(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutes)) return "";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const toItem = (n) => ({ id: n.id, type: n.type, title: n.title, description: n.text, time: timeAgo(n.created_at), read: Boolean(n.read), link: toAppLink(n.link) });

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const reload = useCallback(() => api.get("/notifications")
    .then(({ data }) => setNotifications((data?.data?.notifications ?? []).filter((n) => !PLACEHOLDER_IDS.includes(n.id)).map(toItem)))
    .catch(() => {}), []);

  useEffect(() => {
    reload();
    const id = setInterval(reload, REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  // Update the UI immediately; resync from the server if the request fails.
  const markRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    api.put(`/notifications/${encodeURIComponent(id)}/read`).catch(reload);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.post("/notifications/mark-all-read").catch(reload);
  };

  return { notifications, unreadCount: notifications.filter((n) => !n.read).length, markRead, markAllRead, reload };
}
