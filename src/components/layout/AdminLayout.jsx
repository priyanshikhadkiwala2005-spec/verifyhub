
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  LogOut,
  X,
  Clock3,
  RefreshCcw,
  ArrowLeftRight,
} from "lucide-react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { logout } from "../../api";

const modalContent = {
  logout: {
    title: "Sign out of VerifyHub?",
    description:
      "Your demo data stays saved in this browser. You can sign back in anytime.",
    button: "Sign out",
    Icon: LogOut,
  },
  expiry: {
    title: "Simulate session expiry?",
    description:
      "This will simulate an expired demo session and return you to the login page. Your demo data will remain saved.",
    button: "Expire session",
    Icon: Clock3,
  },
  reset: {
    title: "Reset demo data?",
    description:
      "This will restore VerifyHub demo settings to their original values. Your locally saved Settings preferences and audit history will be cleared. This action cannot be undone.",
    button: "Reset demo data",
    Icon: RefreshCcw,
  },
  retailer: {
    title: "Switch to Retailer view?",
    description:
      "The Retailer dashboard is not connected yet. You can return to the login page and select the Retailer demo account.",
    button: "Go to login",
    Icon: ArrowLeftRight,
  },
};

export default function AdminLayout() {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("verifyhub-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(
      "verifyhub-theme",
      darkMode ? "dark" : "light"
    );

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [darkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleResize = () => {
      if (mediaQuery.matches) setMobileOpen(false);
    };

    handleResize();
    mediaQuery.addEventListener("change", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!activeModal) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") setActiveModal(null);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeModal]);

  const resetDemoData = () => {
    const settingsKeys = [
      "company",
      "profile",
      "notifications",
      "providers",
      "system",
      "audit",
    ];

    settingsKeys.forEach((key) => {
      localStorage.removeItem(`verifyhub-settings-${key}`);
    });

    // Tell mounted Settings page to reload its defaults.
    window.dispatchEvent(new Event("verifyhub-demo-reset"));
  };

  const confirmAction = async () => {
    const action = activeModal;
    setActiveModal(null);
    setMobileOpen(false);

    if (action === "reset") {
      resetDemoData();
      navigate("/super-admin/settings?tab=demo");
      return;
    }

    if (
      action === "logout" ||
      action === "expiry" ||
      action === "retailer"
    ) {
      // Revoke the API token; otherwise the login page sends the user straight back here.
      await logout();
      navigate("/", { replace: true });
    }
  };

  const modal = activeModal ? modalContent[activeModal] : null;
  const ModalIcon = modal?.Icon;

  return (
    <div className="min-h-screen bg-app-background font-poppins text-app-text">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div
        className={`min-h-screen transition-[margin] duration-300 ${
          collapsed ? "lg:ml-[82px]" : "lg:ml-[250px]"
        }`}
      >
        <Header
          setMobileOpen={setMobileOpen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={() => setActiveModal("logout")}
          onSessionExpiry={() => setActiveModal("expiry")}
          onResetDemo={() => setActiveModal("reset")}
          onSwitchRetailer={() => setActiveModal("retailer")}
        />

        <main className="min-h-[calc(100vh-140px)] bg-app-background">
          <Outlet />
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border bg-app-background px-5 py-5 text-[11px] text-app-text-secondary lg:px-7">
          <p>
            © 2026 VerifyHub · Demo prototype designed & developed by{" "}
            <span className="font-semibold">Exotic Infotech</span>
          </p>
          <p>All data is synthetic · INR amounts are illustrative</p>
        </footer>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101827]/55 px-4 py-6 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveModal(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            className="w-full max-w-[550px] overflow-hidden rounded-[20px] border border-[#e1e7f0] bg-white text-[#111a32] shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
          >
            <div className="flex items-start gap-4 border-b border-[#e2e8f0] px-5 py-6 sm:px-7">
              <div className="flex h-[51px] w-[105px] shrink-0 items-center justify-center rounded-[14px] bg-[#edf1ff] text-[#2954eb] sm:w-[210px]">
                <ModalIcon size={23} strokeWidth={1.9} />
              </div>

              <h2
                id="admin-confirm-title"
                className="flex-1 pt-1 text-[19px] font-bold leading-[1.5] sm:text-[21px]"
              >
                {modal.title}
              </h2>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close popup"
                className="mt-1 shrink-0 rounded-lg p-1 text-[#52617d] hover:bg-[#f1f4f9]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-7 sm:px-7">
              <p className="text-[15px] leading-[1.7] text-[#52617e] sm:text-[17px]">
                {modal.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#e2e8f0] bg-[#f8faff] px-5 py-[18px] sm:px-7">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-[10px] border border-[#d2dced] bg-white px-5 py-[12px] text-[15px] font-semibold text-[#111a32] shadow-sm hover:bg-[#f1f4fa]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmAction}
                className="rounded-[10px] bg-[#2b50e9] px-6 py-[12px] text-[15px] font-semibold text-white shadow-sm hover:bg-[#2043d5]"
              >
                {modal.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
