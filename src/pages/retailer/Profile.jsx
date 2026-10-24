import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, Fingerprint, CreditCard, Landmark, FilePenLine, LogOut, Save, X, Eye, EyeOff, CheckCircle2, AlertCircle, Store, UserRound } from "lucide-react";

const STORAGE_KEY = "verifyhub-retailer-profile-v1";
const DEFAULT_PROFILE = {
  shopName: "Shree Ganesh Mobile Point",
  ownerName: "Rakesh Patel",
  mobile: "9824047872",
  email: "retailer@verifyhub.demo",
  address: "Shop 48, Station Road, Bharuch, Gujarat - 711188",
  pan: "BKXXXXXX82A",
  gstin: "24BKYPP7082A1Z4",
};
const services = [
  { name: "Aadhaar verification", used: 38, price: 20, icon: Fingerprint, color: "bg-violet-50 text-violet-600" },
  { name: "PAN verification", used: 36, price: 10, icon: CreditCard, color: "bg-indigo-50 text-indigo-600" },
  { name: "Bank verification", used: 26, price: 15, icon: Landmark, color: "bg-sky-50 text-sky-600" },
  { name: "e-Sign verification", used: 19, price: 30, icon: FilePenLine, color: "bg-teal-50 text-teal-600" },
];
function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved && typeof saved === "object" ? { ...DEFAULT_PROFILE, ...saved, pan: DEFAULT_PROFILE.pan } : DEFAULT_PROFILE;
  } catch { return DEFAULT_PROFILE; }
}
function Field({ label, hint, required, children }) {
  return <label className="block min-w-0">
    <span className="mb-2 flex items-center justify-between gap-2 text-[12px] font-medium text-[#52617e]">
      <span>{label}{required && <span className="ml-1 text-red-500">*</span>}</span>
      {hint && <span className="text-[11px] font-normal text-[#8d9ab3]">{hint}</span>}
    </span>
    {children}
  </label>;
}
const inputClass = "w-full min-w-0 rounded-lg border border-[#d6dfed] bg-white px-3.5 py-3 text-[13px] text-[#15213e] outline-none transition placeholder:text-[#9aa6bb] focus:border-[#3155ed] focus:ring-2 focus:ring-[#3155ed]/10 dark:border-app-border dark:bg-app-surface dark:text-app-text";

