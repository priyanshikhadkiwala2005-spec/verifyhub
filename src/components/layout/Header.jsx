import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search, Moon, Sun, Bell, ChevronDown, ChevronRight, Menu,
  LogOut, UserRound, CheckCheck, Info, TriangleAlert, CircleCheck,
  ArrowLeftRight, Clock3, RefreshCcw,
} from "lucide-react";

const pageNames = {
  overview: "Overview", retailers: "Retailers", "kyc-services": "KYC Services",
  pricing: "Pricing", wallet: "Wallet", "verification-records": "Verification Records",
  reports: "Reports & Analytics", settings: "Settings",
};

const defaultNotifications = [
  { id: 1, type: "info", title: "New fund request", description: "Shree Ganesh Mobile Point requested a ₹5,000 wallet top-up.", time: "3 hr ago", read: false },
  { id: 2, type: "warning", title: "Aadhaar OTP latency", description: "OTP delivery averaged 9s between 11:00–11:20 (demo alert).", time: "5 hr ago", read: false },
  { id: 3, type: "info", title: "New fund request", description: "Balaji Online Seva requested a ₹2,000 wallet top-up.", time: "6 hr ago", read: false },
  { id: 4, type: "success", title: "Monthly report generated", description: "September 2026 verification report is ready to download.", time: "Yesterday", read: true },
  { id: 5, type: "success", title: "Verification services healthy", description: "All configured demo services are responding normally.", time: "Yesterday", read: true },
];
const notificationStorageKey = "verifyhub-header-notifications-v1";
const defaultProfile = { name: "Arvind Mehta", email: "admin@verifyhub.demo" };
function readProfile() {
  try { return { ...defaultProfile, ...JSON.parse(localStorage.getItem("verifyhub-settings-profile") || "{}") }; }
  catch { return defaultProfile; }
}
function readNotifications() {
  try {
    const saved = JSON.parse(localStorage.getItem(notificationStorageKey) || "null");
    return Array.isArray(saved) ? saved : defaultNotifications;
  } catch { return defaultNotifications; }
}

