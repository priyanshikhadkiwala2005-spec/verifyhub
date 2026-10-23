

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {

  ShieldCheck,

  Shield,

  Store,

  UserRound,

  LockKeyhole,

  Eye,

  EyeOff,

  LogIn,

  Moon,

  Sun,

  Wallet,

  ChartNoAxesColumn,

  CheckCircle2,

  AlertCircle,

  TrendingUp,

  LoaderCircle,

  KeyRound,

  X,

  Send,

} from "lucide-react";



const featureCards = [

  {

    icon: ShieldCheck,

    title: "Consent-first checks",

    description: "Every request requires explicit customer consent",

  },

  {

    icon: EyeOff,

    title: "Masked by default",

    description: "Identifiers are masked across tables & exports",

  },

  {

    icon: Wallet,

    title: "Prepaid wallets",

    description: "Per-retailer balances with full credit/debit ledger",

  },

  {

    icon: ChartNoAxesColumn,

    title: "Real-time analytics",

    description: "Revenue, margins and success rates in one view",

  },

];



const demoAccounts = {

  admin: {

    name: "Arvind Mehta",

    email: "admin@verifyhub.demo",

    password: "Admin@123",

  },

  retailer: {

    name: "Shree Ganesh Mobile Point",

    email: "retailer@verifyhub.demo",

    password: "Demo@123",

  },

};



