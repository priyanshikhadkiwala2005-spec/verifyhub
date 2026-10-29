import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Fingerprint, CreditCard, Landmark, FilePenLine,
  Tags, PlugZap, ListChecks, ShieldAlert,
  X, CheckCircle2, AlertTriangle, RefreshCw,
} from "lucide-react";
import api, { getErrorMessage } from "../../api";

// Data: GET /admin/services · toggle: PUT /admin/services/{id} { status: active|paused }.
// Icons/colours stay in the frontend; the order matches the Complete KYC flow.
const SERVICE_META = {
  aadhaar: { order: 1, step: "1. Aadhaar", icon: Fingerprint, iconBg: "#f0eaff", iconColor: "#7246f4" },
  pan: { order: 2, step: "2. PAN", icon: CreditCard, iconBg: "#edf1ff", iconColor: "#2854f4" },
  bank: { order: 3, step: "3. Bank", icon: Landmark, iconBg: "#e6f5ff", iconColor: "#0285c5" },
  esign: { order: 4, step: "4. e-Sign", icon: FilePenLine, iconBg: "#e0f7f3", iconColor: "#079589" },
};

const FALLBACK_META = { order: 99, icon: ListChecks, iconBg: "#edf1ff", iconColor: "#2854f4" };

const toService = (svc) => ({
  ...FALLBACK_META,
  step: svc.short || svc.name,
  ...SERVICE_META[svc.id],
  id: svc.id,
  name: svc.name,
  description: svc.desc,
  price: Number(svc.price) || 0,
  providerCost: Number(svc.provider_cost) || 0,
  usage: Number(svc.total_usage) || 0,
  verified: Number(svc.successful_usage) || 0,
  // The backend reports 100% for a service with no usage, so only show a rate once it has been used.
  success: Number(svc.total_usage) > 0 ? Number(svc.success_rate) || 0 : null,
  enabled: svc.status === "active",
});

