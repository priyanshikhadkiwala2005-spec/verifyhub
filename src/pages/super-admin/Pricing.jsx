import { useEffect, useMemo, useState } from "react";
import { Download, Save, Tags, UserRoundCog, RotateCcw, CheckCircle2, AlertCircle, Fingerprint, CreditCard, Landmark, FileSignature, X } from "lucide-react";

// Demo-only frontend state. Replace these localStorage reads/writes with API calls later.
const DEFAULT_SERVICES = [
  { id: "aadhaar", name: "Aadhaar", provider: 8, selling: 20, usage: 41, icon: Fingerprint, color: "text-violet-600 dark:text-violet-300", bg: "bg-violet-100 dark:bg-violet-950/50" },
  { id: "pan", name: "PAN", provider: 3.5, selling: 10, usage: 31, icon: CreditCard, color: "text-blue-600 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-950/50" },
  { id: "bank", name: "Bank", provider: 6, selling: 15, usage: 39, icon: Landmark, color: "text-sky-600 dark:text-sky-300", bg: "bg-sky-100 dark:bg-sky-950/50" },
  { id: "esign", name: "e-Sign", provider: 15, selling: 30, usage: 16, icon: FileSignature, color: "text-teal-600 dark:text-teal-300", bg: "bg-teal-100 dark:bg-teal-950/50" },
];
const RETAILERS = [
  { id: "RT1001", name: "Shree Ganesh Mobile Point", initials: "SG", color: "bg-blue-600", status: "Active" },
  { id: "RT1002", name: "Balaji Online Seva", initials: "BO", color: "bg-orange-600", status: "Active" },
  { id: "RT1003", name: "Annapurna Finserv Kendra", initials: "AF", color: "bg-pink-700", status: "Active" },
  { id: "RT1004", name: "Krishna CSC Centre", initials: "KC", color: "bg-violet-600", status: "Active" },
  { id: "RT1005", name: "Royal Enterprises", initials: "RE", color: "bg-teal-700", status: "Active" },
  { id: "RT1006", name: "Sai Digital Services", initials: "SD", color: "bg-indigo-600", status: "Active" },
  { id: "RT1007", name: "Metro Fintech Hub", initials: "MF", color: "bg-sky-600", status: "Active" },
  { id: "RT1008", name: "Om Sai Multiservices", initials: "OS", color: "bg-emerald-600", status: "Inactive" },
  { id: "RT1009", name: "Laxmi Money Point", initials: "LM", color: "bg-blue-700", status: "Active" },
  { id: "RT1010", name: "Vishal Digital Centre", initials: "VD", color: "bg-purple-700", status: "Active" },
  { id: "RT1011", name: "Bharat Seva Kendra", initials: "BS", color: "bg-indigo-700", status: "Inactive" },
  { id: "RT1012", name: "Green Valley Traders", initials: "GV", color: "bg-orange-700", status: "Active" },
];
const KEY_DEFAULTS = "verifyhub-pricing-defaults-v1";
const KEY_CUSTOM = "verifyhub-pricing-custom-v1";
const SEED_CUSTOM = { RT1003: { aadhaar: 18, pan: 9, bank: 14 }, RT1007: { pan: 9.5 } };
const rupees = (value) => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const formatAmount = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
function loadJson(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function Badge({ children, green = false }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${green ? "bg-emerald-50 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-app-surface-muted text-slate-600"}`}>{green && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}{children}</span>;
}
function ServiceIcon({ service }) {
  const Icon = service.icon;
  return <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${service.bg} ${service.color}`}>
          <Icon size={18} strokeWidth={1.8}/>
          </span>;
}
function Notice({ children, icon: Icon = FlaskConical }) {
  return <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-4 text-[13px] leading-6 text-app-text">
          <Icon size={19} className="mt-0.5 shrink-0 text-amber-600"/>
          <div>{children}</div>
          </div>;
}
function validateRates(services) {
  for (const service of services) {
    if (!Number.isFinite(Number(service.provider)) || Number(service.provider) < 0 || service.provider === "") return `${service.name}: enter a valid provider cost.`;
    if (!Number.isFinite(Number(service.selling)) || Number(service.selling) < 0 || service.selling === "") return `${service.name}: enter a valid selling price.`;
    if (Number(service.selling) < Number(service.provider)) return `${service.name}: selling price cannot be lower than provider cost.`;
  }
  return "";
}
export default function Pricing() {
  const [savedDefaults, setSavedDefaults] = useState(() => {
    const stored = loadJson(KEY_DEFAULTS, {});
    return DEFAULT_SERVICES.map((s) => ({ ...s, provider: stored[s.id]?.provider ?? s.provider, selling: stored[s.id]?.selling ?? s.selling }));
  });
  const [draftDefaults, setDraftDefaults] = useState(() => savedDefaults.map((s) => ({ ...s })));
  const [custom, setCustom] = useState(() => loadJson(KEY_CUSTOM, SEED_CUSTOM));
  const [retailerId, setRetailerId] = useState("RT1001");
  const [draftCustom, setDraftCustom] = useState({});
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [savePreview, setSavePreview] = useState(null);

  const notify = (message, error = false) => { setToast({ message, error }); };
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    const prices = {};
    savedDefaults.forEach((s) => { prices[s.id] = String(custom[retailerId]?.[s.id] ?? s.selling); });
    setDraftCustom(prices);
  }, [retailerId, custom, savedDefaults]);

  const totals = useMemo(() => draftDefaults.reduce((acc, s) => {
    const cost = Number(s.provider) || 0, price = Number(s.selling) || 0;
    acc.usage += s.usage;
    acc.revenue += s.usage * price;
    acc.margin += s.usage * (price - cost);
    return acc;
  }, { usage: 0, revenue: 0, margin: 0 }), [draftDefaults]);
  const customRows = useMemo(() => RETAILERS.filter((r) => Object.keys(custom[r.id] || {}).some((id) => {
    const service = savedDefaults.find((s) => s.id === id);
    return service && Number(custom[r.id][id]) !== Number(service.selling);
  })), [custom, savedDefaults]);
  const retailer = RETAILERS.find((r) => r.id === retailerId);
  const changeDefault = (id, key, value) => setDraftDefaults((prev) => prev.map((s) => s.id === id ? { ...s, [key]: value } : s));
  const saveDefaults = () => {
    const error = validateRates(draftDefaults);
    if (error) return notify(error, true);
    const next = draftDefaults.map((s) => ({ ...s, provider: Number(s.provider), selling: Number(s.selling) }));
    localStorage.setItem(KEY_DEFAULTS, JSON.stringify(Object.fromEntries(next.map((s) => [s.id, { provider: s.provider, selling: s.selling }]))));
    setSavedDefaults(next);
    setDraftDefaults(next.map((s) => ({ ...s })));
    notify("Default rate card saved successfully (demo only).");
  };
  const saveCustom = () => {
    const entries = {};
    for (const s of savedDefaults) {
      const price = Number(draftCustom[s.id]);
      if (draftCustom[s.id] === "" || !Number.isFinite(price) || price < 0) return notify(`${s.name}: enter a valid selling price.`, true);
      if (price < Number(s.provider)) return notify(`${s.name}: selling price cannot be lower than provider cost.`, true);
      if (Math.abs(price - Number(s.selling)) > 0.00001) entries[s.id] = price;
    }
    setSavePreview({ retailerId, retailerName: retailer.name, entries,
      rows: savedDefaults.map((s) => ({ id: s.id, name: s.name, price: Number(draftCustom[s.id]), isDefault: entries[s.id] === undefined }))
    });
  };
  const confirmSaveCustom = () => {
    if (!savePreview) return;
    const next = { ...custom };
    if (Object.keys(savePreview.entries).length) next[savePreview.retailerId] = savePreview.entries;
    else delete next[savePreview.retailerId];
    localStorage.setItem(KEY_CUSTOM, JSON.stringify(next));
    setCustom(next);
    notify(`Pricing saved for ${savePreview.retailerName} (demo only).`);
    setSavePreview(null);
  };
  const resetCustom = () => setConfirm({
    message: `Reset all custom prices for ${retailer.name} to the default rate card?`,
    action: () => {
      const next = { ...custom };
      delete next[retailerId];
      localStorage.setItem(KEY_CUSTOM, JSON.stringify(next));
      setCustom(next);
      setDraftCustom(Object.fromEntries(savedDefaults.map((s) => [s.id, String(s.selling)])));
      setConfirm(null);
      notify("Retailer prices reset to defaults.");
    }
  });
  const exportCsv = () => {
    const quote = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const rows = [["Type", "Retailer ID", "Retailer", "Service", "Provider cost (INR)", "Selling price (INR)", "Margin (INR)"]];
    savedDefaults.forEach((s) => rows.push(["Default", "", "All retailers", s.name, s.provider, s.selling, s.selling - s.provider]));
    customRows.forEach((r) => savedDefaults.forEach((s) => {
      const price = custom[r.id]?.[s.id] ?? s.selling;
      rows.push(["Retailer", r.id, r.name, s.name, s.provider, price, Number(price) - Number(s.provider)]);
    }));
    const csv = rows.map((row) => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "verifyhub-pricing-rate-card.csv"; a.click(); URL.revokeObjectURL(url);
    notify("Rate card exported as CSV.");
  };
  const inputStyle = "h-10 w-full min-w-0 rounded-lg border border-app-border bg-app-surface px-3 text-right text-[14px] text-app-text outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  return <div className="min-w-0 bg-app-background text-app-text">
 
    <div className="space-y-6 px-4 py-7 sm:px-7 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight sm:text-[26px]">Pricing management</h1>
          <p className="mt-1 text-[14px] text-app-text-secondary">Set default selling prices and per-retailer rate cards.</p>
          </div>
        <button type="button" onClick={exportCsv} className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-app-border bg-app-surface px-5 text-[13px] font-semibold shadow-sm hover:bg-app-surface-muted">
          <Download size={18}/>Export rate card</button>
      </div>
      

      {/* Default rate card */}
      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-app-border px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3">
          <Tags size={20} className="mt-1 text-[#2853ef]"/>
          <div>
          <h2 className="text-[17px] font-bold">Default rate card</h2>
          <p className="mt-1 text-[13px] text-app-text-secondary">Applied to every retailer without a custom price</p>
          </div>
          </div>
          <button type="button" onClick={saveDefaults} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#2c52e8] px-4 text-[13px] font-semibold text-white hover:bg-[#2144cb]">
          <Save size={17}/>Save defaults</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-[13px]">
            <thead className="bg-app-surface-muted text-left text-[11px] uppercase tracking-wide text-app-text-muted">
          <tr>{["Service", "Provider cost (₹)", "Retailer selling price (₹)", "Gross margin", "Usage (30d)", "Est. monthly revenue", "Est. monthly margin"].map((x) => <th key={x} className="whitespace-nowrap px-5 py-4 font-bold">{x}</th>)}</tr>
          </thead>
            <tbody>{draftDefaults.map((s) => { const margin = (Number(s.selling) || 0) - (Number(s.provider) || 0); const pct = Number(s.selling) > 0 ? (margin / Number(s.selling)) * 100 : 0; return <tr key={s.id} className="border-t border-app-border">
              <td className="px-5 py-4">
          <div className="flex items-center gap-2 whitespace-nowrap">
          <ServiceIcon service={s}/>
          <strong>{s.name}</strong>
          </div>
          </td>
              <td className="px-5 py-3">
          <input aria-label={`${s.name} provider cost`} className={`${inputStyle} max-w-[122px]`} type="number" min="0" step="0.01" value={s.provider} onChange={(e) => changeDefault(s.id, "provider", e.target.value)}/>
          </td>
              <td className="px-5 py-3">
          <input aria-label={`${s.name} selling price`} className={`${inputStyle} max-w-[122px]`} type="number" min="0" step="0.01" value={s.selling} onChange={(e) => changeDefault(s.id, "selling", e.target.value)}/>
          </td>
              <td className={`whitespace-nowrap px-5 py-4 font-bold ${margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{rupees(margin)} · {Math.round(pct)}%</td>
              <td className="px-5 py-4 text-center">{s.usage}</td>
          <td className="px-5 py-4 text-right">{rupees(s.usage * (Number(s.selling) || 0))}</td>
          <td className="px-5 py-4 text-right">{rupees(s.usage * margin)}</td>
            </tr>; })}</tbody>
            <tfoot>
          <tr className="border-t border-app-border bg-app-surface-muted font-bold">
          <td colSpan={4} className="px-5 py-4">Total</td>
          <td className="px-5 py-4 text-center">{totals.usage}</td>
          <td className="px-5 py-4 text-right">{rupees(totals.revenue)}</td>
          <td className="px-5 py-4 text-right">{rupees(totals.margin)}</td>
          </tr>
          </tfoot>
          </table>
        </div>
      </section>


      {/* Retailer-specific pricing */}
      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-app-border px-5 py-5 md:flex-row md:items-center sm:px-6">
          <div className="flex items-start gap-3">
          <UserRoundCog size={20} className="mt-1 text-[#2853ef]"/>
          <div>
          <h2 className="text-[17px] font-bold">Retailer-specific pricing</h2>
          <p className="mt-1 text-[13px] text-app-text-secondary">Override the default rate for an individual retailer (e.g. volume slabs)</p>
          </div>
          </div>
          <select aria-label="Choose retailer" value={retailerId} onChange={(e) => setRetailerId(e.target.value)} className="h-12 w-full rounded-xl border border-app-border bg-app-surface px-4 text-[14px] outline-none focus:border-blue-500 md:max-w-[385px]">{RETAILERS.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.id}</option>)}</select>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          {savedDefaults.map((s) => { const price = Number(draftCustom[s.id]) || 0; const margin = price - Number(s.provider); const pct = price > 0 ? Math.round(margin / price * 100) : 0; const overridden = draftCustom[s.id] !== "" && Number(draftCustom[s.id]) !== Number(s.selling);
            return <div key={s.id} className="min-w-0 rounded-xl border border-[#e0e7f2] bg-app-surface-muted p-4">
              <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
          <ServiceIcon service={s}/>
          <strong className="text-[13px]">{s.name}</strong>
          </div>
          <Badge>{overridden ? "Custom" : "Default"}</Badge>
          </div>
              <label className="mb-2 mt-4 block text-[12px] font-semibold text-app-text-secondary" htmlFor={`price-${s.id}`}>Selling price for this retailer</label>
              <div className="flex h-12 overflow-hidden rounded-lg border border-app-border bg-app-surface focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <span className="flex items-center border-r border-app-border bg-app-surface-muted px-3 text-app-text-secondary">₹</span>
          <input id={`price-${s.id}`} type="number" min="0" step="0.01" value={draftCustom[s.id] ?? ""} onChange={(e) => setDraftCustom((p) => ({ ...p, [s.id]: e.target.value }))} className="w-full min-w-0 bg-transparent px-3 text-[14px] outline-none"/>
          </div>
              <div className="mt-4 space-y-4 text-[13px]">
          <div className="flex justify-between gap-2">
          <span className="text-app-text-secondary">Default price</span>
          <strong>{rupees(s.selling)}</strong>
          </div>
          <div className="flex justify-between gap-2">
          <span className="text-app-text-secondary">Provider cost</span>
          <strong>{rupees(s.provider)}</strong>
          </div>
          <div className="flex justify-between gap-2">
          <span className="text-app-text-secondary">Gross margin</span>
          <strong className={margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{rupees(margin)} ({pct}%)</strong>
          </div>
          </div>
            </div>;
          })}
        </div>
        <div className="flex flex-col justify-end gap-3 border-t border-app-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <button type="button" onClick={resetCustom} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-app-text-secondary hover:bg-app-surface-muted">
          <RotateCcw size={17}/>Reset to defaults</button>
          <button type="button" onClick={saveCustom} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2c52e8] px-5 text-[13px] font-semibold text-white hover:bg-[#2144cb]">
          <Save size={17}/>Save retailer pricing</button>
          </div>
      </section>


      {/* Active custom rate cards */}
      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        <div className="flex items-start gap-3 border-b border-app-border px-5 py-5 sm:px-6">
          <Tags size={19} className="mt-1 text-[#2853ef]"/>
          <div>
          <h2 className="text-[17px] font-bold">Active custom rate cards</h2>
          <p className="mt-1 text-[13px] text-app-text-secondary">Retailers currently billed at non-default prices</p>
          </div>
          </div>
        {customRows.length ? <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-[13px]">
          <thead className="bg-app-surface-muted text-left text-[11px] uppercase tracking-wide text-app-text-muted">
          <tr>
          <th className="px-5 py-4">Retailer</th>{savedDefaults.map((s) => <th key={s.id} className="px-5 py-4 text-center">{s.name}</th>)}<th className="px-5 py-4">Status</th>
          </tr>
          </thead>
          <tbody>{customRows.map((r) => <tr key={r.id} className="border-t border-app-border">
          <td className="px-5 py-4">
          <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white ${r.color}`}>{r.initials}</span>
          <div>
          <div className="whitespace-nowrap font-semibold">{r.name}</div>
          <div className="mt-1 text-xs text-app-text-muted">{r.id}</div>
          </div>
          </div>
          </td>{savedDefaults.map((s) => { const overridden = custom[r.id]?.[s.id] !== undefined && Number(custom[r.id][s.id]) !== Number(s.selling); return <td key={s.id} className={`px-5 py-4 text-center ${overridden ? "font-bold" : "text-app-text-secondary"}`}>{rupees(overridden ? custom[r.id][s.id] : s.selling)}</td>; })}<td className="px-5 py-4">
          <Badge green={r.status === "Active"}>{r.status}</Badge>
          </td>
          </tr>)}</tbody>
          </table>
          </div> : <div className="px-6 py-10 text-center text-[13px] text-app-text-secondary">No custom rate cards. All retailers are using default prices.</div>}
      </section>
    </div>

    {savePreview && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#111c35]/55 p-4 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) setSavePreview(null); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="save-pricing-title" className="w-full max-w-[550px] overflow-hidden rounded-[22px] border border-app-border bg-app-surface shadow-2xl">
        <div className="flex items-start gap-4 border-b border-app-border px-5 py-5 sm:px-7">
          <div className="flex h-[52px] w-[120px] shrink-0 items-center justify-center rounded-xl bg-[#edf1ff] text-[#2751e9] sm:w-[180px]">
          <UserRoundCog size={22}/>
          </div>
          <div className="min-w-0 flex-1">
          <h3 id="save-pricing-title" className="text-[19px] font-bold leading-7 text-app-text">Save retailer<br/>pricing?</h3>
          </div>
          <button type="button" aria-label="Close popup" onClick={() => setSavePreview(null)} className="rounded-lg p-1 text-app-text-secondary hover:bg-app-surface-muted">
          <X size={20}/>
          </button>
        </div>
        <div className="px-5 py-6 sm:px-7">
          <p className="mb-4 text-[15px] leading-7 text-app-text-secondary">Rate card for <strong>{savePreview.retailerName}</strong> will apply from the next verification.</p>
          <div className="rounded-xl border border-app-border bg-app-surface-muted px-4">
            {savePreview.rows.map((row, index) => <div key={row.id} className={`flex items-center justify-between gap-4 py-3 text-[14px] ${index ? "border-t border-dashed border-app-border" : ""}`}>
          <span className="text-app-text-secondary">{row.name}</span>
          <strong className="text-right text-app-text">{rupees(row.price)}{row.isDefault ? " · default" : " · custom"}</strong>
          </div>)}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-app-border bg-app-surface-muted px-5 py-4 sm:px-7">
          <button type="button" onClick={() => setSavePreview(null)} className="rounded-lg border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-text shadow-sm hover:bg-app-surface-muted">Cancel</button>
          <button type="button" onClick={confirmSaveCustom} className="rounded-lg bg-[#2c52e8] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#2144cb]">Save pricing</button>
        </div>
      </div>
    </div>}
    {toast && <div role="status" className={`fixed bottom-5 right-5 z-[110] flex max-w-[min(430px,calc(100vw-30px))] items-start gap-3 rounded-xl border bg-app-surface px-4 py-3 text-[13px] shadow-xl ${toast.error ? "border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" : "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"}`}>{toast.error ? <AlertCircle size={19} className="shrink-0"/> : <CheckCircle2 size={19} className="shrink-0"/>}<span>{toast.message}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)} className="ml-1">
          <X size={16}/>
          </button>
          </div>}
    {confirm && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111c35]/55 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div role="dialog" aria-modal="true" aria-label="Reset custom pricing" className="w-full max-w-[440px] rounded-2xl bg-app-surface p-6 shadow-2xl">
          <h3 className="text-lg font-bold">Reset retailer pricing?</h3>
          <p className="mt-3 text-sm leading-6 text-app-text-secondary">{confirm.message}</p>
          <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirm(null)} className="rounded-lg border border-app-border px-4 py-2 text-sm font-semibold">Cancel</button>
          <button type="button" onClick={confirm.action} className="rounded-lg bg-[#2c52e8] px-4 py-2 text-sm font-semibold text-white">Reset prices</button>
          </div>
          </div>
          </div>}
  </div>;
}
