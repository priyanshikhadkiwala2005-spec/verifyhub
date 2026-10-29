import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, UserRound, KeyRound, Bell, Plug, SlidersHorizontal, ScrollText, Database, Save, Eye, EyeOff, AlertCircle, ShieldCheck, RefreshCcw, Download, Trash2, } from "lucide-react";
import api, { getErrorMessage } from "../../api";
import { updateStoredUser } from "../../auth";

// Data: GET /admin/settings · sections: PUT /admin/settings/{company|notifications|providers|system} { data }
// Profile: PUT /admin/profile (+ GET /auth/me for the real mobile) · password: PUT /admin/password · audit: GET /admin/audit-logs
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

const emptyCompany = { companyName: "", brand: "", email: "", phone: "", website: "", gstin: "", address: "" };
const emptyProfile = { name: "", email: "", phone: "", role: "Super Admin", designation: "" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUDIT_LIMIT = 40;

const toCompany = (c = {}) => ({ companyName: c.company_name ?? "", brand: c.brand_name ?? "", email: c.support_email ?? "", phone: c.support_phone ?? "", website: c.website ?? "", gstin: c.gstin ?? "", address: c.address ?? "" });
const fromCompany = (c) => ({ company_name: c.companyName.trim(), brand_name: c.brand.trim(), support_email: c.email.trim(), support_phone: c.phone.trim(), website: c.website.trim(), gstin: c.gstin.trim().toUpperCase(), address: c.address.trim() });
const auditTime = (iso) => new Date(iso).toLocaleString("en-IN");

function Field({ label, value, onChange, type = "text", required = false, disabled = false, children }) {
    return (<label className="block min-w-0">
      <span className="mb-2 block text-[13px] font-semibold text-app-text-secondary">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children || (<input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} disabled={disabled} className="w-full min-w-0 rounded-[9px] border border-app-border bg-app-surface px-4 py-3 text-[14px] text-app-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-app-surface-muted"/>)}
    </label>);
}