function currency(value) {
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function ServiceCard({ service, onToggle, busy }) {
  const Icon = service.icon;
  const margin = service.price - service.providerCost;
  return (
    <article className="min-w-0 rounded-2xl border border-app-border bg-app-surface p-5 shadow-[0_2px_5px_rgba(21,37,75,0.06)] sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: service.iconBg, color: service.iconColor }}
        >
          <Icon size={25} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="max-w-full text-[16px] font-bold leading-6 text-app-text sm:text-[17px]">
              {service.name}
            </h3>
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${service.enabled ? "bg-[#e4f6ed] text-[#06935b] dark:bg-[#193e35] dark:text-[#76e4b2]" : "bg-app-surface-muted text-app-text-secondary"}`}>
              <span className={`h-[7px] w-[7px] rounded-full ${service.enabled ? "bg-[#0a9a62]" : "bg-[#94a3b8]"}`} />
              {service.enabled ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-[22px] text-app-text-secondary sm:text-[14px]">
            {service.description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          ["COST / CHECK", currency(service.price)],
          ["TOTAL USAGE", service.usage.toLocaleString("en-IN")],
          ["SUCCESS RATE", service.success === null ? "—" : `${service.success.toFixed(1)}%`],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl border border-app-border bg-app-surface-muted px-2.5 py-3 sm:px-3">
            <p className="text-[10px] font-bold tracking-[0.02em] text-app-text-muted sm:text-[11px]">{label}</p>
            <p className="mt-1 text-[16px] font-bold text-app-text sm:text-[18px]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[12px] text-app-text-secondary sm:text-[13px]">
        <span>Provider cost {currency(service.providerCost)} · margin {currency(margin)}</span>
        <span>{service.verified} verified</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-app-border">
        <div className="h-full rounded-full bg-[#11965b] transition-[width] duration-300" style={{ width: `${service.success ?? 0}%` }} />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-app-border pt-4">
        <p className="text-[12px] leading-5 text-app-text-secondary sm:text-[13px]">
          Available to all active retailers
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={service.enabled}
          aria-label={`${service.enabled ? "Disable" : "Enable"} ${service.name}`}
          onClick={() => onToggle(service)}
          disabled={busy}
          className={`relative h-[28px] w-[47px] shrink-0 rounded-full transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2854e8] ${service.enabled ? "bg-[#0f985b]" : "bg-[#65738a]"}`}
        >
          <span className={`absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full bg-app-surface shadow-sm transition-transform ${service.enabled ? "translate-x-[19px]" : "translate-x-0"}`} />
        </button>
      </div>
    </article>
  );
}

export default function KYCServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmService, setConfirmService] = useState(null);
  const [toast, setToast] = useState("");
  const [toastError, setToastError] = useState(false);
  const enabledCount = services.filter((service) => service.enabled).length;

  const loadServices = useCallback(() => api.get("/admin/services")
    .then(({ data }) => {
      setServices((data?.data?.services ?? []).map(toService).sort((a, b) => a.order - b.order));
      setSummary(data?.data?.summary ?? null);
      setLoadError("");
    })
    .catch((err) => setLoadError(getErrorMessage(err, "Unable to load KYC services.")))
    .finally(() => setLoading(false)), []);

  useEffect(() => { loadServices(); }, [loadServices]);

  const retry = () => { setLoading(true); setLoadError(""); loadServices(); };

  useEffect(() => {
    if (!confirmService) return;
    const onKeyDown = (event) => { if (event.key === "Escape") setConfirmService(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmService]);

  const saveToggle = async (service) => {
    if (saving) return;
    const nextEnabled = !service.enabled;
    setSaving(true);
    try {
      await api.put(`/admin/services/${service.id}`, { status: nextEnabled ? "active" : "paused" });
      setToastError(false);
      setToast(`${service.name} ${nextEnabled ? "enabled" : "disabled"}.`);
      setConfirmService(null);
      loadServices();
    } catch (err) {
      setToastError(true);
      setToast(getErrorMessage(err, `Unable to update ${service.name}.`));
      setConfirmService(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full min-w-0 bg-app-background text-app-text">
     

      <main className="mx-auto w-full max-w-[1800px] px-4 pb-7 pt-7 sm:px-6 lg:px-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[23px] font-bold tracking-[-0.03em] text-app-text sm:text-[26px]">KYC service management</h1>
            <p className="mt-1 text-[13px] text-app-text-secondary sm:text-[14px]">Control which verification APIs are available to retailers.</p>
          </div>
          <button type="button" onClick={() => navigate("/super-admin/pricing")} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface px-5 text-[13px] font-semibold text-app-text shadow-sm transition hover:bg-app-surface-muted sm:w-auto">
            <Tags size={18} /> Manage pricing
          </button>
        </div>

        {loadError && (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
            <span>{loadError}</span>
            <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-100"><RefreshCw size={15} />Retry</button>
          </div>
        )}

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#a7d8ff] bg-[#e6f5ff] dark:border-[#315c85] dark:bg-[#17304a] px-4 py-4 text-[12px] leading-6 text-[#172744] dark:text-[#dceaff] sm:px-5 sm:text-[13px]">
          <PlugZap size={20} className="mt-0.5 shrink-0 text-[#008ed3] dark:text-[#66c9ff]" />
          <p><strong>{loading ? "Loading services..." : `${enabledCount} of ${services.length} live services enabled.`}</strong> Disabling a service blocks new verification requests for it across all retailers. In-flight requests complete normally.</p>
        </div>

        <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-app-border bg-app-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center text-[#2c57ef] dark:text-[#8da6ff]"><ListChecks size={24} /></div>
            <div>
              <h2 className="text-[16px] font-bold">Complete KYC flow</h2>
              <p className="mt-1 text-[12px] leading-5 text-app-text-secondary sm:text-[13px]">Retailers can run all four checks for one customer as a single guided journey.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {services.map(({ id, step, enabled }) => (
                  <span key={id} className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${enabled ? "border-app-border bg-app-surface-muted text-app-text-secondary" : "border-[#f1c8c8] bg-[#fff2f2] text-[#b45353] dark:border-[#75414a] dark:bg-[#3b2631] dark:text-[#ff9fa8] line-through"}`}>{step}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[12px] text-app-text-muted">Default price per full KYC</p>
            <p className="mt-1 text-[21px] font-bold">{summary ? currency(summary.full_kyc_price) : "—"}</p>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2 lg:gap-5">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onToggle={setConfirmService} busy={saving} />
          ))}
        </div>

        {!services.length && (
          <p className="mt-4 rounded-2xl border border-app-border bg-app-surface px-4 py-12 text-center text-[13px] text-app-text-secondary">
            {loading ? "Loading KYC services..." : "No KYC services found."}
          </p>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#f1cc85] bg-[#fff3df] dark:border-[#70552d] dark:bg-[#3a3021] px-4 py-4 text-[12px] leading-5 text-[#1e2b44] dark:text-[#f2dfbd] sm:px-5 sm:text-[13px]">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-[#df8b00] dark:text-[#ffc86d]" />
          <p><strong>Compliance note:</strong> Aadhaar is verified only through OTP authentication with a UIDAI-authorised partner, and e-Sign through a licensed e-Sign Service Provider. The full Aadhaar number is never stored or shown (masked as XXXX XXXX 1234), and every check requires recorded customer consent.</p>
        </div>
      </main>

     

      {confirmService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1735]/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmService(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="kyc-toggle-title" className="w-full max-w-[450px] rounded-2xl bg-app-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${confirmService.enabled ? "bg-[#fff0e9] text-[#c56a17] dark:bg-[#4a3024] dark:text-[#ffc48b]" : "bg-[#e4f6ed] text-[#0d985d] dark:bg-[#193e35] dark:text-[#76e4b2]"}`}>
                {confirmService.enabled ? <AlertTriangle size={23} /> : <CheckCircle2 size={23} />}
              </div>
              <button type="button" aria-label="Close" onClick={() => setConfirmService(null)} className="rounded-lg p-2 text-app-text-secondary hover:bg-app-surface-muted"><X size={19} /></button>
            </div>
            <h2 id="kyc-toggle-title" className="mt-4 text-[20px] font-bold">{confirmService.enabled ? "Disable" : "Enable"} KYC service?</h2>
            <p className="mt-2 text-[13px] leading-6 text-app-text-secondary">
              {confirmService.name} will be marked <strong>{confirmService.enabled ? "Inactive" : "Active"}</strong>. {confirmService.enabled ? "Retailers will not be able to run new checks for this service until it is enabled again." : "Retailers will be able to run this check again."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={saving} onClick={() => setConfirmService(null)} className="rounded-xl border border-app-border bg-app-surface px-5 py-2.5 text-[13px] font-semibold text-app-text hover:bg-app-surface-muted">Cancel</button>
              <button type="button" disabled={saving} onClick={() => saveToggle(confirmService)} className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60 ${confirmService.enabled ? "bg-[#d66b20] hover:bg-[#b95512]" : "bg-[#2652e8] hover:bg-[#1e40bd]"}`}>
                {saving ? "Saving..." : confirmService.enabled ? "Yes, disable" : "Yes, enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className={`fixed bottom-5 right-4 z-[110] flex max-w-[min(430px,calc(100vw-32px))] items-start gap-3 rounded-xl border bg-app-surface p-4 text-[12px] shadow-xl sm:right-6 ${toastError ? "border-red-200 text-red-600 dark:text-red-300" : "border-[#cce6d8] text-[#145d3c] dark:text-[#77e4b0] dark:border-[#275e4d]"}`}>
          <CheckCircle2 size={19} className="shrink-0" />
          <span>{toast}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast("")}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