export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("admin");

  const [form, setForm] = useState({

    email: "",

    password: "",

  });



  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);

  const [darkMode, setDarkMode] = useState(false);

  const [errors, setErrors] = useState({});

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);



  // Forgot password states

  const [forgotOpen, setForgotOpen] = useState(false);

  const [resetEmail, setResetEmail] = useState("");

  const [resetError, setResetError] = useState("");

  const [resetLoading, setResetLoading] = useState(false);

  const [toast, setToast] = useState("");



  const handleChange = (event) => {

    const { name, value } = event.target;



    setForm((previous) => ({

      ...previous,

      [name]: value,

    }));



    setErrors((previous) => ({

      ...previous,

      [name]: "",

    }));



    setMessage("");

  };



  const selectRole = (selectedRole) => {

    setRole(selectedRole);

    setErrors({});

    setMessage("");

  };



  const fillDemo = (selectedRole) => {

    const account = demoAccounts[selectedRole];



    setRole(selectedRole);

    setForm({

      email: account.email,

      password: account.password,

    });

    setErrors({});

    setMessage("");

  };



  const validateForm = () => {

    const newErrors = {};

    const identifier = form.email.trim();



    if (!identifier) {

      newErrors.email = "Email or mobile number is required.";

    } else {

      const validEmail =

        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

      const validMobile = /^[6-9]\d{9}$/.test(identifier);



      if (!validEmail && !validMobile) {

        newErrors.email =

          "Enter a valid email or 10-digit mobile number.";

      }

    }



    if (!form.password.trim()) {

      newErrors.password = "Password is required.";

    }



    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };



  const handleLogin = (event) => {

    event.preventDefault();

    setMessage("");



    if (!validateForm()) return;



    setLoading(true);

    // Frontend demo navigation only. Backend authentication is not connected yet.
    if (role === "admin") {
      navigate("/super-admin/overview");
    } else {
      setMessage("Form validated. Backend authentication is not connected yet.");
    }

    setLoading(false);

  };



  // Open forgot password modal

  const openForgotPassword = () => {

    const currentEmail = form.email.includes("@")

      ? form.email

      : "";



    setResetEmail(currentEmail);

    setResetError("");

    setForgotOpen(true);

  };



  // Close forgot password modal

  const closeForgotPassword = () => {

    if (resetLoading) return;



    setForgotOpen(false);

    setResetError("");

  };



  // Demo reset link

  const handleResetPassword = (event) => {

    event.preventDefault();



    const email = resetEmail.trim();



    if (!email) {

      setResetError("Please enter your registered email.");

      return;

    }



    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

      setResetError("Please enter a valid email address.");

      return;

    }



    setResetLoading(true);



    // Frontend demo only.

    // Future backend integration:

    // POST /api/auth/forgot-password

    // Body: { email }

    // Do not reveal whether an email exists in the database.



    setResetLoading(false);

    setForgotOpen(false);

    setResetError("");



    setToast(

      `If ${email} is registered, a link will arrive shortly (demo).`

    );

  };



  return (

    <main

      className={`min-h-screen font-poppins lg:grid lg:grid-cols-[51.5%_48.5%] ${

        darkMode ? "bg-brand-navy-deep" : "bg-app-background"

      }`}

    >

      {/* LEFT BRANDING PANEL */}

      <section className="relative hidden min-h-screen flex-col overflow-hidden bg-brand-navy-deep px-8 py-8 text-white lg:flex xl:px-14">

        <div

          className="pointer-events-none absolute inset-0 opacity-30"

          style={{

            backgroundImage:

              "linear-gradient(rgba(145,170,230,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(145,170,230,.12) 1px,transparent 1px)",

            backgroundSize: "53px 53px",

          }}

        />



        <div className="pointer-events-none absolute -right-32 -top-40 h-[650px] w-[650px] rounded-full bg-primary/25 blur-[130px]" />



        {/* Logo */}

        <div className="relative z-10 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">

            <ShieldCheck size={25} />

          </div>



          <div>

            <h1 className="text-[22px] font-bold leading-tight tracking-tight">

              Verify<span className="text-[#91aaff]">Hub</span>

            </h1>

            <p className="text-[11px] font-medium leading-tight tracking-wide text-[#b4c2e3]">

              KYC PLATFORM

            </p>

          </div>

        </div>



        {/* Left main content */}

        <div className="relative z-10 my-auto w-full max-w-[690px] py-12">

          <div className="relative">

            <div className="pointer-events-none absolute right-0 top-0 hidden w-[220px] rounded-2xl border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur-sm 2xl:block">

              <div className="flex justify-between text-xs text-[#b8c9ee]">

                <span>Verification success · 30d</span>

                <span className="flex items-center gap-1 font-semibold text-[#77e4b4]">

                  <TrendingUp size={14} /> 3.2%

                </span>

              </div>



              <p className="mt-2 text-[27px] font-bold">94.1%</p>



              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">

                <div className="h-full w-[94.1%] rounded-full bg-[#4ed6a0]" />

              </div>



              <div className="mt-3 flex justify-between text-[11px] text-[#b8c9ee]">

                <span>PAN · GST · Bank</span>

                <span>Live sandbox</span>

              </div>

            </div>



            <h2 className="max-w-[570px] text-[clamp(32px,3vw,49px)] font-bold leading-[1.12] tracking-[-0.045em]">

              KYC verification

              <br />

              infrastructure for{" "}

              <span className="text-[#99b2ff]">

                India&apos;s retail network.

              </span>

            </h2>

          </div>



          <p className="mt-6 max-w-[590px] text-[14px] leading-[1.9] text-[#b6c6ed]">

            Onboard retailers, meter every PAN, GSTIN and bank-account

            check against a prepaid wallet, and see the whole network

            from one secure console.

          </p>



          <div className="mt-9 grid grid-cols-2 gap-3.5">

            {featureCards.map((feature) => {

              const Icon = feature.icon;



              return (

                <div

                  key={feature.title}

                  className="flex min-h-[108px] items-start gap-3 rounded-xl border border-white/15 bg-white/[0.055] p-4"

                >

                  <Icon

                    size={21}

                    className="mt-0.5 shrink-0 text-[#a3baff]"

                    strokeWidth={1.7}

                  />



                  <div>

                    <h3 className="text-[13px] font-semibold">

                      {feature.title}

                    </h3>

                    <p className="mt-1 text-[11px] leading-5 text-[#b3c4ec]">

                      {feature.description}

                    </p>

                  </div>

                </div>

              );

            })}

          </div>

        </div>



        <footer className="relative z-10 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#8fa5d6]">

          <span>© 2026 VerifyHub · Demo prototype</span>

          <span>Designed & developed by Exotic Infotech</span>

          <span>All data synthetic</span>

        </footer>

      </section>



      {/* RIGHT LOGIN PANEL */}

      <section

        className={`relative min-h-screen px-5 pb-8 pt-5 sm:px-10 lg:px-10 xl:px-14 ${

          darkMode

            ? "bg-brand-navy-deep text-white"

            : "bg-app-background text-app-text"

        }`}

      >

        {/* Theme toggle */}

        <button

          type="button"

          onClick={() => setDarkMode((previous) => !previous)}

          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}

          className={`absolute right-6 top-5 rounded-lg p-2 transition ${

            darkMode

              ? "text-white hover:bg-white/10"

              : "text-app-text hover:bg-app-surface-muted"

          }`}

        >

          {darkMode ? <Sun size={20} /> : <Moon size={20} />}

        </button>



        {/* Mobile logo */}

        <div className="mb-7 flex items-center gap-2 lg:hidden">

          <ShieldCheck size={25} className="text-primary" />

          <span className="text-lg font-bold">VerifyHub</span>

        </div>



        {/* Login content */}

        <div className="mx-auto w-full max-w-[506px] pt-8 lg:pt-10">

          <h2 className="text-[30px] font-bold leading-tight tracking-[-0.045em] sm:text-[32px]">

            Welcome back

          </h2>



          <p

            className={`mt-2 text-[14px] ${

              darkMode ? "text-[#b8c9ee]" : "text-app-text-secondary"

            }`}

          >

            Sign in to your VerifyHub console.

          </p>



          {/* Role selection */}

          <div className="mt-7">

            <label className="mb-2 block text-[12px] font-medium">

              Sign in as

            </label>



            <div

              className={`grid grid-cols-2 gap-1 rounded-xl p-1 ${

                darkMode ? "bg-white/10" : "bg-app-surface-muted"

              }`}

            >

              <button

                type="button"

                onClick={() => selectRole("admin")}

                aria-pressed={role === "admin"}

                className={`flex h-[44px] items-center justify-center gap-2 rounded-lg text-[12px] font-semibold transition ${

                  role === "admin"

                    ? darkMode

                      ? "bg-brand-navy-card text-white shadow-sm"

                      : "bg-app-surface text-app-text shadow-sm"

                    : darkMode

                    ? "text-[#b8c9ee]"

                    : "text-app-text-secondary"

                }`}

              >

                <Shield size={17} />

                Super Admin

              </button>



              <button

                type="button"

                onClick={() => selectRole("retailer")}

                aria-pressed={role === "retailer"}

                className={`flex h-[44px] items-center justify-center gap-2 rounded-lg text-[12px] font-semibold transition ${

                  role === "retailer"

                    ? darkMode

                      ? "bg-brand-navy-card text-white shadow-sm"

                      : "bg-app-surface text-app-text shadow-sm"

                    : darkMode

                    ? "text-[#b8c9ee]"

                    : "text-app-text-secondary"

                }`}

              >

                <Store size={17} />

                Retailer

              </button>

            </div>



            <p

              className={`mt-2 text-[11px] leading-5 ${

                darkMode ? "text-[#b8c9ee]" : "text-app-text-secondary"

              }`}

            >

              {role === "admin"

                ? "Platform owner access — manage retailers, pricing, wallets and reports."

                : "Retailer access — manage KYC verification, wallet and reports."}

            </p>

          </div>



          {/* Form */}

          <form onSubmit={handleLogin} noValidate className="mt-5 space-y-4">

            <div>

              <label

                htmlFor="login-email"

                className="mb-2 block text-[12px] font-medium"

              >

                Email or mobile number

              </label>



              <div className="relative">

                <UserRound

                  size={17}

                  className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted"

                />



                <input

                  id="login-email"

                  name="email"

                  type="text"

                  value={form.email}

                  onChange={handleChange}

                  autoComplete="username"

                  placeholder="name@company.in or 98XXXXXXXX"

                  aria-invalid={Boolean(errors.email)}

                  className={`h-[49px] w-full rounded-lg border pl-11 pr-4 text-[13px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 ${

                    darkMode

                      ? "border-white/20 bg-white/10 text-white placeholder:text-[#9eafd1]"

                      : "border-app-border bg-app-surface text-app-text placeholder:text-app-text-muted"

                  } ${errors.email ? "border-danger" : ""}`}

                />

              </div>



              {errors.email && (

                <p className="mt-1 flex items-center gap-1 text-[11px] text-danger">

                  <AlertCircle size={13} />

                  {errors.email}

                </p>

              )}

            </div>



            <div>

              <div className="mb-2 flex items-center justify-between gap-2">

                <label

                  htmlFor="login-password"

                  className="text-[12px] font-medium"

                >

                  Password

                </label>



                <button

                  type="button"

                  onClick={openForgotPassword}

                  className="text-[12px] font-medium text-primary hover:underline"

                >

                  Forgot password?

                </button>

              </div>



              <div className="relative">

                <LockKeyhole

                  size={17}

                  className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted"

                />



                <input

                  id="login-password"

                  name="password"

                  type={showPassword ? "text" : "password"}

                  value={form.password}

                  onChange={handleChange}

                  autoComplete="current-password"

                  placeholder="Enter your password"

                  aria-invalid={Boolean(errors.password)}

                  className={`h-[49px] w-full rounded-lg border pl-11 pr-11 text-[13px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 ${

                    darkMode

                      ? "border-white/20 bg-white/10 text-white placeholder:text-[#9eafd1]"

                      : "border-app-border bg-app-surface text-app-text placeholder:text-app-text-muted"

                  } ${errors.password ? "border-danger" : ""}`}

                />



                <button

                  type="button"

                  onClick={() => setShowPassword((previous) => !previous)}

                  aria-label={showPassword ? "Hide password" : "Show password"}

                  className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-primary"

                >

                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}

                </button>

              </div>



              {errors.password && (

                <p className="mt-1 flex items-center gap-1 text-[11px] text-danger">

                  <AlertCircle size={13} />

                  {errors.password}

                </p>

              )}

            </div>



            <div className="flex items-center justify-between gap-3">

              <label className="flex cursor-pointer items-center gap-2.5">

                <input

                  type="checkbox"

                  checked={rememberMe}

                  onChange={(event) => setRememberMe(event.target.checked)}

                  className="h-4 w-4 accent-[var(--brand-primary)]"

                />

                <span className="text-[12px]">Keep me signed in</span>

              </label>



              <span

                className={`flex items-center gap-2 text-[11px] ${

                  darkMode ? "text-[#b8c9ee]" : "text-app-text-secondary"

                }`}

              >

                <LockKeyhole size={14} />

                256-bit TLS

              </span>

            </div>



            {message && (

              <div

                role="status"

                className={`rounded-lg border p-3 text-[11px] ${

                  darkMode

                    ? "border-white/20 bg-white/10 text-white"

                    : "border-app-border bg-app-surface-muted text-app-text-secondary"

                }`}

              >

                {message}

              </div>

            )}



            <button

              type="submit"

              disabled={loading}

              className="flex h-[53px] w-full items-center justify-center gap-2 rounded-lg bg-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-60"

            >

              {loading ? (

                <>

                  <LoaderCircle size={18} className="animate-spin" />

                  Signing in...

                </>

              ) : (

                <>

                  <LogIn size={18} />

                  Sign in securely

                </>

              )}

            </button>

          </form>



          {/* Demo quick access */}

          <div className="mt-6">

            <div className="flex items-center gap-3">

              <div className="h-px flex-1 bg-app-border" />

              <span

                className={`whitespace-nowrap text-[11px] font-medium tracking-[0.09em] ${

                  darkMode ? "text-[#b8c9ee]" : "text-app-text-secondary"

                }`}

              >

                DEMO QUICK ACCESS

              </span>

              <div className="h-px flex-1 bg-app-border" />

            </div>



            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

              <button

                type="button"

                onClick={() => fillDemo("admin")}

                className={`flex min-h-[92px] items-center gap-3 rounded-xl border p-3 text-left transition hover:border-primary ${

                  darkMode

                    ? "border-white/20 bg-white/5"

                    : "border-app-border bg-app-surface"

                }`}

              >

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">

                  AM

                </div>

                <div>

                  <p className="text-[12px] font-semibold">Super Admin</p>

                  <p

                    className={`mt-1 text-[11px] ${

                      darkMode ? "text-[#b8c9ee]" : "text-app-text-secondary"

                    }`}

                  >

                    Arvind Mehta

                  </p>

                </div>

              </button>



              <button

                type="button"

                onClick={() => fillDemo("retailer")}

                className={`flex min-h-[92px] items-center gap-3 rounded-xl border p-3 text-left transition hover:border-primary ${

                  darkMode

                    ? "border-white/20 bg-white/5"

                    : "border-app-border bg-app-surface"

                }`}

              >

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-[12px] font-bold text-white">

                  RP

                </div>

                <div>

                  <p className="text-[12px] font-semibold">Retailer</p>

                  <p

                    className={`mt-1 text-[11px] ${

                      darkMode ? "text-[#b8c9ee]" : "text-app-text-secondary"

                    }`}

                  >

                    Shree Ganesh Mobile Point

                  </p>

                </div>

              </button>

            </div>



            <div

              className={`mt-4 rounded-xl border p-4 ${

                darkMode

                  ? "border-white/20 bg-white/5"

                  : "border-app-border bg-app-surface-muted"

              }`}

            >

              <h3 className="text-[12px] font-semibold">Demo credentials</h3>



              <div className="mt-2 space-y-1 text-[11px] leading-5">

                <p>

                  Admin: <code>admin@verifyhub.demo</code> /{" "}

                  <code>Admin@123</code>

                </p>

                <p>

                  Retailer: <code>retailer@verifyhub.demo</code> /{" "}

                  <code>Demo@123</code>

                </p>

              </div>

            </div>



            <p

              className={`mt-4 text-center text-[11px] leading-5 ${

                darkMode ? "text-[#b8c9ee]" : "text-app-text-secondary"

              }`}

            >

              Prototype only — authentication is simulated in the browser.

              Production enforces authentication, RBAC and rate limits on

              the server.

            </p>

          </div>

        </div>

      </section>



      {/* FORGOT PASSWORD MODAL */}

      {forgotOpen && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-[#07132d]/55 p-4 backdrop-blur-[4px]"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) {

              closeForgotPassword();

            }

          }}

        >

          <div

            role="dialog"

            aria-modal="true"

            aria-labelledby="reset-password-title"

            className="w-full max-w-[550px] overflow-hidden rounded-[20px] bg-white text-app-text shadow-2xl"

          >

            {/* Modal header */}

            <div className="flex items-start gap-4 border-b border-app-border px-7 py-6">

              <div className="flex h-[50px] w-[76px] shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">

                <KeyRound size={22} />

              </div>



              <div className="min-w-0 flex-1">

                <h2

                  id="reset-password-title"

                  className="text-[20px] font-bold leading-7 tracking-tight"

                >

                  Reset your password

                </h2>



                <p className="mt-2 text-[13px] leading-6 text-app-text-secondary">

                  We'll send a secure reset link to your registered email.

                </p>

              </div>



              <button

                type="button"

                onClick={closeForgotPassword}

                aria-label="Close reset password dialog"

                className="rounded-lg p-1 text-app-text-secondary hover:bg-app-surface-muted"

              >

                <X size={20} />

              </button>

            </div>



            {/* Modal form */}

            <form onSubmit={handleResetPassword} noValidate>

              <div className="px-7 py-6">

                <label

                  htmlFor="reset-email"

                  className="mb-2 block text-[13px] font-medium"

                >

                  Registered email

                </label>



                <input

                  id="reset-email"

                  type="email"

                  value={resetEmail}

                  onChange={(event) => {

                    setResetEmail(event.target.value);

                    setResetError("");

                  }}

                  autoFocus

                  autoComplete="email"

                  placeholder="name@company.in"

                  aria-invalid={Boolean(resetError)}

                  className={`h-[52px] w-full rounded-lg border bg-white px-4 text-[14px] text-app-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${

                    resetError ? "border-danger" : "border-app-border"

                  }`}

                />



                {resetError && (

                  <p className="mt-2 flex items-center gap-1 text-[12px] text-danger">

                    <AlertCircle size={14} />

                    {resetError}

                  </p>

                )}



                <p className="mt-3 text-[12px] text-app-text-secondary">

                  Demo: no email is actually sent.

                </p>

              </div>



              {/* Modal footer */}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-app-border bg-app-surface-muted px-7 py-4">

                <button

                  type="button"

                  onClick={closeForgotPassword}

                  className="rounded-lg border border-app-border bg-white px-5 py-3 text-[13px] font-semibold text-app-text transition hover:bg-primary-light"

                >

                  Cancel

                </button>



                <button

                  type="submit"

                  disabled={resetLoading}

                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"

                >

                  {resetLoading ? (

                    <LoaderCircle size={17} className="animate-spin" />

                  ) : (

                    <Send size={17} />

                  )}

                  Send reset link

                </button>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* SUCCESS TOAST */}

      {toast && (

        <div

          role="status"

          aria-live="polite"

          className="fixed right-4 top-5 z-[60] flex w-[calc(100%-2rem)] max-w-[470px] items-start gap-4 rounded-2xl border border-app-border border-l-4 border-l-success bg-white px-5 py-4 text-app-text shadow-xl"

        >

          <CheckCircle2

            size={23}

            className="mt-0.5 shrink-0 text-success"

          />



          <div className="min-w-0 flex-1">

            <h3 className="text-[14px] font-bold">Reset link sent</h3>

            <p className="mt-1 text-[12px] leading-6 text-app-text-secondary">

              {toast}

            </p>

          </div>



          <button

            type="button"

            onClick={() => setToast("")}

            aria-label="Dismiss notification"

            className="rounded-lg p-1 text-app-text-secondary hover:bg-app-surface-muted"

          >

            <X size={18} />

          </button>

        </div>

      )}

    </main>

  );

}