export default function Profile() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(loadProfile);
  const [form, setForm] = useState(loadProfile);
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showSignout, setShowSignout] = useState(false);
  const [sessionStart] = useState(() => {
    const key = "verifyhub-retailer-session-start";
    const old = sessionStorage.getItem(key);
    if (old) return old;
    const value = new Date().toISOString();
    sessionStorage.setItem(key, value);
    return value;
  });

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    if (!showSignout) return;
    const close = (event) => event.key === "Escape" && setShowSignout(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [showSignout]);

  const update = (field, value) => setForm((old) => ({ ...old, [field]: value }));
  const saveChanges = (event) => {
    event.preventDefault();
    if (!form.shopName.trim() || !form.ownerName.trim() || !form.address.trim()) {
      setNotice({ type: "error", message: "Please fill in shop name, owner name and business address." }); return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      setNotice({ type: "error", message: "Enter a valid 10-digit mobile number." }); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setNotice({ type: "error", message: "Enter a valid email address." }); return;
    }
    if (form.gstin && !/^[0-9A-Z]{15}$/.test(form.gstin.trim().toUpperCase())) {
      setNotice({ type: "error", message: "GSTIN must contain 15 letters/numbers." }); return;
    }
    const clean = { ...form, shopName: form.shopName.trim(), ownerName: form.ownerName.trim(), email: form.email.trim(), address: form.address.trim(), gstin: form.gstin.trim().toUpperCase(), pan: DEFAULT_PROFILE.pan };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    setSaved(clean); setForm(clean);
    setNotice({ type: "success", message: "Profile changes saved in this browser." });
  };
  const changePassword = (event) => {
    event.preventDefault();
    if (!password.current || !password.next || !password.confirm) {
      setNotice({ type: "error", message: "Please fill in all password fields." }); return;
    }
    if (password.next.length < 8) {
      setNotice({ type: "error", message: "New password must be at least 8 characters." }); return;
    }
    if (password.next !== password.confirm) {
      setNotice({ type: "error", message: "New password and confirmation do not match." }); return;
    }
    setPassword({ current: "", next: "", confirm: "" });
    setNotice({ type: "success", message: "Demo validation passed. Password was not changed because authentication is not connected." });
  };
  const signOut = () => {
    setShowSignout(false);
    sessionStorage.removeItem("verifyhub-retailer-session-start");
    navigate("/", { replace: true });
  };
  return <div className="min-h-screen bg-app-background px-4 py-6 font-poppins text-app-text sm:px-6 lg:px-7">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-[24px] font-bold leading-tight text-app-text">My profile</h1><p className="mt-1 text-[13px] text-app-text-secondary">Manage your business details and account security.</p></div>
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700">● Active retailer</span>
    </div>
    {notice && <div role="status" className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-[13px] ${notice.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
      {notice.type === "error" ? <AlertCircle size={18} className="shrink-0"/> : <CheckCircle2 size={18} className="shrink-0"/>}<span className="flex-1">{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={17}/></button>
    </div>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(290px,1fr)]">
      <div className="min-w-0 space-y-5">
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-app-border px-5 py-4 sm:px-6"><Store size={18} className="text-[#3155ed]"/><h2 className="text-[15px] font-semibold">Business details</h2></div>
          <form onSubmit={saveChanges}>
            <div className="grid gap-x-4 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
              <Field label="Business / shop name" required><input className={inputClass} value={form.shopName} onChange={(e) => update("shopName", e.target.value)}/></Field>
              <Field label="Owner name" required><input className={inputClass} value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)}/></Field>
              <Field label="Mobile number" required><div className="flex overflow-hidden rounded-lg border border-[#d6dfed] bg-white focus-within:border-[#3155ed] dark:border-app-border dark:bg-app-surface"><span className="flex items-center border-r border-[#d6dfed] px-3 text-[13px] font-semibold text-[#52617e] dark:border-app-border">+91</span><input inputMode="numeric" maxLength={10} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[13px] text-[#15213e] outline-none dark:text-app-text" value={form.mobile} onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}/></div></Field>
              <Field label="Email address" required><input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)}/></Field>
              <div className="sm:col-span-2"><Field label="Business address" required><textarea rows={3} className={`${inputClass} resize-y`} value={form.address} onChange={(e) => update("address", e.target.value)}/></Field></div>
              <Field label="PAN" hint="Locked · contact admin"><input readOnly aria-readonly="true" title="Contact admin to update PAN" className={`${inputClass} cursor-not-allowed bg-[#f4f6f9] text-[#61708b] dark:bg-app-background`} value={saved.pan}/></Field>
              <Field label="GSTIN" hint="Optional"><input maxLength={15} className={inputClass} value={form.gstin} onChange={(e) => update("gstin", e.target.value.toUpperCase())}/></Field>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-app-border px-5 py-4 sm:px-6">
              <button type="button" onClick={() => {setForm(saved);setNotice(null);}} className="rounded-lg px-5 py-2.5 text-[13px] font-semibold text-app-text-secondary transition hover:bg-app-background">Discard</button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#2e50e9] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#2342ce]"><Save size={16}/>Save changes</button>
            </div>
          </form>
        </section>
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-app-border px-5 py-4 sm:px-6"><KeyRound size={18} className="text-[#3155ed]"/><h2 className="text-[15px] font-semibold">Change password</h2></div>
          <form onSubmit={changePassword} className="p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Current password"><input autoComplete="current-password" type={showPassword ? "text" : "password"} className={inputClass} value={password.current} onChange={(e) => setPassword((p) => ({...p,current:e.target.value}))}/></Field></div>
              <Field label="New password"><input autoComplete="new-password" type={showPassword ? "text" : "password"} className={inputClass} value={password.next} onChange={(e) => setPassword((p) => ({...p,next:e.target.value}))}/></Field>
              <Field label="Confirm new password"><input autoComplete="new-password" type={showPassword ? "text" : "password"} className={inputClass} value={password.confirm} onChange={(e) => setPassword((p) => ({...p,confirm:e.target.value}))}/></Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setShowPassword((v) => !v)} className="inline-flex items-center gap-2 text-[12px] text-app-text-secondary">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>} {showPassword ? "Hide passwords" : "Show passwords"}</button><button type="submit" className="rounded-lg bg-[#2e50e9] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2342ce]">Update password</button></div>
            <p className="mt-4 text-[11px] text-app-text-muted">Demo only: password changes require backend authentication.</p>
          </form>
        </section>
      </div>
      <div className="min-w-0 space-y-5">
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-app-border px-5 py-4"><Shield size={18} className="text-[#3155ed]"/><h2 className="text-[15px] font-semibold">Available KYC services</h2></div>
          {services.map((service) => { const Icon = service.icon; return <div key={service.name} className="flex items-center gap-3 border-b border-app-border px-5 py-4 last:border-b-0"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${service.color}`}><Icon size={20}/></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-app-text">{service.name}</p><p className="mt-1 text-[11px] text-app-text-secondary">{service.used} used · available</p></div><div className="text-right"><p className="text-[13px] font-bold text-app-text">₹{service.price}</p><span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">● Active</span></div></div>; })}
        </section>
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-app-border px-5 py-4"><Shield size={18} className="text-[#3155ed]"/><h2 className="text-[15px] font-semibold">Account security</h2></div>
          <div className="space-y-0 px-5 py-4 text-[12px]">
            <div className="flex justify-between gap-3 border-b border-app-border py-3"><span className="text-app-text-secondary">Current session started</span><span className="text-right font-semibold">{new Date(sessionStart).toLocaleString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"numeric", minute:"2-digit", hour12:true })}</span></div>
            <div className="flex justify-between gap-3 border-b border-app-border py-3"><span className="text-app-text-secondary">Login ID</span><span className="break-all text-right font-semibold">re•••@verifyhub.demo</span></div>
            <div className="flex items-center justify-between gap-3 py-3"><span className="text-app-text-secondary">Two-factor auth</span><span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-800">● Not enabled</span></div>
            <button type="button" onClick={() => setShowSignout(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-app-border px-3 py-3 font-semibold text-app-text transition hover:bg-app-background"><LogOut size={16}/>Sign out of all devices</button>
            <p className="mt-2 text-center text-[10px] text-app-text-muted">Demo: signs out this browser only.</p>
          </div>
        </section>
      </div>
    </div>
    {showSignout && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0d1730]/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && setShowSignout(false)}><div role="dialog" aria-modal="true" aria-labelledby="signout-title" className="w-full max-w-[440px] rounded-2xl bg-white p-6 text-[#15213e] shadow-2xl"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#eef1ff] p-3 text-[#3155ed]"><LogOut size={22}/></span><h2 id="signout-title" className="text-[18px] font-bold">Sign out?</h2></div><button type="button" aria-label="Close" onClick={() => setShowSignout(false)}><X size={20}/></button></div><p className="mt-5 text-[13px] leading-6 text-[#61708b]">This demo will return you to the login page. Other devices cannot be signed out until backend session management is connected.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowSignout(false)} className="rounded-lg border border-[#d6dfed] px-4 py-2.5 text-[13px] font-semibold">Cancel</button><button type="button" onClick={signOut} className="rounded-lg bg-[#2e50e9] px-4 py-2.5 text-[13px] font-semibold text-white">Sign out</button></div></div></div>}
  </div>;
}
