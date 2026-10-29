import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet, ShieldCheck, BadgeCheck, CircleX, IndianRupee,
  Plus, ReceiptText, History, ListChecks, Fingerprint, CreditCard,
  Landmark, FileSignature, ArrowRight, Zap, ChartNoAxesColumn,
  Activity, TrendingDown, TrendingUp, X, Send, Info, RefreshCw,
} from "lucide-react";
import api, { getErrorMessage } from "../../api";
import { getUser } from "../../auth";

// Data: GET /retailer/overview · top-up request: POST /retailer/fund-requests
// Icons, colours and routes stay in the frontend; titles, prices and availability come from the API.
const SERVICE_META = {
  aadhaar: { label: "Aadhaar", icon: Fingerprint, tint: "bg-[#f1edff]", iconColor: "text-[#7861d9]", route: "/retailer/aadhaar-verification" },
  pan: { label: "PAN", icon: CreditCard, tint: "bg-[#edf1ff]", iconColor: "text-[#7a8bad]", route: "/retailer/pan-verification" },
  bank: { label: "Bank", icon: Landmark, tint: "bg-[#e7f4fb]", iconColor: "text-[#7d9bb0]", route: "/retailer/bank-penny-drop" },
  esign: { label: "e-Sign", icon: FileSignature, tint: "bg-[#e3f6f3]", iconColor: "text-[#7c9e9b]", route: "/retailer/consent-esign" },
};
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const timeAgo = (iso) => {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutes)) return "";
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function MetricCard({ title, value, caption, icon: Icon, tone = "blue", badge, badgeUp = false }) {
  const tones = {
    blue: "bg-[#eef1ff] text-[#2955ee]",
    green: "bg-[#e4f7ef] text-[#16975e]",
    red: "bg-[#ffeaed] text-[#ef3548]",
    amber: "bg-[#fff2dc] text-[#d88800]",
  };
  return (
    <article className="flex min-h-[150px] flex-col justify-between rounded-[15px] border border-[#dfe6f1] bg-white p-5 shadow-[0_1px_3px_rgba(19,35,65,.07)] sm:min-h-[178px] sm:p-[22px] dark:border-app-border dark:bg-app-surface">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-[#4d5d7b] dark:text-app-text-secondary sm:text-[14px]">{title}</p>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${tones[tone]}`}><Icon size={21} strokeWidth={1.8} /></span>
      </div>
      <div>
        <p className="text-[29px] font-bold leading-tight tracking-[-.03em] text-[#101a35] dark:text-app-text sm:text-[32px]">{value}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#8b9ab6] sm:text-[13px]">
          {badge && <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${badgeUp ? "bg-[#ffeaed] text-[#e53e4d]" : "bg-[#e2f5ec] text-[#0a9a5e]"}`}>{badgeUp ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}{badge}</span>}
          <span>{caption}</span>
        </div>
      </div>
    </article>
  );
}

function SevenDayChart({ chart }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(2, ...chart.map((p) => p.verified + p.failed + p.pending));
  const top = 18, chartHeight = 212, bottom = 230, x0 = 46, plotWidth = 700;
  const slot = plotWidth / Math.max(chart.length, 1);
  const ticks = [...new Set([max, Math.round(max / 2), 0])];
  const barHeight = (value) => (value / max) * chartHeight;
  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 790 295" role="img" aria-label="Verification chart for the last seven days" className="mt-4 h-auto min-w-[420px] w-full" onMouseLeave={() => setHovered(null)}>
        {ticks.map((tick) => {
          const y = top + ((max - tick) / max) * chartHeight;
          return <g key={tick}><line x1={x0} x2={x0 + plotWidth} y1={y} y2={y} stroke="#e0e6f0"/><text x={x0 - 12} y={y + 4} textAnchor="end" fill="#647594" fontSize="12">{tick}</text></g>;
        })}
        {chart.map((point, index) => {
          const cx = x0 + slot * (index + 0.5);
          // Stacked bar: verified at the bottom, then failed, then pending.
          const vH = barHeight(point.verified), fH = barHeight(point.failed), pH = barHeight(point.pending);
          return <g key={point.day} onMouseEnter={() => setHovered(index)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} tabIndex={0} aria-label={`${point.day}: ${point.verified} verified, ${point.failed} failed, ${point.pending} pending`} style={{ outline: 'none', cursor: 'crosshair' }}>
            {point.verified > 0 && <rect x={cx - 15} y={bottom - vH} width="30" height={vH} rx="5" fill="#2b50e9"/>}
            {point.failed > 0 && <rect x={cx - 15} y={bottom - vH - fH} width="30" height={fH} rx="5" fill="#e53e4d"/>}
            {point.pending > 0 && <rect x={cx - 15} y={bottom - vH - fH - pH} width="30" height={pH} rx="5" fill="#e79a09"/>}
            <rect x={x0 + index * slot} y={top} width={slot} height={chartHeight + 30} fill="transparent"/>
            <text x={cx} y={bottom + 23} textAnchor="middle" fill="#647594" fontSize="12">{point.day}</text>
          </g>;
        })}
        {hovered !== null && (() => {
          const point = chart[hovered];
          const cx = x0 + slot * (hovered + 0.5);
          const tooltipX = Math.max(10, Math.min(cx - 52, 790 - 118));
          const tooltipY = Math.max(25, bottom - barHeight(point.verified + point.failed + point.pending) - 105);
          return <g pointerEvents="none" transform={`translate(${tooltipX}, ${tooltipY})`}>
            <rect width="114" height="95" rx="9" fill="#0d193b"/>
            <text x="11" y="20" fontSize="12" fontWeight="700" fill="white">{point.day}</text>
            {[["Verified", point.verified, "#2b50e9"], ["Failed", point.failed, "#e53e4d"], ["Pending", point.pending, "#e79a09"]].map(([label, value, color], i) => <g key={label}><rect x="12" y={33 + i * 19} width="11" height="11" fill={color} stroke="white" strokeWidth="1"/><text x="30" y={43 + i * 19} fontSize="12" fill="white">{label}: {value}</text></g>)}
          </g>;
        })()}
      </svg>
    </div>
  );
}

function TopUpModal({ onClose, onSubmitted }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("UPI");
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = old; };
  }, [onClose]);
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!amount || Number(amount) < 500) return setError('Minimum top-up amount is ₹500.');
    if (!date || reference.trim().length < 4) return setError('Please enter transfer date and a valid UTR / transaction reference (min. 4 characters).');
    setError('');
    setSaving(true);
    try {
      // retailer_id is sent because the backend's retailer routes do not resolve the Sanctum user for this endpoint yet.
      const { data } = await api.post('/retailer/fund-requests', { retailer_id: getUser()?.id, amount: Number(amount), mode, utr: reference.trim(), transfer_date: date, remarks: remarks.trim() || undefined });
      onSubmitted(data?.message || `Top-up request for ${money(amount)} submitted for admin approval.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit the top-up request. Please try again.'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#111827]/55 px-0 py-0 backdrop-blur-[2px] sm:items-center sm:px-3 sm:py-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="topup-title" className="flex max-h-[96dvh] w-full max-w-[725px] flex-col overflow-hidden rounded-t-[20px] sm:max-h-[94dvh] sm:rounded-[20px] bg-white text-[#111b36] shadow-2xl">
        <div className="flex shrink-0 items-start gap-4 border-b border-[#e2e8f1] px-5 py-5 sm:px-7">
          <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl bg-[#eef1ff] text-[#2b50e9] sm:w-[90px]"><Wallet size={23}/></div>
          <div className="min-w-0 flex-1"><h2 id="topup-title" className="text-[18px] font-bold sm:text-[20px]">Request wallet top-up</h2><p className="mt-1 text-[13px] leading-5 text-[#526383] sm:text-[15px]">Submit your bank transfer details for admin approval</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-[#526383] hover:bg-[#f1f4fa]"><X size={21}/></button>
        </div>
        <form id="retailer-topup-form" onSubmit={submit} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="flex items-start gap-3 rounded-[10px] border border-[#f1cf8b] bg-[#fff3df] p-4 text-[13px] leading-6 sm:text-[14px]"><Info size={21} className="mt-0.5 shrink-0 text-[#d88700]"/><p><strong>Transfer first, then submit.</strong> No payment is collected here. Send the amount to the company bank account / UPI, then enter the UTR below. Your wallet is credited after the admin verifies the transfer.</p></div>
          <div><label htmlFor="topup-amount" className="mb-2 block text-[13px] font-semibold text-[#526383]">Amount <span className="float-right text-red-500">*</span></label><div className="flex overflow-hidden rounded-[10px] border border-[#d1dbea] focus-within:border-[#2b50e9] focus-within:ring-2 focus-within:ring-[#2b50e9]/10"><span className="flex items-center bg-[#f5f7fb] px-4 font-semibold text-[#526383]">₹</span><input id="topup-amount" type="number" min="500" step="1" value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); }} placeholder="Minimum ₹500" className="min-w-0 w-full bg-white px-4 py-3 text-[14px] outline-none" required/></div><div className="mt-2 flex flex-wrap gap-2">{[1000, 2000, 5000, 10000].map(n => <button key={n} type="button" onClick={() => setAmount(String(n))} className="rounded-full border border-[#d1dbea] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#526383] hover:border-[#2b50e9] hover:text-[#2b50e9]">₹{n.toLocaleString('en-IN')}</button>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="topup-mode" className="mb-2 block text-[13px] font-semibold text-[#526383]">Payment mode <span className="float-right text-red-500">*</span></label><select id="topup-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-[10px] border border-[#d1dbea] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2b50e9]"><option>UPI</option><option>NEFT</option><option>IMPS</option><option>RTGS</option></select></div><div><label htmlFor="topup-date" className="mb-2 block text-[13px] font-semibold text-[#526383]">Transfer date <span className="float-right text-red-500">*</span></label><input id="topup-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-[10px] border border-[#d1dbea] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2b50e9]"/></div></div>
          <div><label htmlFor="topup-ref" className="mb-2 block text-[13px] font-semibold text-[#526383]">UTR / transaction reference <span className="float-right text-red-500">*</span></label><input id="topup-ref" value={reference} onChange={(e) => { setReference(e.target.value); setError(''); }} placeholder="e.g. UTR428193746512" required className="w-full rounded-[10px] border border-[#d1dbea] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2b50e9]"/></div>
          <div><label htmlFor="topup-remarks" className="mb-2 flex justify-between text-[13px] font-semibold text-[#526383]">Remarks <span className="font-normal text-[#8b9ab6]">Optional</span></label><textarea id="topup-remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Anything the admin should know" className="w-full resize-y rounded-[10px] border border-[#d1dbea] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2b50e9]"/></div>
          {error && <p role="alert" className="text-[12px] font-medium text-red-600">{error}</p>}
        </form>
        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#e2e8f1] bg-[#f8faff] px-5 py-4 sm:px-7"><button type="button" onClick={onClose} disabled={saving} className="rounded-[9px] border border-[#d1dbea] bg-white px-5 py-2.5 text-[13px] font-semibold">Cancel</button><button type="submit" form="retailer-topup-form" disabled={saving} className="inline-flex items-center gap-2 rounded-[9px] bg-[#2b50e9] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2143d1] disabled:opacity-60"><Send size={17}/>{saving ? "Submitting..." : "Submit request"}</button></div>
      </div>
    </div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpNotice, setTopUpNotice] = useState("");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const loadOverview = useCallback(() => api.get("/retailer/overview")
    .then(({ data }) => { setOverview(data?.data ?? null); setLoadError(""); })
    .catch((err) => setLoadError(getErrorMessage(err, "Unable to load your dashboard.")))
    .finally(() => setLoading(false)), []);
  useEffect(() => { loadOverview(); }, [loadOverview]);
  const retry = () => { setLoading(true); setLoadError(""); loadOverview(); };
  const submitTopUp = (message) => {
    setShowTopUp(false);
    setTopUpNotice(message);
    loadOverview();
  };
  const todayGreeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  }, []);

  const retailer = overview?.retailer ?? getUser();
  const wallet = overview?.wallet;
  const kpis = overview?.kpis;
  const show = (value) => (overview ? value : "—");
  const services = (overview?.quick_services ?? []).map((s) => ({ ...SERVICE_META[s.id], title: s.name, desc: s.desc, price: Number(s.price) || 0, available: s.status === "available" }));
  const availablePrices = services.filter((s) => s.available).map((s) => s.price).filter((p) => p > 0);
  // Estimated from this retailer's actual rate card (the API's estimate uses a fixed ₹19.25 average).
  const checksLeft = wallet && availablePrices.length ? Math.floor(wallet.balance / (availablePrices.reduce((a, b) => a + b, 0) / availablePrices.length)) : 0;
  const chart = (overview?.last_7_days ?? []).map((d) => ({ day: d.day_label, verified: d.verified, failed: d.failed, pending: d.pending }));
  const activity = (overview?.recent_activity ?? []).map((v) => ({
    id: v.id,
    name: `${SERVICE_META[v.type]?.label ?? v.type} · ${v.doc || v.id}`,
    detail: `${timeAgo(v.created_at)} · -${money(v.amount)}`,
    status: v.status === "verified" ? "Verified" : v.status === "failed" ? "Failed" : "Pending",
    icon: SERVICE_META[v.type]?.icon ?? ShieldCheck,
  }));
  const changePct = Number(kpis?.expenses_change_pct) || 0;

  return (
    <div className="min-w-0 w-full overflow-x-hidden bg-[#f4f6fc] px-3 py-5 font-poppins text-[#111b36] dark:bg-app-background dark:text-app-text sm:px-6 lg:px-7 lg:py-7">
      {loadError && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700"><span>{loadError}</span><button type="button" onClick={retry} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-semibold"><RefreshCw size={14}/>Retry</button></div>}
      {topUpNotice && <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-[#b8e5d0] bg-[#e7f7ef] px-4 py-3 text-[12px] text-[#08764b]"><span>{topUpNotice}</span><button type="button" onClick={() => setTopUpNotice("")} aria-label="Dismiss message"><X size={17}/></button></div>}
      {/* Page intro */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[23px] font-bold tracking-tight sm:text-[25px]">{todayGreeting}{(retailer?.owner || retailer?.name) ? `, ${(retailer.owner || retailer.name).split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-[13px] text-[#526383] dark:text-app-text-secondary sm:text-[14px]">{retailer?.shop ? `${retailer.shop} · Retailer ID ${retailer.id}` : "Loading your account..."}</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button type="button" onClick={() => navigate("/retailer/verification-history")} className="inline-flex min-h-[43px] flex-1 items-center justify-center gap-2 rounded-[9px] border border-[#d3ddec] bg-white px-4 text-[13px] font-semibold text-[#182542] shadow-sm hover:bg-[#f8faff] dark:border-app-border dark:bg-app-surface dark:text-app-text sm:flex-none"><History size={18}/>History</button>
          <button type="button" onClick={() => navigate("/retailer/complete-kyc")} className="inline-flex min-h-[43px] flex-1 items-center justify-center gap-2 rounded-[9px] bg-[#2b50e9] px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#2143d1] sm:flex-none"><ListChecks size={18}/>Start Complete KYC</button>
        </div>
      </div>

      {/* Wallet and stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        <section className="relative min-h-[300px] overflow-hidden rounded-[17px] bg-gradient-to-br from-[#10235d] via-[#203da8] to-[#365cf2] p-5 text-white shadow-[0_8px_20px_rgba(27,53,145,.15)] sm:row-span-2 xl:min-h-[365px] xl:p-7">
          <div className="pointer-events-none absolute -bottom-40 -right-24 h-[400px] w-[400px] rounded-full border-[43px] border-white/[.065]"/>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#dce5ff]"><Wallet size={20}/>Available wallet balance</div>
            <div className="mt-4 text-[38px] font-bold leading-tight tracking-tight sm:text-[41px]">{wallet ? money(wallet.balance) : "—"}</div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-3 text-[#d9e3ff]">
              <div><p>Approx. checks left</p><p className="mt-1 text-[17px] font-bold text-white">{wallet ? checksLeft.toLocaleString("en-IN") : "—"}</p></div>
              <div><p>Last top-up</p><p className="mt-1 text-[17px] font-bold text-white">{wallet ? (wallet.last_topup ? money(wallet.last_topup) : "None yet") : "—"}</p></div>
              <div><p>Pending request</p><p className="mt-1 text-[17px] font-bold text-white">{wallet ? money(wallet.pending_request_amount) : "—"}</p></div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowTopUp(true)} className="inline-flex min-h-[44px] items-center gap-2 rounded-[9px] bg-white px-4 text-[13px] font-semibold text-[#2346be] transition hover:bg-[#edf2ff]"><Plus size={19}/>Add funds</button>
              <button type="button" onClick={() => navigate("/retailer/wallet")} className="inline-flex min-h-[44px] items-center gap-2 rounded-[9px] border border-white/20 bg-white/10 px-4 text-[13px] font-semibold text-white transition hover:bg-white/20"><ReceiptText size={18}/>Statement</button>
            </div>
          </div>
        </section>
        <MetricCard title="Total verifications" value={show(kpis?.total_verifications)} caption="all time" icon={ShieldCheck}/>
        <MetricCard title="Successful" value={show(kpis?.successful_verifications)} caption={kpis ? `${kpis.success_rate}% success rate` : ""} icon={BadgeCheck} tone="green"/>
        <MetricCard title="Failed" value={show(kpis?.failed_verifications)} caption="not found / source errors" icon={CircleX} tone="red"/>
        <MetricCard title="This month's expenses" value={show(money(kpis?.expenses_this_month))} caption={changePct ? "vs last month" : "verification charges this month"} icon={IndianRupee} tone="amber" badge={changePct ? `${Math.abs(changePct)}%` : null} badgeUp={changePct > 0}/>
      </div>

      {/* Quick verification */}
      <section className="mt-5 overflow-hidden rounded-[15px] border border-[#dfe6f1] bg-white shadow-[0_1px_3px_rgba(19,35,65,.07)] dark:border-app-border dark:bg-app-surface">
        <div className="border-b border-[#e2e8f1] px-5 py-5 dark:border-app-border sm:px-6">
          <h2 className="flex items-center gap-2 text-[16px] font-bold"><Zap size={20} className="text-[#2954ed]"/>Quick verification</h2>
          <p className="mt-1 text-[13px] text-[#8998b4]">Start a new check — charges are deducted from your wallet</p>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-4 rounded-[14px] border border-[#dbe3ff] bg-gradient-to-r from-[#edf1ff] to-white p-4 dark:from-[#1c2948] dark:to-app-surface sm:p-5 lg:flex-row lg:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] text-[#2954ed]"><ListChecks size={25}/></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold">Complete KYC</h3>
              <p className="mt-1 text-[13px] text-[#526383] dark:text-app-text-secondary">Run all four checks for one customer as a guided flow.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["1. Aadhaar", "2. PAN", "3. Bank", "4. e-Sign"].map((step) => <span key={step} className="rounded-full border border-[#dfe6f1] bg-white px-2.5 py-1 text-[11px] font-medium text-[#4b5b79] dark:border-app-border dark:bg-app-surface-muted dark:text-app-text-secondary">{step}</span>)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <div className="text-left lg:text-right"><p className="text-[12px] text-[#8998b4]">Per customer</p><p className="text-[19px] font-bold">{overview ? money(overview.complete_kyc?.price) : "—"}</p></div>
              <button type="button" onClick={() => navigate("/retailer/complete-kyc")} className="inline-flex min-h-[43px] items-center gap-3 rounded-[9px] bg-[#2b50e9] px-5 text-[13px] font-semibold text-white transition hover:bg-[#2143d1]">Start KYC<ArrowRight size={18}/></button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {!services.length && <p className="col-span-full py-8 text-center text-[13px] text-[#8998b4]">{loading ? "Loading services..." : "No verification services available."}</p>}
            {services.map(({ title, desc, price, icon: Icon = ShieldCheck, tint, iconColor, route, available }) => (
              <button key={title} type="button" onClick={() => route && navigate(route)} className="flex min-h-[210px] flex-col rounded-[14px] border border-[#dfe6f1] bg-white p-5 text-left transition hover:border-[#a6b7f8] hover:shadow-md dark:border-app-border dark:bg-app-surface-muted">
                <div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-[11px] ${tint} ${iconColor}`}><Icon size={22} strokeWidth={1.8}/></span><ArrowRight size={18} className="text-[#8b9bb5]"/></div>
                <h3 className="mt-4 text-[13px] font-bold leading-5 sm:text-[14px]">{title}</h3>
                <p className="mt-1 flex-1 text-[12px] leading-[1.65] text-[#8796b2] dark:text-app-text-secondary">{desc}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><p className="text-[14px] font-bold">{money(price)}<span className="ml-1 text-[11px] font-normal text-[#8b9ab6]">/ request</span></p>{available ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f6ed] px-3 py-1 text-[11px] font-semibold text-[#0c9b60]"><span className="h-1.5 w-1.5 rounded-full bg-[#0c9b60]"/>Available</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1f6] px-3 py-1 text-[11px] font-semibold text-[#64748b]"><span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]"/>Paused</span>}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Chart and activity */}
      <div className="mt-5 grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(330px,1fr)]">
        <section className="min-w-0 rounded-[15px] border border-[#dfe6f1] bg-white p-5 shadow-[0_1px_3px_rgba(19,35,65,.07)] dark:border-app-border dark:bg-app-surface sm:p-6">
          <h2 className="flex items-center gap-2 text-[16px] font-bold"><ChartNoAxesColumn size={20} className="text-[#2954ed]"/>Last 7 days</h2>
          <p className="mt-1 text-[13px] text-[#8998b4]">Daily verifications by outcome</p>
          <div className="mt-5 flex flex-wrap justify-start gap-3 sm:justify-end sm:gap-4 text-[12px] text-[#657492]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#2b50e9]"/>Verified</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#e53e4d]"/>Failed</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#e79a09]"/>Pending</span></div>
          {chart.length ? <SevenDayChart chart={chart}/> : <p className="py-16 text-center text-[13px] text-[#8998b4]">{loading ? "Loading chart..." : "No data available."}</p>}
        </section>
        <section className="min-w-0 overflow-hidden rounded-[15px] border border-[#dfe6f1] bg-white shadow-[0_1px_3px_rgba(19,35,65,.07)] dark:border-app-border dark:bg-app-surface">
          <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f1] px-5 py-5 dark:border-app-border sm:px-6">
            <div><h2 className="flex items-center gap-2 text-[16px] font-bold"><Activity size={20} className="text-[#2954ed]"/>Recent activity</h2><p className="mt-1 text-[12px] text-[#8998b4]">Your latest verifications</p></div>
            <button type="button" onClick={() => navigate("/retailer/verification-history")} className="text-[12px] font-semibold text-[#526383] hover:text-[#2954ed] dark:text-app-text-secondary">All</button>
          </div>
          <div className="divide-y divide-[#e2e8f1] dark:divide-app-border">
            {!activity.length && <p className="px-5 py-10 text-center text-[13px] text-[#8998b4]">{loading ? "Loading activity..." : "No verifications yet."}</p>}
            {activity.map(({ id, name, detail, status, icon: Icon }) => (
              <div key={id} className="flex min-w-0 items-center gap-2 px-3 py-4 sm:gap-3 sm:px-5">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${status === "Failed" ? "bg-[#ffeaed] text-[#e53e4d]" : status === "Pending" ? "bg-[#fff2dc] text-[#d88800]" : "bg-[#e4f6ed] text-[#10a067]"}`}><Icon size={19}/></span>
                <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold sm:text-[13px]">{name}</p><p className="mt-1 text-[11px] text-[#8b9ab6]">{detail}</p></div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-[11px] ${status === "Failed" ? "bg-[#ffeaed] text-[#e53e4d]" : status === "Pending" ? "bg-[#fff2dc] text-[#d88800]" : "bg-[#e4f6ed] text-[#0a9b5c]"}`}>● {status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} onSubmitted={submitTopUp}/>}
    </div>
  );
}
