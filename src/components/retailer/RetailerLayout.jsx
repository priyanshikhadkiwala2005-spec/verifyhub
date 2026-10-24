
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";

import RetailerSidebar from "./RetailerSidebar";
import RetailerHeader from "./RetailerHeader";

export default function RetailerLayout() {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
    if (!showLogoutModal) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowLogoutModal(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showLogoutModal]);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-app-background font-poppins text-app-text">
      <RetailerSidebar
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
        <RetailerHeader
          setMobileOpen={setMobileOpen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={() => setShowLogoutModal(true)}
        />

    

        <main className="min-h-[calc(100vh-180px)] bg-app-background">
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

      {/* Sign out popup */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101827]/55 px-4 py-6 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="retailer-logout-title"
            className="w-full max-w-[500px] overflow-hidden rounded-[18px] border border-[#e1e7f0] bg-white text-[#111a32] shadow-2xl"
          >
            <div className="flex items-start gap-4 border-b border-[#e2e8f0] px-6 py-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf1ff] text-[#2954eb]">
                <LogOut size={23} />
              </div>

              <div className="flex-1">
                <h2
                  id="retailer-logout-title"
                  className="text-[19px] font-bold"
                >
                  Sign out of VerifyHub?
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[#52617e]">
                  Your demo data stays saved in this browser.
                  You can sign back in anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                aria-label="Close popup"
                className="rounded-lg p-1 text-[#52617d] hover:bg-[#f1f4f9]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex justify-end gap-3 bg-[#f8faff] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="rounded-lg border border-[#d2dced] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#111a32]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-lg bg-[#2b50e9] px-5 py-2.5 text-[13px] font-semibold text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
