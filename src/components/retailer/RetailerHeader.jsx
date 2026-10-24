
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  ChevronRight,
  Wallet,
  UserRound,
  LogOut,
  CheckCheck,
  Info,
  CircleCheck,
  TriangleAlert,
  ArrowLeftRight,
  Clock3,
  RefreshCcw,
  X,
  ShieldCheck,
} from "lucide-react";

const pageNames = {
  overview: "Overview",
  "complete-kyc": "Complete KYC",
  "aadhaar-verification": "Aadhaar Verification",
  "pan-verification": "PAN Verification",
  "bank-penny-drop": "Bank Penny Drop",
  "consent-esign": "Consent e-Sign",
  wallet: "Wallet",
  "verification-history": "Verification History",
  profile: "Profile",
};

const initialNotifications = [
  {
    id: 1,
    type: "success",
    title: "Verification successful",
    description: "Your recent Aadhaar verification was completed.",
    time: "2 hr ago",
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "Wallet top-up request",
    description: "Your ₹5,000 top-up request is pending approval.",
    time: "3 hr ago",
    read: false,
  },
  {
    id: 3,
    type: "warning",
    title: "Aadhaar OTP latency",
    description: "OTP delivery may take longer than usual (demo).",
    time: "5 hr ago",
    read: true,
  },
];

const notificationKey = "verifyhub-retailer-notifications-v1";

function readNotifications() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(notificationKey) || "null"
    );

    return Array.isArray(saved)
      ? saved
      : initialNotifications;
  } catch {
    return initialNotifications;
  }
}

