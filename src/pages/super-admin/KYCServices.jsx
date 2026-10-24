import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Fingerprint, CreditCard, Landmark, FilePenLine,
  Tags, PlugZap, ListChecks, ShieldAlert,
  X, CheckCircle2, AlertTriangle,
} from "lucide-react";

// Frontend demo only. In production, read/update availability through an authenticated API.
const STORAGE_KEY = "verifyhub_demo_kyc_service_availability_v1";
const DEFAULT_SERVICES = [
  {
    id: "aadhaar", name: "Aadhaar Verification (OTP)",
    description: "OTP-based Aadhaar authentication through a UIDAI-authorised partner. Returns name, gender, year of birth and state.",
    icon: Fingerprint, iconBg: "#f0eaff", iconColor: "#7246f4",
    price: 20, providerCost: 8, usage: 167, verified: 155, success: 92.8,
    enabled: true,
  },
  {
    id: "pan", name: "PAN Card Verification",
    description: "Validate PAN, holder name, status and Aadhaar seeding against the income-tax source.",
    icon: CreditCard, iconBg: "#edf1ff", iconColor: "#2854f4",
    price: 10, providerCost: 3.5, usage: 171, verified: 152, success: 88.9,
    enabled: true,
  },
  {
    id: "bank", name: "Bank Account Verification (Penny Drop)",
    description: "Credits ₹1 to the account via IMPS and returns the beneficiary name registered with the bank.",
    icon: Landmark, iconBg: "#e6f5ff", iconColor: "#0285c5",
    price: 15, providerCost: 6, usage: 136, verified: 121, success: 89.0,
    enabled: true,
  },
  {
    id: "esign", name: "Consent Letter with e-Sign",
    description: "Generates the customer consent letter and collects a legally valid Aadhaar OTP e-Signature.",
    icon: FilePenLine, iconBg: "#e0f7f3", iconColor: "#079589",
    price: 30, providerCost: 15, usage: 73, verified: 69, success: 94.5,
    enabled: true,
  },
];

function loadAvailability() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return saved;
  } catch {
    return {};
  }
}

function currency(value) {
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function ServiceCard({ service, onToggle }) {
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
          ["SUCCESS RATE", `${service.success.toFixed(1)}%`],
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
        <div className="h-full rounded-full bg-[#11965b] transition-[width] duration-300" style={{ width: `${service.success}%` }} />
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
          className={`relative h-[28px] w-[47px] shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2854e8] ${service.enabled ? "bg-[#0f985b]" : "bg-[#65738a]"}`}
        >
          <span className={`absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full bg-app-surface shadow-sm transition-transform ${service.enabled ? "translate-x-[19px]" : "translate-x-0"}`} />
        </button>
      </div>
    </article>
  );
}

export default function KYCServices() {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState(loadAvailability);
  const [confirmService, setConfirmService] = useState(null);
  const [toast, setToast] = useState("");
  const services = useMemo(
    () => DEFAULT_SERVICES.map((service) => ({
      ...service,
      enabled: typeof availability[service.id] === "boolean" ? availability[service.id] : service.enabled,
    })),
    [availability]
  );
  const enabledCount = services.filter((service) => service.enabled).length;
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

  useEffect(() => {
    if (!confirmService) return;
    const onKeyDown = (event) => { if (event.key === "Escape") setConfirmService(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmService]);

  const saveToggle = (service) => {
    const nextEnabled = !service.enabled;
    const next = { ...availability, [service.id]: nextEnabled };
    setAvailability(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setToast(`${service.name} ${nextEnabled ? "enabled" : "disabled"} in this browser's demo.`);
    } catch {
      setToast(`${service.name} updated for this session (browser storage unavailable).`);
    }
    setConfirmService(null);
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

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#a7d8ff] bg-[#e6f5ff] dark:border-[#315c85] dark:bg-[#17304a] px-4 py-4 text-[12px] leading-6 text-[#172744] dark:text-[#dceaff] sm:px-5 sm:text-[13px]">
          <PlugZap size={20} className="mt-0.5 shrink-0 text-[#008ed3] dark:text-[#66c9ff]" />
          <p><strong>{enabledCount} of {services.length} live services enabled.</strong> Disabling a service hides it from retailer dashboards and blocks new requests in the planned production integration. In-flight requests would complete normally. <span className="text-[#516d91] dark:text-[#a6bdd8]">(This demo only updates the UI.)</span></p>
        </div>

        <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-app-border bg-app-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center text-[#2c57ef] dark:text-[#8da6ff]"><ListChecks size={24} /></div>
            <div>
              <h2 className="text-[16px] font-bold">Complete KYC flow</h2>
              <p className="mt-1 text-[12px] leading-5 text-app-text-secondary sm:text-[13px]">Retailers can run all four checks for one customer as a single guided journey.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["1. Aadhaar", "2. PAN", "3. Bank", "4. e-Sign"].map((step, index) => (
                  <span key={step} className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${services[index].enabled ? "border-app-border bg-app-surface-muted text-app-text-secondary" : "border-[#f1c8c8] bg-[#fff2f2] text-[#b45353] dark:border-[#75414a] dark:bg-[#3b2631] dark:text-[#ff9fa8] line-through"}`}>{step}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[12px] text-app-text-muted">Default price per full KYC</p>
            <p className="mt-1 text-[21px] font-bold">{currency(totalPrice)}</p>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2 lg:gap-5">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onToggle={setConfirmService} />
          ))}
        </div>

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
              {confirmService.name} will be marked <strong>{confirmService.enabled ? "Inactive" : "Active"}</strong> in this demo. No live KYC APIs are affected.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmService(null)} className="rounded-xl border border-app-border bg-app-surface px-5 py-2.5 text-[13px] font-semibold text-app-text hover:bg-app-surface-muted">Cancel</button>
              <button type="button" onClick={() => saveToggle(confirmService)} className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white ${confirmService.enabled ? "bg-[#d66b20] hover:bg-[#b95512]" : "bg-[#2652e8] hover:bg-[#1e40bd]"}`}>
                {confirmService.enabled ? "Yes, disable" : "Yes, enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-5 right-4 z-[110] flex max-w-[min(430px,calc(100vw-32px))] items-start gap-3 rounded-xl border border-[#cce6d8] bg-app-surface p-4 text-[12px] text-[#145d3c] dark:text-[#77e4b0] dark:border-[#275e4d] shadow-xl sm:right-6">
          <CheckCircle2 size={19} className="shrink-0" />
          <span>{toast}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast("")}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