function Switch({ checked, onChange, label }) {
    return (<button type="button" role="switch" aria-checked={!!checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-success" : "bg-app-border"}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-app-surface shadow transition-all ${checked ? "left-6" : "left-1"}`}/>
    </button>);
}

function Section({ title, subtitle, children, footer }) {
    return (<section className="overflow-hidden rounded-[15px] border border-app-border bg-app-surface shadow-[0_2px_3px_rgba(20,35,65,0.05)]">
      <div className="border-b border-app-border px-5 py-5 sm:px-6">
        <h2 className="text-[17px] font-bold text-app-text">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-app-text-muted">{subtitle}</p>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
      {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-app-border px-5 py-4 sm:px-6">{footer}</div>}
    </section>);
}

function SaveButton({ onClick, label = "Save changes", disabled = false }) {
    return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-primary px-5 py-3 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60"><Save size={17}/>{label}</button>;
}

function RowSetting({ title, description, checked, onChange }) {
    return <div className="flex items-center justify-between gap-4 border-b border-app-border py-4 last:border-0"><div><p className="text-sm font-semibold text-app-text">{title}</p><p className="mt-1 text-xs leading-5 text-app-text-muted">{description}</p></div><Switch checked={checked} onChange={onChange} label={title}/></div>;
}

export default function Settings() {
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedTab = searchParams.get("tab");
    const validTab = tabs.some((item) => item.id === requestedTab) ? requestedTab : "company";
    const [company, setCompany] = useState(emptyCompany);
    const [profile, setProfile] = useState(emptyProfile);
    const [notifications, setNotifications] = useState({});
    const [system, setSystem] = useState({});
    const [providers, setProviders] = useState([]);
    const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
    // Form errors are shown next to the Save button (the page-level notice is easy to miss).
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [saving, setSaving] = useState(false);
    const [audit, setAudit] = useState({ rows: [], total: 0 });
    const [auditLoading, setAuditLoading] = useState(true);
    const [auditError, setAuditError] = useState("");
    useEffect(() => {
        if (!notice)
            return;
        const timer = setTimeout(() => setNotice(""), 3500);
        return () => clearTimeout(timer);
    }, [notice]);

    const loadSettings = useCallback(() => Promise.all([api.get("/admin/settings"), api.get("/auth/me")])
        .then(([settingsRes, meRes]) => {
            const d = settingsRes.data?.data ?? {};
            setCompany(toCompany(d.company));
            // The settings API substitutes a placeholder mobile when none is saved, so the real value comes from /auth/me.
            setProfile({ name: d.profile?.name ?? "", email: d.profile?.email ?? "", phone: meRes.data?.data?.mobile ?? "", role: d.profile?.role ?? "Super Admin", designation: d.profile?.designation ?? "" });
            setNotifications(d.notifications ?? {});
            setSystem({ ...d.system, currency: d.system?.currency ?? "INR", timezone: d.system?.timezone ?? "Asia/Kolkata" });
            setProviders(Array.isArray(d.providers) ? d.providers : []);
            setLoadError("");
        })
        .catch((err) => setLoadError(getErrorMessage(err, "Unable to load settings.")))
        .finally(() => setLoading(false)), []);
    useEffect(() => { loadSettings(); }, [loadSettings]);
    const retry = () => { setLoading(true); setLoadError(""); loadSettings(); };

    const loadAudit = useCallback(() => api.get("/admin/audit-logs", { params: { per_page: AUDIT_LIMIT } })
        .then(({ data }) => { setAudit({ rows: data?.data?.data ?? [], total: Number(data?.data?.total) || 0 }); setAuditError(""); })
        .catch((err) => setAuditError(getErrorMessage(err, "Unable to load audit activity.")))
        .finally(() => setAuditLoading(false)), []);
    useEffect(() => { if (validTab === "audit") loadAudit(); }, [validTab, loadAudit]);

    const selectTab = (id) => { setFormError(""); setSearchParams(id === "company" ? {} : { tab: id }); };
    const update = (setter, key) => (value) => { setFormError(""); setter((old) => ({ ...old, [key]: value })); };
    const formErrorBox = formError && <p role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0"/>{formError}</p>;
    const saveSection = async (section, data, label) => {
        if (saving) return;
        setSaving(true);
        try {
            const { data: res } = await api.put(`/admin/settings/${section}`, { data });
            setNotice(res?.message || `${label} saved successfully.`);
            loadSettings();
        } catch (err) {
            setNotice(getErrorMessage(err, `Unable to save ${label.toLowerCase()}.`));
        } finally {
            setSaving(false);
        }
    };
    const validateCompany = () => {
        if (!company.companyName.trim() || !company.brand.trim() || !emailPattern.test(company.email.trim()) || !company.address.trim()) {
            setNotice("Please complete the required company fields with a valid email.");
            return;
        }
        saveSection("company", fromCompany(company), "Company profile");
    };
    const validateProfile = async () => {
        if (saving) return;
        const phone = profile.phone.replace(/\D/g, "").slice(-10);
        if (!profile.name.trim() || !profile.designation.trim()) {
            setFormError("Enter your full name and designation.");
            return;
        }
        if (!/^[6-9]\d{9}$/.test(phone)) {
            setFormError("Mobile number is required to save your profile. Enter a valid 10-digit Indian mobile number.");
            return;
        }
        setFormError("");
        setSaving(true);
        try {
            const { data } = await api.put("/admin/profile", { name: profile.name.trim(), designation: profile.designation.trim(), mobile: phone });
            updateStoredUser({ name: data?.data?.name ?? profile.name.trim() });
            window.dispatchEvent(new Event("verifyhub-profile-updated"));
            setNotice(data?.message || "Profile updated successfully.");
            loadSettings();
        } catch (err) {
            setFormError(getErrorMessage(err, "Unable to update your profile."));
        } finally {
            setSaving(false);
        }
    };
    const changePassword = async () => {
        if (saving) return;
        if (!password.current || password.next.length < 8 || !/[a-zA-Z]/.test(password.next) || !/\d/.test(password.next) || password.next !== password.confirm) {
            setNotice("Enter current password and a matching new password (8+ characters, letters and numbers).");
            return;
        }
        setSaving(true);
        try {
            const { data } = await api.put("/admin/password", { current_password: password.current, new_password: password.next, confirm_password: password.confirm });
            setPassword({ current: "", next: "", confirm: "" });
            setNotice(data?.message || "Password updated successfully.");
        } catch (err) {
            setNotice(getErrorMessage(err, "Unable to change your password."));
        } finally {
            setSaving(false);
        }
    };
    const saveSystem = () => {
        const timeout = Number(system.session_timeout);
        const threshold = Number(system.low_balance_threshold);
        if (!Number.isInteger(timeout) || timeout < 5 || timeout > 240) {
            setNotice("Session timeout must be a whole number between 5 and 240 minutes.");
            return;
        }
        if (!Number.isFinite(threshold) || threshold < 0) {
            setNotice("Low wallet balance alert must be ₹0 or more.");
            return;
        }
        saveSection("system", { ...system, session_timeout: timeout, low_balance_threshold: threshold }, "System configuration");
    };
    const exportAudit = async () => {
        try {
            const { data } = await api.get("/admin/audit-logs", { params: { per_page: Math.min(Math.max(audit.total, 1), 2000) } });
            const rows = [["Action", "Target", "Actor", "IP", "Date & time"], ...(data?.data?.data ?? []).map((x) => [x.action, x.target, x.actor, x.ip, auditTime(x.created_at)])];
            const csv = rows.map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
            const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "verifyhub-audit-log.csv";
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setNotice(getErrorMessage(err, "Unable to export the audit log."));
        }
    };
    const loadingNote = loading && <p className="mb-4 text-sm text-app-text-muted">Loading settings...</p>;
    return (<div className="min-h-[calc(100vh-140px)] min-w-0 bg-app-background px-4 py-7 sm:px-6 lg:px-7 lg:py-8">
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-tight text-app-text">Settings</h1>
        <p className="mt-1 text-[14px] text-app-text-secondary">Organisation profile, security, integrations and audit trail.</p>
      </div>
      {loadError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{loadError}</span><button type="button" onClick={retry} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold">Retry</button></div>}
      {notice && <div role="status" className="mb-5 flex items-start gap-2 rounded-lg border border-app-border bg-primary-light px-4 py-3 text-sm text-primary"><AlertCircle size={18} className="mt-0.5 shrink-0"/>{notice}<button type="button" onClick={() => setNotice("")} className="ml-auto font-bold" aria-label="Dismiss message">×</button></div>}
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-6">
        <aside className="rounded-[15px] border border-app-border bg-app-surface p-3 shadow-[0_2px_3px_rgba(20,35,65,0.05)]">
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1" aria-label="Settings sections">
            {tabs.map(({ id, label, icon: Icon }) => (<button key={id} type="button" onClick={() => selectTab(id)} className={`flex min-w-0 items-center gap-3 rounded-[9px] px-3 py-3 text-left text-[12px] font-semibold transition sm:text-[13px] ${validTab === id ? "bg-primary-light text-primary" : "text-app-text-secondary hover:bg-app-surface-muted"}`}>
                <Icon size={18} className="shrink-0"/><span>{label}</span>
              </button>))}
          </nav>
        </aside>
        <div className="min-w-0">
          {validTab === "company" && (<Section title="Company profile" subtitle="Shown on invoices, receipts and retailer communications" footer={<SaveButton onClick={validateCompany} disabled={saving || loading} label={saving ? "Saving..." : "Save changes"}/>}>
              {loadingNote}
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
                <Field label="Registered company name" value={company.companyName} onChange={update(setCompany, "companyName")} required/>
                <Field label="Brand name" value={company.brand} onChange={update(setCompany, "brand")} required/>
                <Field label="Support email" type="email" value={company.email} onChange={update(setCompany, "email")} required/>
                <Field label="Support phone" value={company.phone} onChange={update(setCompany, "phone")}/>
                <Field label="Website" value={company.website} onChange={update(setCompany, "website")}/>
                <Field label="Company GSTIN" value={company.gstin} onChange={update(setCompany, "gstin")}/>
                <div className="md:col-span-2"><Field label="Registered address" required><textarea rows={3} value={company.address} onChange={(e) => update(setCompany, "address")(e.target.value)} className="w-full resize-y rounded-[9px] border border-app-border bg-app-surface px-4 py-3 text-[14px] text-app-text outline-none focus:border-primary"/></Field></div>
              </div>
            </Section>)}
          {validTab === "profile" && (<Section title="My profile" subtitle="Your Super Admin account details" footer={<SaveButton onClick={validateProfile} disabled={saving || loading} label={saving ? "Saving..." : "Save changes"}/>}>
              {loadingNote}
              <div className="mb-6 flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#087c72] text-lg font-bold text-white">{profile.name.split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase()}</div><div><p className="font-bold text-app-text">{profile.name}</p><p className="text-xs text-app-text-muted">{profile.role}</p></div></div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Full name" value={profile.name} onChange={update(setProfile, "name")} required/>
                <Field label="Email address (login ID)" type="email" value={profile.email} onChange={() => { }} disabled/>
                <Field label="Mobile number" value={profile.phone} onChange={update(setProfile, "phone")} required/>
                <Field label="Designation" value={profile.designation} onChange={update(setProfile, "designation")} required/>
                <Field label="Account role" value={profile.role} onChange={() => { }} disabled/>
              </div>
              {formErrorBox}
            </Section>)}
          {validTab === "password" && (<Section title="Change password" subtitle="Update the password you use to sign in">
              <div className="max-w-xl space-y-5">
                <Field label="Current password" type={showPassword ? "text" : "password"} value={password.current} onChange={update(setPassword, "current")}/>
                <Field label="New password" type={showPassword ? "text" : "password"} value={password.next} onChange={update(setPassword, "next")}/>
                <Field label="Confirm new password" type={showPassword ? "text" : "password"} value={password.confirm} onChange={update(setPassword, "confirm")}/>
                <button type="button" onClick={() => setShowPassword((x) => !x)} className="inline-flex items-center gap-2 text-sm text-app-text-secondary">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>} {showPassword ? "Hide" : "Show"} passwords</button>
                <div><SaveButton label={saving ? "Updating..." : "Update password"} onClick={changePassword} disabled={saving}/></div>
              </div>
            </Section>)}
          {validTab === "notifications" && (<Section title="Notification preferences" subtitle="Saved to your platform settings" footer={<SaveButton onClick={() => saveSection("notifications", notifications, "Notification preferences")} disabled={saving || loading} label={saving ? "Saving..." : "Save changes"}/>}>
              {loadingNote}
              {[
                ["fund_requests", "Fund requests", "New retailer wallet top-up requests"],
                ["failure_spikes", "Verification failures", "Spikes in failed KYC checks and provider errors"],
                ["low_wallet_balance", "Low wallet balance", "Retailers falling below the configured balance"],
                ["daily_digest", "Daily reports", "Daily verification and revenue summaries"],
                ["retailer_onboarding", "Retailer onboarding", "New retailer accounts created on the platform"],
                ["sms_alerts", "SMS alerts", "Receive critical alerts by SMS"],
            ].map(([key, title, description]) => <RowSetting key={key} title={title} description={description} checked={notifications[key]} onChange={update(setNotifications, key)}/>)}
              <p className="mt-5 text-xs leading-5 text-app-text-muted">Note: these preferences are stored, but the backend does not yet use them to filter in-app notifications, emails or SMS.</p>
            </Section>)}
          {validTab === "providers" && (<Section title="API providers" subtitle="Provider connection settings stored on the server" footer={<SaveButton onClick={() => saveSection("providers", providers, "API provider settings")} disabled={saving || loading || !providers.length} label={saving ? "Saving..." : "Save changes"}/>}>
              {loadingNote}
              {!loading && !providers.length && <p className="py-8 text-center text-sm text-app-text-muted">No API providers configured.</p>}
              {providers.map((p, index) => <RowSetting key={p.id || index} title={p.service} description={[p.provider, p.auth_type, p.endpoint].filter(Boolean).join(" · ")} checked={p.status === "connected"} onChange={(on) => setProviders((old) => old.map((item, i) => i === index ? { ...item, status: on ? "connected" : "disconnected" } : item))}/>)}
              <p className="mt-5 flex items-start gap-2 rounded-lg bg-primary-light p-3 text-xs leading-5 text-app-text-secondary"><ShieldCheck size={17} className="shrink-0"/>These switches only update the stored provider configuration. To stop retailers from using a service, pause it in KYC Services. Provider keys must stay on the backend, never in frontend code or browser storage.</p>
            </Section>)}
          {validTab === "system" && (<Section title="System configuration" subtitle="General platform preferences" footer={<SaveButton onClick={saveSystem} disabled={saving || loading} label={saving ? "Saving..." : "Save changes"}/>}>
              {loadingNote}
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Default currency"><select value={system.currency ?? "INR"} onChange={(e) => update(setSystem, "currency")(e.target.value)} className="w-full rounded-lg border border-app-border bg-app-surface p-3 text-app-text"><option value="INR">INR (₹)</option></select></Field>
                <Field label="Timezone"><select value={system.timezone ?? "Asia/Kolkata"} onChange={(e) => update(setSystem, "timezone")(e.target.value)} className="w-full rounded-lg border border-app-border bg-app-surface p-3 text-app-text"><option value="Asia/Kolkata">Asia/Kolkata (IST)</option><option value="UTC">UTC</option></select></Field>
                <Field label="Session timeout (minutes)" type="number" value={system.session_timeout} onChange={update(setSystem, "session_timeout")}/>
                <Field label="Low wallet balance alert (₹)" type="number" value={system.low_balance_threshold} onChange={update(setSystem, "low_balance_threshold")}/>
              </div>
              <div className="mt-5"><RowSetting title="Maintenance mode" description="Stored setting only; the backend does not yet block requests when this is on" checked={!!system.maintenance_mode} onChange={update(setSystem, "maintenance_mode")}/></div>
            </Section>)}
          {validTab === "audit" && (<Section title="Audit activity" subtitle={`Recent administrative actions across the platform${audit.total > audit.rows.length ? ` · latest ${audit.rows.length} of ${audit.total}` : ""}`} footer={<button type="button" onClick={exportAudit} disabled={!audit.total} className="inline-flex items-center gap-2 rounded-lg border border-app-border px-4 py-2 text-sm font-semibold text-app-text-secondary disabled:opacity-50"><Download size={17}/>Export CSV</button>}>
              {auditError ? <div className="py-12 text-center text-sm text-red-600">{auditError}</div> : audit.rows.length === 0 ? <div className="py-12 text-center text-sm text-app-text-muted">{auditLoading || loading ? "Loading audit activity..." : "No audit activity recorded yet."}</div> : <div className="divide-y divide-app-border">{audit.rows.map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 py-4 text-sm"><span className="font-medium text-app-text">{entry.action} <span className="font-normal text-app-text-muted">· {entry.target}</span></span><span className="text-app-text-muted">{entry.actor} · {auditTime(entry.created_at)}</span></div>)}</div>}
            </Section>)}
          {validTab === "demo" && (<Section title="Demo data" subtitle="Platform data and settings are stored on the server">
              <div className="rounded-lg border border-app-border bg-primary-light p-4 text-sm leading-6 text-app-text-secondary">Settings, retailers, wallets and verifications now come from the backend database. The backend's demo reset re-runs the database seeder, which overwrites existing records with sample data, so it is not available from this screen.</div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" disabled title="No backend API to restore default settings" className="inline-flex items-center gap-2 rounded-lg border border-app-border px-4 py-3 text-sm font-semibold text-app-text-secondary opacity-50"><RefreshCcw size={17}/>Reset settings to defaults</button>
                <button type="button" disabled title="Audit logs cannot be cleared" className="inline-flex items-center gap-2 rounded-lg border border-app-border px-4 py-3 text-sm font-semibold text-danger opacity-50"><Trash2 size={17}/>Clear settings audit</button>
              </div>
              <p className="mt-5 text-xs text-app-text-muted">Restoring defaults and clearing the audit trail need backend support. Audit logs are kept permanently for compliance.</p>
            </Section>)}
        </div>
      </div>
    </div>);
}