export default function RetailerHeader({
  setMobileOpen = () => {},
  darkMode = false,
  setDarkMode = () => {},
  onLogout,
  onSwitchAdmin,
  onResetDemo,
  onSessionExpiry,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  const currentPage = location.pathname
    .split("/")
    .filter(Boolean)
    .pop();

  const pageTitle = pageNames[currentPage] || "Overview";

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [notifications, setNotifications] =
    useState(readNotifications);

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  useEffect(() => {
    localStorage.setItem(
      notificationKey,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationOpen(false);
        setProfileOpen(false);
        setModal(null);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item
      )
    );
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  const handleProfile = () => {
    closeProfile();
    navigate("/retailer/profile");
  };

  const handleSwitchAdmin = () => {
    closeProfile();

    if (typeof onSwitchAdmin === "function") {
      onSwitchAdmin();
    } else {
      navigate("/super-admin/overview");
    }
  };

  const handleModalAction = () => {
    if (modal === "logout") {
      setModal(null);

      if (typeof onLogout === "function") {
        onLogout();
      } else {
        navigate("/", { replace: true });
      }
    }

    if (modal === "session") {
      setModal(null);

      if (typeof onSessionExpiry === "function") {
        onSessionExpiry();
      } else {
        navigate("/", { replace: true });
      }
    }

    if (modal === "reset") {
      localStorage.removeItem(notificationKey);
      setNotifications(initialNotifications);

      if (typeof onResetDemo === "function") {
        onResetDemo();
      }

      window.dispatchEvent(
        new CustomEvent("verifyhub-retailer-demo-reset")
      );

      setModal(null);
    }
  };

  const menuClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] text-app-text hover:bg-app-surface-muted";

  const modalContent = {
    logout: {
      title: "Sign out of VerifyHub?",
      description:
        "Your demo data stays saved in this browser. You can sign back in anytime.",
      button: "Sign out",
      icon: LogOut,
    },
    session: {
      title: "Simulate session expiry?",
      description:
        "This demo will redirect you to the login page. No real authentication session is changed.",
      button: "Expire session",
      icon: Clock3,
    },
    reset: {
      title: "Reset demo data?",
      description:
        "This will reset the retailer header notifications. Other demo records are reset only if connected through the layout.",
      button: "Reset data",
      icon: RefreshCcw,
    },
  };

  const activeModal = modal ? modalContent[modal] : null;
  const ModalIcon = activeModal?.icon;

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-[74px] items-center justify-between gap-3 border-b border-app-border bg-app-surface px-4 sm:px-6 lg:px-7">
        {/* Left side */}
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
              <span>Retailer</span>
              <ChevronRight size={14} />
              <span className="truncate">{pageTitle}</span>
            </div>

            <h1 className="mt-0.5 truncate text-[18px] font-bold text-app-text">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div
          ref={menuRef}
          className="flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-4"
        >
          {/* Wallet */}
          <button
            type="button"
            onClick={() => navigate("/retailer/wallet")}
            className="flex h-[42px] items-center gap-2 rounded-xl border border-app-border bg-app-surface-muted px-2.5 text-app-text hover:border-primary/40 sm:px-3"
          >
            <Wallet size={18} className="text-primary" />
            <span className="text-[12px] font-bold sm:text-[14px]">
              ₹2,920
            </span>
          </button>

          {/* Theme */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-app-text hover:bg-app-surface-muted"
          >
            {darkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>

          {/* Notifications */}
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
                <span className="absolute right-[8px] top-[6px] h-2 w-2 rounded-full border border-app-surface bg-red-500" />
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-[-60px] top-[50px] z-50 w-[min(450px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:right-0">
                <div className="flex items-center justify-between gap-3 border-b border-app-border px-5 py-5">
                  <h3 className="text-[17px] font-bold text-app-text">
                    Notifications
                  </h3>

                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-app-text-secondary hover:text-primary"
                  >
                    <CheckCheck size={16} />
                    Mark all read
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto overscroll-contain">
                  {notifications.map((item) => {
                    const Icon =
                      item.type === "warning"
                        ? TriangleAlert
                        : item.type === "success"
                        ? CircleCheck
                        : Info;

                    const iconStyle =
                      item.type === "warning"
                        ? "bg-amber-100 text-amber-600"
                        : item.type === "success"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-blue-50 text-blue-600";

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => markRead(item.id)}
                        className={`flex w-full items-start gap-4 border-b border-app-border px-5 py-5 text-left transition last:border-0 hover:bg-app-surface-muted ${
                          item.read
                            ? "bg-app-surface"
                            : "bg-primary/5"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-app-text">
                            {item.title}
                          </p>

                          <p className="mt-1 text-[12px] leading-5 text-app-text-secondary">
                            {item.description}
                          </p>

                          <p className="mt-2 text-[11px] text-app-text-secondary">
                            {item.time}
                          </p>
                        </div>

                        {!item.read && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10945d] text-[12px] font-bold text-white">
                RP
              </div>

              <div className="hidden min-w-0 lg:block">
                <p className="text-[12px] font-semibold text-app-text">
                  Rakesh Patel
                </p>

                <p className="max-w-[175px] truncate text-[11px] text-app-text-secondary">
                  Shree Ganesh Mobile Point
                </p>
              </div>

              <ChevronDown
                size={17}
                className="hidden text-app-text-secondary sm:block"
              />
            </button>

            {/* Same dropdown as Super Admin */}
            {profileOpen && (
              <div className="absolute right-0 top-[52px] z-50 w-[min(295px,calc(100vw-24px))] overflow-hidden rounded-xl border border-app-border bg-app-surface p-2 shadow-xl">
                <div className="border-b border-app-border px-3 py-3">
                  <p className="text-[14px] font-bold text-app-text">
                    Rakesh Patel
                  </p>

                  <p className="mt-1 text-[12px] text-app-text-secondary">
                    Shree Ganesh Mobile Point
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleProfile}
                  className={`${menuClass} mt-2`}
                >
                  <UserRound size={17} />
                  My profile
                </button>

                <button
                  type="button"
                  onClick={handleSwitchAdmin}
                  className={menuClass}
                >
                  <ArrowLeftRight size={17} />

                  <span className="flex-1">
                    Switch to Super Admin view
                  </span>

                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                    DEMO
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeProfile();
                    setModal("session");
                  }}
                  className={menuClass}
                >
                  <Clock3 size={17} />
                  Simulate session expiry
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeProfile();
                    setModal("reset");
                  }}
                  className={menuClass}
                >
                  <RefreshCcw size={17} />
                  Reset demo data
                </button>

                <div className="my-2 border-t border-app-border" />

                <button
                  type="button"
                  onClick={() => {
                    closeProfile();
                    setModal("logout");
                  }}
                  className={`${menuClass} text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10`}
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Confirmation modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101827]/55 px-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModal(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="retailer-modal-title"
            className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white text-[#111a32] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-[#2954eb]">
                  {ModalIcon && <ModalIcon size={21} />}
                </div>

                <h2
                  id="retailer-modal-title"
                  className="text-[18px] font-bold"
                >
                  {activeModal.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Close"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <p className="px-6 py-6 text-[14px] leading-6 text-slate-600">
              {activeModal.description}
            </p>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-[13px] font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleModalAction}
                className="rounded-lg bg-[#2954eb] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2043d5]"
              >
                {activeModal.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
