import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Save, Tags, UserRoundCog, RotateCcw, CheckCircle2, AlertCircle, Fingerprint, CreditCard, Landmark, FileSignature, X, RefreshCw } from "lucide-react";
import api, { getErrorMessage } from "../../api";

// Data: GET /admin/pricing · defaults: POST /admin/pricing/defaults
// retailer override: POST /admin/pricing/override · reset: DELETE /admin/pricing/override/{retailerId}
const SERVICE_META = {
  aadhaar: { order: 1, name: "Aadhaar", icon: Fingerprint, color: "text-violet-600 dark:text-violet-300", bg: "bg-violet-100 dark:bg-violet-950/50" },
  pan: { order: 2, name: "PAN", icon: CreditCard, color: "text-blue-600 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-950/50" },
  bank: { order: 3, name: "Bank", icon: Landmark, color: "text-sky-600 dark:text-sky-300", bg: "bg-sky-100 dark:bg-sky-950/50" },
  esign: { order: 4, name: "e-Sign", icon: FileSignature, color: "text-teal-600 dark:text-teal-300", bg: "bg-teal-100 dark:bg-teal-950/50" },
};
const AVATAR_COLORS = ["bg-blue-600", "bg-orange-600", "bg-pink-700", "bg-violet-600", "bg-teal-700", "bg-indigo-600", "bg-sky-600", "bg-emerald-600"];
const toService = (svc) => ({
  order: 99, icon: Tags, color: "text-blue-600 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-950/50",
  ...SERVICE_META[svc.id],
  id: svc.id,
  name: SERVICE_META[svc.id]?.name ?? svc.short ?? svc.name,
  provider: Number(svc.provider_cost) || 0,
  selling: Number(svc.price) || 0,
  usage: Number(svc.usage_30d) || 0,
});
const toRetailer = (r, index) => ({
  id: r.id,
  name: r.shop,
  initials: String(r.shop || "").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase(),
  color: AVATAR_COLORS[index % AVATAR_COLORS.length],
  status: r.status === "active" ? "Active" : "Inactive",
});
const rupees = (value) => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
function Badge({ children, green = false }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${green ? "bg-emerald-50 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-app-surface-muted text-slate-600"}`}>{green && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}{children}</span>;
}
function ServiceIcon({ service }) {
  const Icon = service.icon;
  return <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${service.bg} ${service.color}`}>
          <Icon size={18} strokeWidth={1.8}/>
          </span>;
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
  const [savedDefaults, setSavedDefaults] = useState([]);
  const [draftDefaults, setDraftDefaults] = useState([]);
  const [custom, setCustom] = useState({});
  const [retailers, setRetailers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  // Only the prices the admin has typed; untouched fields fall back to the saved custom/default price.
  const [draftCustom, setDraftCustom] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [savePreview, setSavePreview] = useState(null);

  const notify = (message, error = false) => { setToast({ message, error }); };
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t); }, [toast]);

  const loadPricing = useCallback(() => api.get("/admin/pricing")
    .then(({ data }) => {
      const services = (data?.data?.services ?? []).map(toService).sort((a, b) => a.order - b.order);
      setSavedDefaults(services);
      setDraftDefaults(services.map((s) => ({ ...s })));
      setCustom(data?.data?.overrides ?? {});
      setRetailers((data?.data?.retailers ?? []).map(toRetailer));
      setDraftCustom({});
      setLoadError("");
    })
    .catch((err) => setLoadError(getErrorMessage(err, "Unable to load pricing.")))
    .finally(() => setLoading(false)), []);

  useEffect(() => { loadPricing(); }, [loadPricing]);

  const retry = () => { setLoading(true); setLoadError(""); loadPricing(); };
  const retailerId = retailers.some((r) => r.id === selectedId) ? selectedId : retailers[0]?.id ?? "";
  const selectRetailer = (id) => { setSelectedId(id); setDraftCustom({}); };
  const customValue = (s) => draftCustom[s.id] ?? String(custom[retailerId]?.[s.id] ?? s.selling);

  const totals = useMemo(() => draftDefaults.reduce((acc, s) => {
    const cost = Number(s.provider) || 0, price = Number(s.selling) || 0;
    acc.usage += s.usage;
    acc.revenue += s.usage * price;
    acc.margin += s.usage * (price - cost);
    return acc;
  }, { usage: 0, revenue: 0, margin: 0 }), [draftDefaults]);
  const customRows = useMemo(() => retailers.filter((r) => Object.keys(custom[r.id] || {}).some((id) => {
    const service = savedDefaults.find((s) => s.id === id);
    return service && Number(custom[r.id][id]) !== Number(service.selling);
  })), [custom, savedDefaults, retailers]);
  const retailer = retailers.find((r) => r.id === retailerId);
  const changeDefault = (id, key, value) => setDraftDefaults((prev) => prev.map((s) => s.id === id ? { ...s, [key]: value } : s));
  const saveDefaults = async () => {
    if (saving || !draftDefaults.length) return;
    const error = validateRates(draftDefaults);
    if (error) return notify(error, true);
    setSaving(true);
    try {
      const { data } = await api.post("/admin/pricing/defaults", {
        rates: draftDefaults.map((s) => ({ id: s.id, provider_cost: Number(s.provider), price: Number(s.selling) })),
      });
      notify(data?.message || "Default rate card saved successfully.");
      await loadPricing();
    } catch (err) {
      notify(getErrorMessage(err, "Unable to save the default rate card."), true);
    } finally {
      setSaving(false);
    }
  };
  const saveCustom = () => {
    if (!retailer) return;
    const entries = {};
    for (const s of savedDefaults) {
      const value = customValue(s);
      const price = Number(value);
      if (value === "" || !Number.isFinite(price) || price < 0) return notify(`${s.name}: enter a valid selling price.`, true);
      if (price < Number(s.provider)) return notify(`${s.name}: selling price cannot be lower than provider cost.`, true);
      if (Math.abs(price - Number(s.selling)) > 0.00001) entries[s.id] = price;
    }
    setSavePreview({ retailerId, retailerName: retailer.name, entries,
      rows: savedDefaults.map((s) => ({ id: s.id, name: s.name, price: Number(customValue(s)), isDefault: entries[s.id] === undefined }))
    });
  };
  const confirmSaveCustom = async () => {
    if (!savePreview || saving) return;
    setSaving(true);
    try {
      // Every service is sent; the backend drops overrides that equal the default price.
      const prices = Object.fromEntries(savePreview.rows.map((row) => [row.id, row.price]));
      const { data } = await api.post("/admin/pricing/override", { retailer_id: savePreview.retailerId, prices });
      notify(data?.message || `Pricing saved for ${savePreview.retailerName}.`);
      setSavePreview(null);
      await loadPricing();
    } catch (err) {
      notify(getErrorMessage(err, "Unable to save retailer pricing."), true);
      setSavePreview(null);
    } finally {
      setSaving(false);
    }
  };
  const resetCustom = () => retailer && setConfirm({
    message: `Reset all custom prices for ${retailer.name} to the default rate card?`,
    action: async () => {
      if (saving) return;
      setSaving(true);
      try {
        const { data } = await api.delete(`/admin/pricing/override/${retailerId}`);
        notify(data?.message || "Retailer prices reset to defaults.");
        setConfirm(null);
        await loadPricing();
      } catch (err) {
        notify(getErrorMessage(err, "Unable to reset retailer pricing."), true);
        setConfirm(null);
      } finally {
        setSaving(false);
      }
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

      {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          <span>{loadError}</span>
          <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-100"><RefreshCw size={15}/>Retry</button>
          </div>}


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
          <button type="button" onClick={saveDefaults} disabled={saving || !draftDefaults.length} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#2c52e8] px-4 text-[13px] font-semibold text-white hover:bg-[#2144cb] disabled:opacity-60">
          <Save size={17}/>{saving ? "Saving..." : "Save defaults"}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-[13px]">
            <thead className="bg-app-surface-muted text-left text-[11px] uppercase tracking-wide text-app-text-muted">
          <tr>{["Service", "Provider cost (₹)", "Retailer selling price (₹)", "Gross margin", "Usage (30d)", "Est. monthly revenue", "Est. monthly margin"].map((x) => <th key={x} className="whitespace-nowrap px-5 py-4 font-bold">{x}</th>)}</tr>
          </thead>
            <tbody>{!draftDefaults.length && <tr><td colSpan={7} className="px-5 py-10 text-center text-app-text-secondary">{loading ? "Loading rate card..." : "No KYC services found."}</td></tr>}{draftDefaults.map((s) => { const margin = (Number(s.selling) || 0) - (Number(s.provider) || 0); const pct = Number(s.selling) > 0 ? (margin / Number(s.selling)) * 100 : 0; return <tr key={s.id} className="border-t border-app-border">
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
          <select aria-label="Choose retailer" value={retailerId} disabled={!retailers.length} onChange={(e) => selectRetailer(e.target.value)} className="h-12 w-full rounded-xl border border-app-border bg-app-surface px-4 text-[14px] outline-none focus:border-blue-500 md:max-w-[385px]">{retailers.length ? retailers.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.id}</option>) : <option value="">{loading ? "Loading retailers..." : "No retailers found"}</option>}</select>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          {retailer && savedDefaults.map((s) => { const value = customValue(s); const price = Number(value) || 0; const margin = price - Number(s.provider); const pct = price > 0 ? Math.round(margin / price * 100) : 0; const overridden = value !== "" && Number(value) !== Number(s.selling);
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
          <input id={`price-${s.id}`} type="number" min="0" step="0.01" value={value} onChange={(e) => setDraftCustom((p) => ({ ...p, [s.id]: e.target.value }))} className="w-full min-w-0 bg-transparent px-3 text-[14px] outline-none"/>
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
          {!retailer && <p className="text-[13px] text-app-text-secondary sm:col-span-2 xl:col-span-4">{loading ? "Loading retailers..." : "No retailers found. Add a retailer to set custom pricing."}</p>}
        </div>
        <div className="flex flex-col justify-end gap-3 border-t border-app-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <button type="button" onClick={resetCustom} disabled={saving || !retailer || !custom[retailerId]} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-app-text-secondary hover:bg-app-surface-muted disabled:opacity-50">
          <RotateCcw size={17}/>Reset to defaults</button>
          <button type="button" onClick={saveCustom} disabled={saving || !retailer} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2c52e8] px-5 text-[13px] font-semibold text-white hover:bg-[#2144cb] disabled:opacity-60">
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
          <button type="button" disabled={saving} onClick={() => setSavePreview(null)} className="rounded-lg border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-text shadow-sm hover:bg-app-surface-muted">Cancel</button>
          <button type="button" disabled={saving} onClick={confirmSaveCustom} className="rounded-lg bg-[#2c52e8] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#2144cb] disabled:opacity-60">{saving ? "Saving..." : "Save pricing"}</button>
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
          <button type="button" disabled={saving} onClick={() => setConfirm(null)} className="rounded-lg border border-app-border px-4 py-2 text-sm font-semibold">Cancel</button>
          <button type="button" disabled={saving} onClick={confirm.action} className="rounded-lg bg-[#2c52e8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Resetting..." : "Reset prices"}</button>
          </div>
          </div>
          </div>}
  </div>;
}