export default function Header({
  setMobileOpen = () => {}, darkMode = false, setDarkMode = () => {},
  onLogout = () => {}, onSessionExpiry = () => {},
  onResetDemo = () => {}, onSwitchRetailer = () => {},
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = location.pathname.split("/").filter(Boolean).pop();
  const pageTitle = pageNames[currentPage] || "Overview";
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(readNotifications);
  const [profile, setProfile] = useState(readProfile);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const unreadCount = notifications.filter((item) => !item.read).length;
  const searchResults = Object.entries(pageNames).filter(([, name]) =>
    name.toLowerCase().includes(search.toLowerCase().trim())
  );

  useEffect(() => {
    localStorage.setItem(notificationStorageKey, JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    const refresh = () => setProfile(readProfile());
    const reset = () => { refresh(); setNotifications(defaultNotifications); };
    window.addEventListener("verifyhub-profile-updated", refresh);
    window.addEventListener("verifyhub-demo-reset", reset);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("verifyhub-profile-updated", refresh);
      window.removeEventListener("verifyhub-demo-reset", reset);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const typing = target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing) { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === "Escape") { setSearchOpen(false); setNotificationOpen(false); setProfileOpen(false); }
    };
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setNotificationOpen(false); setProfileOpen(false); setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);
  const navigateToPage = (slug) => {
    navigate(`/super-admin/${slug}`);
    setSearch(""); setSearchOpen(false);
  };
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const menuAction = (callback) => { setProfileOpen(false); callback(); };
  const initials = profile.name?.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "AM";
  const menuClass = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] text-app-text hover:bg-app-surface-muted";

  return (
    <header className="sticky top-0 z-30 flex min-h-[74px] items-center justify-between gap-3 border-b border-app-border bg-app-surface px-4 sm:px-6 lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open sidebar" className="rounded-lg p-2 text-app-text hover:bg-app-surface-muted lg:hidden"><Menu size={22} /></button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-app-text-secondary"><span>Super Admin</span><ChevronRight size={14} /><span className="truncate">{pageTitle}</span></div>
          <h1 className="mt-0.5 truncate text-[18px] font-bold text-app-text">{pageTitle}</h1>
        </div>
      </div>
      <div ref={menuRef} className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden md:block">
          <div className="flex h-[43px] w-[230px] items-center gap-3 rounded-xl border border-app-border bg-app-surface-muted px-3 xl:w-[315px]">
            <Search size={18} className="shrink-0 text-app-text-secondary" />
            <input ref={searchRef} type="search" value={search} onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={(e) => { if (e.key === "Enter" && searchResults.length) navigateToPage(searchResults[0][0]); }} placeholder="Search verifications..." aria-label="Search dashboard pages" className="min-w-0 flex-1 bg-transparent text-[13px] text-app-text outline-none placeholder:text-app-text-secondary" />
            <kbd className="rounded-md border border-app-border bg-app-surface px-2 py-0.5 text-[12px] text-app-text-secondary">/</kbd>
          </div>
          {searchOpen && search.trim() && (
            <div className="absolute right-0 top-[49px] z-50 w-full overflow-hidden rounded-xl border border-app-border bg-app-surface p-2 shadow-xl">
              {searchResults.length ? searchResults.map(([slug, name]) => <button key={slug} type="button" onClick={() => navigateToPage(slug)} className={menuClass}>{name}<ChevronRight size={15} className="ml-auto" /></button>) : <p className="px-3 py-3 text-[12px] text-app-text-secondary">No matching pages found</p>}
            </div>
          )}
        </div>
        <button type="button" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} className="flex h-10 w-10 items-center justify-center rounded-lg text-app-text hover:bg-app-surface-muted">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
        <div className="relative">
          <button type="button" onClick={() => { setNotificationOpen(!notificationOpen); setProfileOpen(false); }} aria-label="Notifications" aria-expanded={notificationOpen} className="relative flex h-10 w-10 items-center justify-center rounded-lg text-app-text hover:bg-app-surface-muted">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute right-[8px] top-[6px] h-[8px] w-[8px] rounded-full border border-app-surface bg-red-500" />}
          </button>
          {notificationOpen && (
            <div className="absolute right-[-68px] top-[50px] z-50 w-[min(450px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:right-0">
              <div className="flex items-center justify-between gap-3 border-b border-app-border px-5 py-5">
                <h3 className="text-[17px] font-bold text-app-text">Notifications</h3>
                <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-app-text-secondary hover:text-primary"><CheckCheck size={16} />Mark all read</button>
              </div>
              <div className="max-h-[450px] overflow-y-auto overscroll-contain">
                {notifications.map((item) => {
                  const Icon = item.type === "warning" ? TriangleAlert : item.type === "success" ? CircleCheck : Info;
                  const iconClass = item.type === "warning" ? "bg-amber-100 text-amber-600" : item.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-blue-600";
                  return (
                    <button key={item.id} type="button" onClick={() => markRead(item.id)} className={`flex w-full items-start gap-4 border-b border-app-border px-5 py-5 text-left transition last:border-b-0 hover:bg-app-surface-muted ${item.read ? "bg-app-surface" : "bg-primary/5"}`}>
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}><Icon size={20} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold leading-5 text-app-text">{item.title}</p>
                        <p className="mt-1 text-[13px] leading-[1.55] text-app-text-secondary">{item.description}</p>
                        <p className="mt-2 text-[12px] text-app-text-secondary">{item.time}</p>
                      </div>
                      {!item.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2954eb]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button type="button" onClick={() => { setProfileOpen(!profileOpen); setNotificationOpen(false); }} aria-expanded={profileOpen} className="flex items-center gap-2 rounded-lg p-1 text-left hover:bg-app-surface-muted sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#087b70] text-[12px] font-bold text-white">{initials}</div>
            <div className="hidden min-w-0 lg:block"><p className="text-[12px] font-semibold text-app-text">{profile.name}</p><p className="text-[11px] text-app-text-secondary">Super Admin</p></div>
            <ChevronDown size={17} className="hidden text-app-text-secondary sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-[52px] z-50 w-[min(295px,calc(100vw-24px))] overflow-hidden rounded-xl border border-app-border bg-app-surface p-2 shadow-xl">
              <div className="border-b border-app-border px-3 py-3"><p className="text-[14px] font-bold text-app-text">{profile.name}</p><p className="mt-1 text-[12px] text-app-text-secondary">{profile.email}</p></div>
              <button type="button" onClick={() => menuAction(() => navigate("/super-admin/settings?tab=profile"))} className={`${menuClass} mt-2`}><UserRound size={17} />My profile</button>
              <button type="button" onClick={() => menuAction(onSwitchRetailer)} className={menuClass}><ArrowLeftRight size={17} /><span className="flex-1">Switch to Retailer view</span><span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">DEMO</span></button>
              <button type="button" onClick={() => menuAction(onSessionExpiry)} className={menuClass}><Clock3 size={17} />Simulate session expiry</button>
              <button type="button" onClick={() => menuAction(onResetDemo)} className={menuClass}><RefreshCcw size={17} />Reset demo data</button>
              <div className="my-2 border-t border-app-border" />
              <button type="button" onClick={() => menuAction(onLogout)} className={`${menuClass} text-red-500`}><LogOut size={17} />Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
