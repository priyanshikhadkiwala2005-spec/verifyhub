
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { ACCOUNT_UPDATED_EVENT } from "../../api";
import { getUser, updateStoredUser } from "../../auth";
import useNotifications from "../../hooks/useNotifications";
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
  Clock3,
  X,
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

export default function RetailerHeader({
  setMobileOpen = () => {},
  darkMode = false,
  setDarkMode = () => {},
  onLogout,
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
  const { notifications, unreadCount, markRead, markAllRead, reload: reloadNotifications } = useNotifications();

  // Name, shop and wallet balance come from GET /auth/me (the stored login user
  // is shown first so the header never flashes placeholder text).
  const [account, setAccount] = useState(getUser);
  const loadAccount = useCallback(() => {
    api.get("/auth/me")
      .then(({ data }) => {
        const me = data?.data;
        if (!me) return;
        setAccount((old) => ({ ...old, ...me }));
        updateStoredUser({ name: me.name, shop: me.shop, email: me.email, mobile: me.mobile, wallet: me.wallet });
      })
      .catch(() => {});
  }, []);

  // Refresh on every page change and whenever a request changes the balance or profile.
  useEffect(() => { loadAccount(); }, [loadAccount, location.pathname]);
  useEffect(() => {
    window.addEventListener(ACCOUNT_UPDATED_EVENT, loadAccount);
    return () => window.removeEventListener(ACCOUNT_UPDATED_EVENT, loadAccount);
  }, [loadAccount]);

  const accountName = account?.name || "Retailer";
  const accountShop = account?.shop || "";
  const accountInitials = accountName.split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
  const walletBalance = account?.wallet;

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

  const openNotification = (item) => {
    if (!item.read) markRead(item.id);
    if (item.link) {
      setNotificationOpen(false);
      navigate(item.link);
    }
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  const handleProfile = () => {
    closeProfile();
    navigate("/retailer/profile");
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

  };

  const menuClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] text-app-text hover:bg-app-surface-muted";

  const modalContent = {
    logout: {
      title: "Sign out of VerifyHub?",
      description:
        "You will be signed out of this browser. You can sign back in anytime.",
      button: "Sign out",
      icon: LogOut,
    },
    session: {
      title: "Simulate session expiry?",
      description:
        "This ends your current session and returns you to the login page, as happens when a session expires.",
      button: "Expire session",
      icon: Clock3,
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
              {walletBalance === undefined || walletBalance === null ? "—" : `₹${Number(walletBalance).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
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
                if (!notificationOpen) reloadNotifications();
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
                  {notifications.length === 0 && (
                    <p className="px-5 py-10 text-center text-[13px] text-app-text-secondary">
                      No notifications yet.
                    </p>
                  )}
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
                        onClick={() => openNotification(item)}
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
                {accountInitials}
              </div>

              <div className="hidden min-w-0 lg:block">
                <p className="text-[12px] font-semibold text-app-text">
                  {accountName}
                </p>

                <p className="max-w-[175px] truncate text-[11px] text-app-text-secondary">
                  {accountShop}
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
                    {accountName}
                  </p>

                  <p className="mt-1 text-[12px] text-app-text-secondary">
                    {accountShop}{account?.id ? ` · ${account.id}` : ""}
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
                  onClick={() => {
                    closeProfile();
                    setModal("session");
                  }}
                  className={menuClass}
                >
                  <Clock3 size={17} />
                  Simulate session expiry
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
