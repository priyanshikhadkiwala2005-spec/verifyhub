
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminLayout() {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("verifyhub-theme") === "dark";
  });

  // Apply selected theme to the complete dashboard
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

  // Close mobile sidebar when screen becomes desktop size
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleResize = () => {
      if (mediaQuery.matches) {
        setMobileOpen(false);
      }
    };

    handleResize();
    mediaQuery.addEventListener("change", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  const handleLogout = () => {
    // Demo logout.
    // Backend integration later:
    // Clear authenticated session using authService.
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-app-background font-poppins text-app-text">
      {/* Shared sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main content area */}
      <div
        className={`min-h-screen transition-[margin] duration-300 ${
          collapsed ? "lg:ml-[82px]" : "lg:ml-[312px]"
        }`}
      >
        {/* Shared header */}
        <Header
          setMobileOpen={setMobileOpen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={handleLogout}
        />

        {/* Dynamic page content */}
        <main className="min-h-[calc(100vh-140px)] bg-app-background">
          <Outlet />
        </main>

        {/* Shared footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border bg-app-background px-5 py-5 text-[11px] text-app-text-secondary lg:px-7">
          <p>
            © 2026 VerifyHub · Demo prototype designed & developed by{" "}
            <span className="font-semibold">Exotic Infotech</span>
          </p>

          <p>All data is synthetic · INR amounts are illustrative</p>
        </footer>
      </div>
    </div>
  );
}
