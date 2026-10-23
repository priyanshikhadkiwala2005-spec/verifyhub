
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  LogOut,
  UserRound,
  Settings,
  X,
  CheckCheck,
} from "lucide-react";

const pageNames = {
  overview: "Overview",
  retailers: "Retailers",
  "kyc-services": "KYC Services",
  pricing: "Pricing",
  wallet: "Wallet",
  "verification-records": "Verification Records",
  reports: "Reports & Analytics",
  settings: "Settings",
};

const initialNotifications = [
  {
    id: 1,
    title: "Fund request · ₹5,000",
    description: "Shree Ganesh Mobile Point",
    read: false,
  },
  {
    id: 2,
    title: "Fund request · ₹2,000",
    description: "Balaji Online Seva",
    read: false,
  },
  {
    id: 3,
    title: "Monthly report generated",
    description: "September 2026 report is ready",
    read: true,
  },
];

export default function Header({
  setMobileOpen = () => {},
  darkMode = false,
  setDarkMode = () => {},
  onLogout = () => {},
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = location.pathname.split("/").filter(Boolean).pop();
  const pageTitle = pageNames[currentPage] || "Overview";

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const searchRef = useRef(null);
  const menuRef = useRef(null);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const searchResults = Object.entries(pageNames).filter(([, name]) =>
    name.toLowerCase().includes(search.toLowerCase().trim())
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setNotificationOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const navigateToPage = (slug) => {
    navigate(`/super-admin/${slug}`);
    setSearch("");
    setSearchOpen(false);
  };

  const markAllRead = () => {
    setNotifications((previous) =>
      previous.map((item) => ({ ...item, read: true }))
    );
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-[74px] items-center justify-between gap-3 border-b border-app-border bg-app-surface px-4 sm:px-6 lg:px-7">
      {/* LEFT SIDE */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
          className="rounded-lg p-2 text-app-text hover:bg-app-surface-muted lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-app-text-secondary">
            <span>Super Admin</span>
            <ChevronRight size={14} />
            <span className="truncate">{pageTitle}</span>
          </div>

          <h1 className="mt-0.5 truncate text-[18px] font-bold text-app-text">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div ref={menuRef} className="flex items-center gap-2 sm:gap-4">
        {/* SEARCH */}
        <div className="relative hidden md:block">
          <div className="flex h-[43px] w-[230px] items-center gap-3 rounded-xl border border-app-border bg-app-surface-muted px-3 xl:w-[315px]">
            <Search size={18} className="shrink-0 text-app-text-secondary" />

            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && searchResults.length > 0) {
                  navigateToPage(searchResults[0][0]);
                }
              }}
              placeholder="Search verifications..."
              aria-label="Search dashboard pages"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-app-text outline-none placeholder:text-app-text-secondary"
            />

            <kbd className="rounded-md border border-app-border bg-app-surface px-2 py-0.5 text-[12px] text-app-text-secondary">
              /
            </kbd>
          </div>

          {searchOpen && search.trim() && (
            <div className="absolute right-0 top-[49px] z-50 w-full overflow-hidden rounded-xl border border-app-border bg-app-surface p-2 shadow-xl">
              {searchResults.length > 0 ? (
                searchResults.map(([slug, name]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => navigateToPage(slug)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[12px] text-app-text hover:bg-app-surface-muted"
                  >
                    {name}
                    <ChevronRight size={15} />
                  </button>
                ))
              ) : (
                <p className="px-3 py-3 text-[12px] text-app-text-secondary">
                  No matching pages found
                </p>
              )}
            </div>
          )}
        </div>

        {/* THEME TOGGLE */}
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-app-text transition hover:bg-app-surface-muted"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* NOTIFICATIONS */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={notificationOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-app-text hover:bg-app-surface-muted"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute right-[8px] top-[6px] h-[7px] w-[7px] rounded-full border border-app-surface bg-danger" />
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-[-65px] top-[50px] z-50 w-[min(350px,calc(100vw-24px))] overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-xl sm:right-0">
              <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
                <h3 className="text-[13px] font-bold text-app-text">
                  Notifications
                </h3>

                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary"
                >
                  <CheckCheck size={15} />
                  Mark all read
                </button>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`border-b border-app-border px-4 py-3 last:border-0 ${
                      item.read ? "" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!item.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}

                      <div>
                        <p className="text-[12px] font-semibold text-app-text">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[11px] text-app-text-secondary">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ADMIN PROFILE */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationOpen(false);
            }}
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-lg p-1 text-left hover:bg-app-surface-muted sm:gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#087b70] text-[12px] font-bold text-white">
              AM
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="text-[12px] font-semibold text-app-text">
                Arvind Mehta
              </p>
              <p className="text-[11px] text-app-text-secondary">
                Super Admin
              </p>
            </div>

            <ChevronDown size={17} className="hidden text-app-text-secondary sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[52px] z-50 w-[225px] overflow-hidden rounded-xl border border-app-border bg-app-surface p-2 shadow-xl">
              <div className="border-b border-app-border px-3 py-3">
                <p className="text-[12px] font-bold text-app-text">
                  Arvind Mehta
                </p>
                <p className="mt-1 text-[11px] text-app-text-secondary">
                  Super Admin
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/super-admin/settings");
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] text-app-text hover:bg-app-surface-muted"
              >
                <Settings size={17} />
                Settings
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] text-danger hover:bg-app-surface-muted"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
