import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2, UserRound, KeyRound, Bell, Plug, SlidersHorizontal,
  ScrollText, Database, Save, Eye, EyeOff, AlertCircle,
  ShieldCheck, RefreshCcw, Download, Trash2,
} from "lucide-react";

const tabs = [
  { id: "company", label: "Company profile", icon: Building2 },
  { id: "profile", label: "My profile", icon: UserRound },
  { id: "password", label: "Password", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "providers", label: "API providers", icon: Plug },
  { id: "system", label: "System configuration", icon: SlidersHorizontal },
  { id: "audit", label: "Audit activity", icon: ScrollText },
  { id: "demo", label: "Demo data", icon: Database },
];

const companyDefaults = {
  companyName: "VerifyHub Technologies Pvt. Ltd. (Demo)", brand: "VerifyHub",
  email: "support@verifyhub.demo", phone: "+91 22 4000 1234",
  website: "www.verifyhub.demo", gstin: "27AAGCV1234M1Z2",
  address: "7th Floor, Demo Business Park, Andheri East, Mumbai, Maharashtra - 400069",
};
const profileDefaults = {
  name: "Arvind Mehta", email: "admin@verifyhub.demo",
  phone: "+91 98765 43210", role: "Super Admin", designation: "Platform Administrator",
};
const notificationDefaults = {
  fundRequests: true, verificationFailures: true, lowBalance: true,
  dailyReports: false, securityAlerts: true, emailNotifications: true,
};
const systemDefaults = {
  currency: "INR", timezone: "Asia/Kolkata", sessionTimeout: "30",
  lowBalanceThreshold: "500", maintenanceMode: false,
};
const providersDefaults = { aadhaar: true, pan: true, bank: true, esign: true };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(`verifyhub-settings-${key}`);
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value === "object" && !Array.isArray(value)
      ? { ...fallback, ...value }
      : { ...fallback };
  } catch {
    return { ...fallback };
  }
}
function loadAudit() {
  try {
    const value = JSON.parse(localStorage.getItem("verifyhub-settings-audit") || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
function Field({ label, value, onChange, type = "text", required = false, disabled = false, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[13px] font-semibold text-[#475779]">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children || (
        <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          required={required} disabled={disabled}
          className="w-full min-w-0 rounded-[9px] border border-[#d3dced] bg-white px-4 py-3 text-[14px] text-[#14203b] outline-none transition focus:border-[#2d52ed] focus:ring-2 focus:ring-[#2d52ed]/10 disabled:bg-slate-100" />
      )}
    </label>
  );
}
function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-[#12965d]" : "bg-slate-300"}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}
function Section({ title, subtitle, children, footer }) {
  return (
    <section className="overflow-hidden rounded-[15px] border border-[#dfe6f2] bg-white shadow-[0_2px_3px_rgba(20,35,65,0.05)]">
      <div className="border-b border-[#e1e7f1] px-5 py-5 sm:px-6">
        <h2 className="text-[17px] font-bold text-[#111c37]">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-[#8a99b5]">{subtitle}</p>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
      {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-[#e1e7f1] px-5 py-4 sm:px-6">{footer}</div>}
    </section>
  );
}
function SaveButton({ onClick, label = "Save changes" }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#2d50e9] px-5 py-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1e40d2]"><Save size={17}/>{label}</button>;
}
function RowSetting({ title, description, checked, onChange }) {
  return <div className="flex items-center justify-between gap-4 border-b border-[#e8edf5] py-4 last:border-0"><div><p className="text-sm font-semibold text-[#172442]">{title}</p><p className="mt-1 text-xs leading-5 text-[#8492ac]">{description}</p></div><Switch checked={checked} onChange={onChange} label={title}/></div>;
}

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const validTab = tabs.some((item) => item.id === requestedTab) ? requestedTab : "company";
  const [company, setCompany] = useState(() => load("company", companyDefaults));
  const [profile, setProfile] = useState(() => load("profile", profileDefaults));
  const [notifications, setNotifications] = useState(() => load("notifications", notificationDefaults));
  const [system, setSystem] = useState(() => load("system", systemDefaults));
  const [providers, setProviders] = useState(() => load("providers", providersDefaults));
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [audit, setAudit] = useState(loadAudit);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const handleReset = () => {
      setCompany({ ...companyDefaults });
      setProfile({ ...profileDefaults });
      setNotifications({ ...notificationDefaults });
      setProviders({ ...providersDefaults });
      setSystem({ ...systemDefaults });
      setAudit([]);
      setPassword({ current: "", next: "", confirm: "" });
      setNotice("Settings restored to demo defaults.");
    };
    window.addEventListener("verifyhub-demo-reset", handleReset);
    return () => window.removeEventListener("verifyhub-demo-reset", handleReset);
  }, []);

  const selectTab = (id) => setSearchParams(id === "company" ? {} : { tab: id });
  const update = (setter, key) => (value) => setter((old) => ({ ...old, [key]: value }));
  const record = (action) => {
    const entry = { action, time: new Date().toLocaleString("en-IN") };
    setAudit((previous) => {
      const next = [entry, ...previous].slice(0, 40);
      localStorage.setItem("verifyhub-settings-audit", JSON.stringify(next));
      return next;
    });
  };
  const save = (key, value, label) => {
    localStorage.setItem(`verifyhub-settings-${key}`, JSON.stringify(value));
    record(`${label} updated`);
    if (key === "profile") window.dispatchEvent(new Event("verifyhub-profile-updated"));
    setNotice(`${label} saved successfully (demo only).`);
  };
  const validateCompany = () => {
    if (!company.companyName.trim() || !company.brand.trim() || !emailPattern.test(company.email) || !company.address.trim()) {
      setNotice("Please complete the required company fields with a valid email.");
      return;
    }
    save("company", company, "Company profile");
  };
  const validateProfile = () => {
    if (!profile.name.trim() || !emailPattern.test(profile.email)) {
      setNotice("Enter a valid name and email.");
      return;
    }
    save("profile", profile, "My profile");
  };
  const changePassword = () => {
    if (!password.current || password.next.length < 8 || !/[a-zA-Z]/.test(password.next) || !/\d/.test(password.next) || password.next !== password.confirm) {
      setNotice("Enter current password and a matching new password (8+ characters, letters and numbers).");
      return;
    }
    setPassword({ current: "", next: "", confirm: "" });
    record("Password change form submitted (demo)");
    setNotice("Demo validation successful. Password was NOT changed; backend authentication is not connected.");
  };
  const exportAudit = () => {
    const rows = [["Action", "Date & time"], ...audit.map((x) => [x.action, x.time])];
    const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "verifyhub-settings-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const resetSettings = () => {
    if (!window.confirm("Reset all Settings preferences to demo defaults?")) return;
    ["company", "profile", "notifications", "providers", "system", "audit"].forEach((key) => localStorage.removeItem(`verifyhub-settings-${key}`));
    window.dispatchEvent(new Event("verifyhub-demo-reset"));
    window.dispatchEvent(new Event("verifyhub-profile-updated"));
  };

  return (
    <div style={{ colorScheme: "light" }} className="min-h-[calc(100vh-140px)] min-w-0 bg-[#f4f6fd] px-4 py-7 sm:px-6 lg:px-7 lg:py-8">
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-tight text-[#101a33]">Settings</h1>
        <p className="mt-1 text-[14px] text-[#566788]">Organisation profile, security, integrations and audit trail.</p>
      </div>
      {notice && <div role="status" className="mb-5 flex items-start gap-2 rounded-lg border border-[#bfcef9] bg-[#eef3ff] px-4 py-3 text-sm text-[#2347a8]"><AlertCircle size={18} className="mt-0.5 shrink-0" />{notice}<button type="button" onClick={() => setNotice("")} className="ml-auto font-bold" aria-label="Dismiss message">×</button></div>}

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-6">
        <aside className="rounded-[15px] border border-[#dfe6f2] bg-white p-3 shadow-[0_2px_3px_rgba(20,35,65,0.05)]">
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1" aria-label="Settings sections">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => selectTab(id)}
                className={`flex min-w-0 items-center gap-3 rounded-[9px] px-3 py-3 text-left text-[12px] font-semibold transition sm:text-[13px] ${validTab === id ? "bg-[#edf1ff] text-[#2951ed]" : "text-[#4e5e7e] hover:bg-[#f4f6fc]"}`}>
                <Icon size={18} className="shrink-0" /><span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          {validTab === "company" && (
            <Section title="Company profile" subtitle="Shown on invoices, receipts and retailer communications" footer={<SaveButton onClick={validateCompany} />}>
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
                <Field label="Registered company name" value={company.companyName} onChange={update(setCompany, "companyName")} required />
                <Field label="Brand name" value={company.brand} onChange={update(setCompany, "brand")} required />
                <Field label="Support email" type="email" value={company.email} onChange={update(setCompany, "email")} required />
                <Field label="Support phone" value={company.phone} onChange={update(setCompany, "phone")} />
                <Field label="Website" value={company.website} onChange={update(setCompany, "website")} />
                <Field label="Company GSTIN" value={company.gstin} onChange={update(setCompany, "gstin")} />
                <div className="md:col-span-2"><Field label="Registered address" required><textarea rows={3} value={company.address} onChange={(e) => update(setCompany, "address")(e.target.value)} className="w-full resize-y rounded-[9px] border border-[#d3dced] bg-white px-4 py-3 text-[14px] text-[#14203b] outline-none focus:border-[#2d52ed]" /></Field></div>
              </div>
            </Section>
          )}
          {validTab === "profile" && (
            <Section title="My profile" subtitle="Your Super Admin account details" footer={<SaveButton onClick={validateProfile} />}>
              <div className="mb-6 flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#087c72] text-lg font-bold text-white">{profile.name.split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase()}</div><div><p className="font-bold text-[#111c37]">{profile.name}</p><p className="text-xs text-[#8a99b5]">Super Admin · Demo account</p></div></div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Full name" value={profile.name} onChange={update(setProfile, "name")} />
                <Field label="Email address" type="email" value={profile.email} onChange={update(setProfile, "email")} />
                <Field label="Mobile number" value={profile.phone} onChange={update(setProfile, "phone")} />
                <Field label="Designation" value={profile.designation} onChange={update(setProfile, "designation")} />
                <Field label="Account role" value={profile.role} onChange={() => {}} disabled />
              </div>
            </Section>
          )}
          {validTab === "password" && (
            <Section title="Change password" subtitle="Password changes require a connected authentication API">
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Demo mode: This form validates inputs only. It does not verify your current password or update login credentials.</div>
              <div className="max-w-xl space-y-5">
                <Field label="Current password" type={showPassword ? "text" : "password"} value={password.current} onChange={update(setPassword, "current")} />
                <Field label="New password" type={showPassword ? "text" : "password"} value={password.next} onChange={update(setPassword, "next")} />
                <Field label="Confirm new password" type={showPassword ? "text" : "password"} value={password.confirm} onChange={update(setPassword, "confirm")} />
                <button type="button" onClick={() => setShowPassword((x) => !x)} className="inline-flex items-center gap-2 text-sm text-[#536587]">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>} {showPassword ? "Hide" : "Show"} passwords</button>
                <div><SaveButton label="Validate password change" onClick={changePassword} /></div>
              </div>
            </Section>
          )}
          {validTab === "notifications" && (
            <Section title="Notification preferences" subtitle="Choose which demo notifications you want to receive" footer={<SaveButton onClick={() => save("notifications", notifications, "Notification preferences")} />}>
              {[
                ["fundRequests", "Fund requests", "New retailer wallet top-up requests"],
                ["verificationFailures", "Verification failures", "Failed KYC checks and provider errors"],
                ["lowBalance", "Low wallet balance", "Retailers falling below the configured balance"],
                ["dailyReports", "Daily reports", "Daily verification and revenue summaries"],
                ["securityAlerts", "Security alerts", "Account and system security events"],
                ["emailNotifications", "Email notifications", "Email delivery preference (demo only)"],
              ].map(([key, title, description]) => <RowSetting key={key} title={title} description={description} checked={notifications[key]} onChange={update(setNotifications, key)} />)}
            </Section>
          )}
          {validTab === "providers" && (
            <Section title="API providers" subtitle="Demo configuration only — no live provider credentials or API calls" footer={<SaveButton onClick={() => save("providers", providers, "API provider preferences")} />}>
              {[
                ["aadhaar", "Aadhaar Verification (OTP)", "UIDAI-authorised partner required in production"],
                ["pan", "PAN Card Verification", "Income-tax verification provider"],
                ["bank", "Bank Account Verification", "Penny-drop provider"],
                ["esign", "Consent Letter with e-Sign", "Licensed e-Sign provider required in production"],
              ].map(([key, title, description]) => <RowSetting key={key} title={title} description={description} checked={providers[key]} onChange={update(setProviders, key)} />)}
              <p className="mt-5 flex items-start gap-2 rounded-lg bg-[#eef3ff] p-3 text-xs leading-5 text-[#37549a]"><ShieldCheck size={17} className="shrink-0" />Production provider keys must be stored securely on the backend, never in frontend code or browser storage.</p>
            </Section>
          )}
          {validTab === "system" && (
            <Section title="System configuration" subtitle="General platform preferences for the demo" footer={<SaveButton onClick={() => save("system", system, "System configuration")} />}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Default currency"><select value={system.currency} onChange={(e) => update(setSystem, "currency")(e.target.value)} className="w-full rounded-lg border border-[#d3dced] bg-white p-3 text-[#14203b]"><option value="INR">INR (₹)</option></select></Field>
                <Field label="Timezone"><select value={system.timezone} onChange={(e) => update(setSystem, "timezone")(e.target.value)} className="w-full rounded-lg border border-[#d3dced] bg-white p-3 text-[#14203b]"><option value="Asia/Kolkata">Asia/Kolkata (IST)</option><option value="UTC">UTC</option></select></Field>
                <Field label="Session timeout (minutes)" type="number" value={system.sessionTimeout} onChange={update(setSystem, "sessionTimeout")} />
                <Field label="Low wallet balance alert (₹)" type="number" value={system.lowBalanceThreshold} onChange={update(setSystem, "lowBalanceThreshold")} />
              </div>
              <div className="mt-5"><RowSetting title="Maintenance mode" description="Demo setting only; does not block actual requests" checked={system.maintenanceMode} onChange={update(setSystem, "maintenanceMode")} /></div>
            </Section>
          )}
          {validTab === "audit" && (
            <Section title="Audit activity" subtitle="Recent changes made within this browser demo" footer={<button type="button" onClick={exportAudit} className="inline-flex items-center gap-2 rounded-lg border border-[#d3dced] px-4 py-2 text-sm font-semibold text-[#233354]"><Download size={17}/>Export CSV</button>}>
              {audit.length === 0 ? <div className="py-12 text-center text-sm text-[#8a99b5]">No settings changes recorded yet. Save a setting to see it here.</div> : <div className="divide-y divide-[#e7edf5]">{audit.map((entry, i) => <div key={i} className="flex flex-wrap justify-between gap-2 py-4 text-sm"><span className="font-medium text-[#182440]">{entry.action}</span><span className="text-[#8492ac]">{entry.time}</span></div>)}</div>}
            </Section>
          )}
          {validTab === "demo" && (
            <Section title="Demo data" subtitle="Manage settings stored locally in this browser">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-[#294c90]">All records shown in this prototype are synthetic. These controls affect only Settings page preferences stored in your browser.</div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={resetSettings} className="inline-flex items-center gap-2 rounded-lg border border-[#d3dced] px-4 py-3 text-sm font-semibold text-[#233354]"><RefreshCcw size={17}/>Reset settings to defaults</button>
                <button type="button" onClick={() => { if (!window.confirm("Clear Settings audit history?")) return; setAudit([]); localStorage.removeItem("verifyhub-settings-audit"); setNotice("Settings audit history cleared."); }} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600"><Trash2 size={17}/>Clear settings audit</button>
              </div>
              <p className="mt-5 text-xs text-[#8a99b5]">This does not clear retailer, wallet, verification, or login data.</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
