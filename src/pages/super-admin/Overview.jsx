import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import api, { getErrorMessage } from "../../api";

import { getUser } from "../../auth";

import {

  Store, UserRoundCheck, ShieldCheck, BadgeCheck, CircleX, Activity,

  IndianRupee, ArrowLeftRight, FileBarChart, Wallet, UserRoundPlus,

  LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart3,

  Gauge, History, Trophy, BellRing, ArrowRight, ChevronRight,

  Fingerprint, Landmark, CreditCard, FileSignature, HandCoins,

  TrendingUp, TrendingDown, X, Eye, EyeOff, RefreshCw, CheckCircle2

} from "lucide-react";

import {

  ResponsiveContainer, AreaChart, Area, Line, Bar,

  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,

  ComposedChart

} from "recharts";

// All dashboard data comes from GET /admin/overview.

const chartTheme = { color: "var(--app-text-secondary)" };

const SERVICE_META = {

  aadhaar: { label: "Aadhaar", rateLabel: "Aadhaar verification", color: "#6845e8" },

  pan: { label: "PAN", rateLabel: "PAN verification", color: "#2850e8" },

  bank: { label: "Bank", rateLabel: "Bank verification", color: "#0b83c7" },

  esign: { label: "e-Sign", rateLabel: "e-Sign verification", color: "#0d9388" },

};

const formatINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

function timeAgo(iso) {

  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  if (!Number.isFinite(minutes)) return "";

  if (minutes < 1) return "just now";

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;

}

function greeting() {

  const hour = new Date().getHours();

  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

}

// The backend's KPI "trend" percentages are hardcoded placeholders, so they are
// intentionally not shown; only real counts, amounts and subtexts are displayed.

function buildMetrics(kpis) {

  const value = (key, format = formatCount) => (kpis?.[key] ? format(kpis[key].value) : "—");

  const note = (key) => kpis?.[key]?.subtext ?? "";

  return [

    { label: "Total Retailers", value: value("total_retailers"), icon: Store, bg: "#eef2ff", color: "#2451ea", note: note("total_retailers") },

    { label: "Active Retailers", value: value("active_retailers"), icon: UserRoundCheck, bg: "#e5f7ed", color: "#078448", note: note("active_retailers") },

    { label: "Total KYC Verifications", value: value("total_verifications"), icon: ShieldCheck, bg: "#f0eaff", color: "#683bea", note: kpis ? "all-time requests" : "" },

    { label: "Successful Verifications", value: value("successful_verifications"), icon: BadgeCheck, bg: "#e5f7ed", color: "#078448", note: note("successful_verifications") },

    { label: "Failed Verifications", value: value("failed_verifications"), icon: CircleX, bg: "#ffebee", color: "#e02836", note: note("failed_verifications") },

    { label: "Today's Transactions", value: value("todays_transactions"), icon: Activity, bg: "#e6f4ff", color: "#087cbe", note: note("todays_transactions") },

    { label: "Total Revenue", value: value("total_revenue", formatINR), icon: IndianRupee, bg: "#eef2ff", color: "#2451ea", note: note("total_revenue") },

    { label: "Wallet Transactions", value: value("wallet_transactions"), icon: ArrowLeftRight, bg: "#fff2df", color: "#d97706", note: note("wallet_transactions") },

  ];

}

const card = "min-w-0 overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-[0_1px_3px_rgba(17,36,75,0.07)]";

const heading = "text-[17px] font-bold text-app-text";

const muted = "text-[13px] text-app-text-secondary";

function SectionTitle({ icon: Icon, title, subtitle, action }) {

  return (

    <div className="flex flex-wrap items-start justify-between gap-3">

      <div>

        <h2 className={`flex items-center gap-2.5 ${heading}`}>

          <Icon size={20} strokeWidth={2} className="text-[#2451ea]" />

          {title}

        </h2>

        <p className={`mt-1 ${muted}`}>{subtitle}</p>

      </div>

      {action}

    </div>

  );

}

function MetricCard({ item }) {

  const Icon = item.icon;

  return (

    <div className={`${card} flex min-h-[165px] flex-col justify-between p-5`}>

      <div className="flex items-start justify-between gap-3">

        <p className="text-[13px] font-medium text-app-text">{item.label}</p>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: item.bg, color: item.color }}>

          <Icon size={21} strokeWidth={1.9} />

        </div>

      </div>

      <div>

        <p className="text-[31px] font-bold leading-none tracking-tight text-app-text">{item.value}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-app-text-secondary">

          {item.change && (

            <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${item.positive ? "bg-[#e3f7ec] text-[#078448]" : "bg-[#ffeaed] text-[#dc2639]"}`}>

              {item.down ? <TrendingDown size={13} /> : <TrendingUp size={13} />}

              {item.change}

            </span>

          )}

          <span>{item.note}</span>

        </div>

      </div>

    </div>

  );

}

function TrendPanel({ navigate, monthly }) {

  return (

    <section className={`${card} p-5 sm:p-6`}>

      <SectionTitle

        icon={LineChartIcon}

        title="Monthly verification trends"

        subtitle="Verified vs failed requests · last 6 months"

        action={<button onClick={() => navigate("/super-admin/reports")} className="flex items-center gap-2 text-[13px] font-semibold text-app-text hover:text-[#2451ea]">Monthly report <ArrowRight size={17} /></button>}

      />

      <div className="mt-5 h-[250px] w-full min-w-0 sm:mt-7 sm:h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

          <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>

            <defs>

              <linearGradient id="verifiedArea" x1="0" y1="0" x2="0" y2="1">

                <stop offset="0%" stopColor="#2850e8" stopOpacity={0.2} />

                <stop offset="100%" stopColor="#2850e8" stopOpacity={0.015} />

              </linearGradient>

            </defs>

            <CartesianGrid stroke="var(--app-border)" vertical={false} />

            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--app-text-secondary)", fontSize: 12 }} dy={9} />

            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--app-text-secondary)", fontSize: 12 }} />

            <Tooltip contentStyle={{ borderRadius: 12, borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)", color: "var(--app-text)" }} />

            <Legend wrapperStyle={chartTheme} verticalAlign="top" align="right" height={40} iconType="circle" />

            <Area type="monotone" dataKey="verified" name="Verified" stroke="#1750ed" fill="url(#verifiedArea)" strokeWidth={3} dot={{ r: 4, fill: "var(--app-surface)", strokeWidth: 2 }} activeDot={{ r: 6 }} />

            <Line type="monotone" dataKey="failed" name="Failed" stroke="#f12c3b" strokeWidth={2.2} dot={{ r: 4, fill: "var(--app-surface)", strokeWidth: 2 }} />

            <Line type="monotone" dataKey="pending" name="Pending" stroke="#e5940a" strokeDasharray="5 4" strokeWidth={2} dot={false} />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </section>

  );

}

function CategoryPanel({ distribution }) {

  const categories = (distribution?.items ?? []).map((item) => ({

    name: item.name,

    value: Number(item.count) || 0,

    percent: Number(item.percentage) || 0,

    color: SERVICE_META[item.id]?.color ?? item.color,

  }));

  return (

    <section className={`${card} p-5 sm:p-6`}>

      <SectionTitle icon={PieChartIcon} title="Category distribution" subtitle="Share of all verifications by service" />

      <div className="relative mx-auto mt-4 h-[210px] max-w-[310px] sm:h-[235px]">

        <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie data={categories} dataKey="value" cx="50%" cy="50%" innerRadius={85} outerRadius={116} paddingAngle={2} startAngle={90} endAngle={-270} stroke="var(--app-surface)" strokeWidth={2}>

              {categories.map((item) => <Cell key={item.name} fill={item.color} />)}

            </Pie>

            <Tooltip formatter={(value) => [`${value} requests`, "Verifications"]} />

          </PieChart>

        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

          <span className="text-[32px] font-bold text-app-text">{distribution ? formatCount(distribution.total) : "—"}</span>

          <span className="text-[12px] text-app-text-secondary">total requests</span>

        </div>

      </div>

      <div className="mt-4 space-y-3">

        {categories.map((item) => (

          <div key={item.name} className="flex items-center gap-2.5 text-[12px] sm:text-[13px]">

            <span className="h-3 w-3 shrink-0 rounded" style={{ backgroundColor: item.color }} />

            <span className="min-w-0 flex-1 text-app-text">{item.name}</span>

            <span className="whitespace-nowrap font-bold text-app-text">{item.value} · {item.percent}%</span>

          </div>

        ))}

      </div>

    </section>

  );

}

function RevenuePanel({ analytics, monthly }) {

  return (

    <section className={`${card} p-5 sm:p-6`}>

      <SectionTitle icon={BarChart3} title="Revenue analytics" subtitle="Retailer billing vs provider cost · last 6 months"

        action={<div className="flex gap-5">

          <div><p className={muted}>Gross margin (30d)</p><p className="text-[19px] font-bold text-app-text">{analytics ? formatINR(analytics.gross_margin_30d) : "—"}</p></div>

          <div><p className={muted}>Margin %</p><p className="text-[19px] font-bold text-app-text">{analytics ? `${analytics.margin_percentage_30d}%` : "—"}</p></div>

        </div>}

      />

      <div className="mt-5 h-[250px] w-full min-w-0 sm:mt-7 sm:h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

          <ComposedChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>

            <CartesianGrid stroke="var(--app-border)" vertical={false} />

            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--app-text-secondary)", fontSize: 12 }} dy={8} />

            <YAxis tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`} axisLine={false} tickLine={false} tick={{ fill: "var(--app-text-secondary)", fontSize: 11 }} width={65} />

            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} contentStyle={{ borderRadius: 12, borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)", color: "var(--app-text)" }} />

            <Legend wrapperStyle={chartTheme} verticalAlign="top" align="right" height={38} iconType="circle" />

            <Bar dataKey="revenue" name="Revenue" fill="#2850e8" barSize={28} radius={[6, 6, 0, 0]} />

            <Bar dataKey="cost" name="Provider cost" fill="#c5cedb" barSize={28} radius={[6, 6, 0, 0]} />

            <Line dataKey="margin" name="Gross margin" type="monotone" stroke="#07914e" strokeWidth={2.7} dot={{ r: 4, fill: "#07914e" }} />

          </ComposedChart>

        </ResponsiveContainer>

      </div>

    </section>

  );

}

function SuccessPanel({ rates, hasVerifications }) {

  const rate = Math.min(100, Math.max(0, Number(rates?.overall) || 0));

  // Gauge arc: centre (170,168), radius 144, sweeping from 180° (left) to 0° (right).

  const angle = Math.PI * (1 - rate / 100);

  const endX = (170 + 144 * Math.cos(angle)).toFixed(1);

  const endY = (168 - 144 * Math.sin(angle)).toFixed(1);

  const successServices = Object.entries(rates?.services ?? {}).map(([id, value]) => ({

    name: SERVICE_META[id]?.rateLabel ?? id,

    rate: Number(value) || 0,

    color: SERVICE_META[id]?.color ?? "#2850e8",

  }));

  return (

    <section className={`${card} p-5 sm:p-6`}>

      <SectionTitle icon={Gauge} title="Verification success rate" subtitle="All-time, by outcome and service" />

      <div className="relative mx-auto mt-6 h-[175px] w-full max-w-[340px] overflow-hidden">

        <svg viewBox="0 0 340 185" className="h-full w-full" aria-label={`Verification success rate ${rate} percent`}>

          <path d="M 26 168 A 144 144 0 0 1 314 168" fill="none" stroke={hasVerifications ? "#e83b47" : "var(--app-border)"} strokeWidth="37" strokeLinecap="butt" />

          {rate > 0 && <path d={`M 26 168 A 144 144 0 0 1 ${endX} ${endY}`} fill="none" stroke="#0f9857" strokeWidth="37" strokeLinecap="butt" />}

        </svg>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">

          <strong className="text-[34px] leading-none text-app-text">{rates ? `${rate}%` : "—"}</strong>

          <span className="mt-2 text-[13px] text-app-text-secondary">verified</span>

        </div>

      </div>

      <div className="mt-6 space-y-4">

        {successServices.map((item) => (

          <div key={item.name}>

            <div className="mb-2 flex justify-between gap-2 text-[13px]">

              <span className="text-app-text">{item.name}</span>

              <span className="font-bold text-app-text">{item.rate.toFixed(1)}%</span>

            </div>

            <div className="h-2 overflow-hidden rounded-full bg-app-surface-muted">

              <div className="h-full rounded-full" style={{ width: `${item.rate}%`, backgroundColor: item.color }} />

            </div>

          </div>

        ))}

      </div>

    </section>

  );

}

function ServiceIcon({ service }) {

  const configs = {

    Aadhaar: { Icon: Fingerprint, bg: "#f1ebff", color: "#6845e8" },

    PAN: { Icon: CreditCard, bg: "#edf1ff", color: "#2850e8" },

    Bank: { Icon: Landmark, bg: "#e5f5ff", color: "#0b83c7" },

    "e-Sign": { Icon: FileSignature, bg: "#e5f7f4", color: "#0d9388" },

  };

  const { Icon, bg, color } = configs[service] ?? configs.PAN;

  return <span className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: bg, color }}><Icon size={17} /></span>{service}</span>;

}

function ActivityPanel({ navigate, activity, loading }) {

  const records = (activity ?? []).map((item) => ({

    id: item.id,

    retailer: item.retailer_name,

    service: SERVICE_META[item.service]?.label ?? item.service,

    doc: item.doc,

    status: item.status === "verified" ? "Verified" : item.status === "failed" ? "Failed" : "Pending",

    amount: item.amount,

    ago: timeAgo(item.created_at),

  }));

  return (

    <section className={card}>

      <div className="p-5 sm:p-6">

        <SectionTitle icon={History} title="Recent verification activity" subtitle="Latest requests across all retailers"

          action={<button onClick={() => navigate("/super-admin/verification-records")} className="rounded-lg border border-app-border bg-app-surface px-4 py-2.5 text-[12px] font-semibold text-app-text hover:bg-app-surface-muted">View all records</button>}

        />

      </div>

      <div className="w-full overflow-x-auto">

        <table className="w-full min-w-[790px] border-collapse text-left">

          <thead className="bg-app-surface-muted text-[11px] uppercase tracking-[0.04em] text-app-text-secondary">

            <tr>{["Verification", "Retailer", "Service", "Document", "Status", "Amount"].map((label) => <th key={label} className="border-y border-app-border px-4 py-3 font-semibold">{label}</th>)}</tr>

          </thead>

          <tbody>

            {!records.length && (

              <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-app-text-secondary">{loading ? "Loading recent activity..." : "No verification records found."}</td></tr>

            )}

            {records.map((record) => (

              <tr key={record.id} className="border-b border-app-border last:border-b-0 hover:bg-app-surface-muted">

                <td className="whitespace-nowrap px-4 py-4"><div className="font-mono text-[12px] font-semibold text-app-text">{record.id}</div><div className="mt-1 text-[11px] text-app-text-secondary">{record.ago}</div></td>

                <td className="px-4 py-4 text-[12px] font-semibold text-app-text">{record.retailer}</td>

                <td className="whitespace-nowrap px-4 py-4 text-[12px] font-medium text-app-text"><ServiceIcon service={record.service} /></td>

                <td className="whitespace-nowrap px-4 py-4 font-mono text-[12px] text-app-text">{record.doc}</td>

                <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${record.status === "Verified" ? "bg-[#e5f7ed] text-[#078448]" : record.status === "Failed" ? "bg-[#ffebee] text-[#df2737]" : "bg-[#fff2df] text-[#b45309]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{record.status}</span></td>

                <td className="whitespace-nowrap px-4 py-4 text-right text-[13px] font-bold text-app-text">{formatINR(record.amount)}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>

  );

}

function RetailersPanel({ retailers, loading }) {

  const topRetailers = (retailers ?? []).map((item) => ({ id: item.id, name: item.shop, amount: Number(item.total_spent) || 0, checks: item.checks_count }));

  const maxAmount = Math.max(0, ...topRetailers.map((item) => item.amount));

  return (

    <section className={card}>

      <div className="border-b border-app-border p-5 sm:p-6">

        <SectionTitle icon={Trophy} title="Top performing retailers" subtitle="By billed volume · all time" />

      </div>

      {!topRetailers.length && <p className="p-6 text-[13px] text-app-text-secondary">{loading ? "Loading retailers..." : "No retailers found."}</p>}

      {topRetailers.map((retailer, i) => (

        <div key={retailer.id} className="flex items-center gap-3 border-b border-app-border px-5 py-4 last:border-b-0">

          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${i === 0 ? "bg-[#fff1cc] text-[#936100]" : i === 2 ? "bg-[#ffebdf] text-[#a14c19]" : "bg-[#eef2f7] text-[#42577a]"}`}>{i + 1}</div>

          <div className="min-w-0 flex-1">

            <p className="truncate text-[12px] font-semibold text-app-text">{retailer.name}</p>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-surface-muted">

              <div className="h-full rounded-full bg-[#2850e8]" style={{ width: `${maxAmount ? (retailer.amount / maxAmount) * 100 : 0}%` }} />

            </div>

          </div>

          <div className="shrink-0 text-right">

            <p className="text-[13px] font-bold text-app-text">{formatINR(retailer.amount)}</p>

            <p className="mt-1 text-[11px] text-app-text-secondary">{retailer.checks} checks</p>

          </div>

        </div>

      ))}

    </section>

  );

}

// Only real pending fund requests are shown; the backend's static "notifications"
// entries in /admin/overview are demo placeholders and are skipped.

function AlertsPanel({ navigate, fundRequests, loading }) {

  const [dismissed, setDismissed] = useState([]);

  const alerts = (fundRequests ?? []).map((request) => ({

    id: request.id,

    title: `Fund request · ${formatINR(request.amount)}`,

    detail: `${request.retailer_name} · ${timeAgo(request.created_at)}`,

    icon: HandCoins,

    path: "/super-admin/wallet",

  }));

  const visibleAlerts = alerts.filter((alert) => !dismissed.includes(alert.id));

  return (

    <section className={card}>

      <div className="border-b border-app-border p-5 sm:p-6">

        <SectionTitle icon={BellRing} title="Alerts & notifications" subtitle="Items that need your attention" />

      </div>

      {visibleAlerts.length ? visibleAlerts.map((alert) => {

        const Icon = alert.icon;

        return (

          <div key={alert.id} className="flex items-center gap-3 border-b border-app-border px-5 py-4 last:border-b-0">

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary-light text-[#2850e8]"><Icon size={19} /></span>

            <button onClick={() => navigate(alert.path)} className="min-w-0 flex-1 text-left">

              <p className="text-[12px] font-semibold text-app-text">{alert.title}</p>

              <p className="mt-1 text-[11px] text-app-text-secondary">{alert.detail}</p>

            </button>

            <button onClick={() => setDismissed((prev) => [...prev, alert.id])} title="Dismiss notification" className="rounded-lg p-1.5 text-app-text-secondary hover:bg-brand-primary-light hover:text-[#2850e8]"><ChevronRight size={19} /></button>

          </div>

        );

      }) : <p className="p-6 text-[13px] text-app-text-secondary">{loading ? "Loading alerts..." : "No pending alerts."}</p>}

    </section>

  );

}

// Wallet adjustment → POST /admin/wallet/adjust, new retailer → POST /admin/retailers.

function createReference() {

  return "VHCR" + Date.now().toString(36).toUpperCase().slice(-9);

}

function DialogShell({ title, subtitle, icon: Icon, onClose, children, footer, wide = false }) {

  useEffect(() => {

    const keydown = (e) => { if (e.key === "Escape") onClose(); };

    window.addEventListener("keydown", keydown);

    const old = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => { window.removeEventListener("keydown", keydown); document.body.style.overflow = old; };

  }, [onClose]);

  return (

    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0c1732]/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[96dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-[20px] bg-app-surface shadow-2xl sm:max-h-[min(92vh,900px)] sm:rounded-[20px] ${wide ? "max-w-[975px]" : "max-w-[725px]"}`}>

        <div className="flex shrink-0 items-start gap-3 border-b border-app-border px-4 py-4 sm:gap-4 sm:px-7 sm:py-6">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary-light text-[#2451ea] sm:h-[50px] sm:w-auto sm:min-w-[100px] sm:flex-1"><Icon size={22}/></div>

          <div className="min-w-0 flex-1 sm:flex-[1.1]"><h2 className="text-[17px] font-bold text-app-text sm:text-[21px]">{title}</h2><p className="mt-1 text-[12px] leading-5 text-app-text-secondary sm:text-[14px] sm:leading-6">{subtitle}</p></div>

          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-2 text-app-text hover:bg-app-surface-muted"><X size={20}/></button>

        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-6">{children}</div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-app-border bg-app-surface-muted px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:gap-3 sm:px-7 sm:py-4 [&>button]:min-w-0 [&>button]:flex-1 sm:[&>button]:flex-none">{footer}</div>

      </div>

    </div>

  );

}

const fieldLabel = "mb-2 flex items-center justify-between text-[13px] font-semibold text-app-text";

const fieldClass = "h-[51px] w-full rounded-xl border border-app-border bg-app-surface px-4 text-[14px] text-app-text outline-none transition focus:border-[#2850e8] focus:ring-2 focus:ring-[#2850e8]/15";

const primaryBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2850e8] px-5 text-[13px] font-semibold text-white hover:bg-[#1e40bf]";

const secondaryBtn = "inline-flex min-h-11 items-center justify-center rounded-xl border border-app-border bg-app-surface px-5 text-[13px] font-semibold text-app-text hover:bg-app-surface-muted";

function WalletDialog({ onClose, onSaved }) {

  const [retailers, setRetailers] = useState([]);

  const [retailerId, setRetailerId] = useState("");

  const [loadingRetailers, setLoadingRetailers] = useState(true);

  const [saving, setSaving] = useState(false);

  const [type, setType] = useState("credit");

  const [amount, setAmount] = useState("");

  const [mode, setMode] = useState("NEFT");

  const [reference, setReference] = useState(createReference);

  const [remarks, setRemarks] = useState("");

  const [review, setReview] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {

    let active = true;

    api.get("/admin/retailers")

      .then(({ data }) => {

        if (!active) return;

        const list = data?.data ?? [];

        setRetailers(list);

        setRetailerId(list[0]?.id ?? "");

      })

      .catch((err) => { if (active) setError(getErrorMessage(err, "Unable to load retailers.")); })

      .finally(() => { if (active) setLoadingRetailers(false); });

    return () => { active = false; };

  }, []);

  const selectedRetailer = retailers.find((item) => item.id === retailerId);

  const retailerLabel = selectedRetailer ? `${selectedRetailer.shop} · ${selectedRetailer.id}` : "";

  const validate = () => {

    const n = Number(amount);

    if (!retailerId || !Number.isFinite(n) || n < 1) { setError("Please select a retailer and enter an amount of at least ₹1."); return; }

    if (type === "debit" && selectedRetailer && n > selectedRetailer.wallet) { setError(`Insufficient balance. Available: ${formatINR(selectedRetailer.wallet)}.`); return; }

    if (!reference.trim()) { setError("Transaction reference number is required."); return; }

    setError(""); setReview(true);

  };

  const save = async () => {

    if (saving) return;

    setSaving(true);

    setError("");

    try {

      const { data } = await api.post("/admin/wallet/adjust", { retailer_id: retailerId, type, amount: Number(amount), mode, ref: reference.trim(), note: remarks.trim() || undefined });

      onSaved(`${type === "credit" ? "Credit" : "Debit"} of ${formatINR(amount)} applied. New balance: ${formatINR(data?.data?.wallet?.balance)}.`);

    } catch (err) {

      setError(getErrorMessage(err, "Wallet adjustment failed. Please try again."));

      setReview(false);

    } finally {

      setSaving(false);

    }

  };

  return (

    <DialogShell title="Wallet adjustment" subtitle="Credit or debit a retailer wallet. The balance updates immediately." icon={Wallet} onClose={onClose}

      footer={<><button className={secondaryBtn} disabled={saving} onClick={review ? () => setReview(false) : onClose}>{review ? "Back to edit" : "Cancel"}</button><button className={`${primaryBtn} disabled:opacity-60`} disabled={saving || loadingRetailers || !retailers.length} onClick={review ? save : validate}><ShieldCheck size={17}/>{review ? (saving ? "Saving..." : "Confirm adjustment") : "Review & confirm"}</button></>}>

      {review ? (

        <div className="space-y-4">

          <p className="rounded-xl bg-brand-primary-light p-4 text-[13px] text-app-text">Please review the details below. Confirming will <strong>update the retailer's wallet balance</strong>.</p>

          {[["Retailer", retailerLabel],["Adjustment", type === "credit" ? "Add balance (Credit)" : "Deduct (Debit)"],["Amount", `₹${Number(amount).toLocaleString("en-IN")}`],["Payment mode", mode],["Reference", reference],["Remarks", remarks || "—"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-app-border py-2 text-[13px]"><span className="text-app-text-secondary">{label}</span><strong className="text-right text-app-text">{value}</strong></div>)}

        </div>

      ) : (

        <div className="space-y-5">

          <div><label className={fieldLabel}>Retailer <span className="text-red-600">*</span></label><select className={fieldClass} value={retailerId} disabled={loadingRetailers || !retailers.length} onChange={(e) => setRetailerId(e.target.value)}>{loadingRetailers ? <option value="">Loading retailers...</option> : retailers.length ? retailers.map((item) => <option key={item.id} value={item.id}>{item.shop} · {item.id}</option>) : <option value="">No retailers found</option>}</select>{selectedRetailer && <p className="mt-1 text-[11px] text-app-text-secondary">Current balance: {formatINR(selectedRetailer.wallet)}</p>}</div>

          <div className="grid grid-cols-1 gap-1 rounded-xl bg-app-surface-muted p-1 min-[420px]:grid-cols-2">

            {[["credit","Add balance (Credit)"],["debit","Deduct (Debit)"]].map(([value,label]) => <button type="button" key={value} onClick={() => setType(value)} className={`min-h-[46px] rounded-lg text-[13px] font-semibold transition ${type === value ? "bg-app-surface text-[#008743] dark:text-[#65e4ab] shadow-sm" : "text-app-text hover:bg-app-surface/50"}`}>{label}</button>)}

          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div><label className={fieldLabel}>Amount <span className="text-red-600">*</span></label><div className="flex"><span className="flex h-[51px] items-center rounded-l-xl border border-r-0 border-app-border bg-app-surface-muted px-4 text-app-text">₹</span><input type="number" min="1" step="1" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${fieldClass} rounded-l-none`} /></div>

              <div className="mt-3 flex flex-wrap gap-2">{[500,1000,2000,5000,10000].map((n) => <button key={n} type="button" onClick={() => setAmount(String(n))} className="rounded-full border border-app-border px-3 py-1.5 text-[12px] font-medium text-app-text hover:border-[#2850e8] hover:bg-brand-primary-light">₹{n.toLocaleString("en-IN")}</button>)}</div>

            </div>

            <div><label className={fieldLabel}>Payment mode</label><select className={fieldClass} value={mode} onChange={(e) => setMode(e.target.value)}>{["NEFT","IMPS","RTGS","UPI","Cash","Manual adjustment"].map((m) => <option key={m}>{m}</option>)}</select></div>

          </div>

          <div><label className={fieldLabel}>Transaction reference number <span className="text-red-600">*</span></label><div className="flex gap-2"><input className={`${fieldClass} font-mono`} value={reference} onChange={(e) => setReference(e.target.value)} /><button title="Generate new reference" type="button" onClick={() => setReference(createReference())} className="rounded-xl border border-app-border px-4 text-[#2850e8] hover:bg-brand-primary-light"><RefreshCw size={18}/></button></div></div>

          <div><label className={fieldLabel}>Remarks <span className="font-normal text-app-text-secondary">Optional</span></label><textarea rows={3} className={`${fieldClass} h-auto resize-y py-3`} placeholder="e.g. Top-up against bank transfer" value={remarks} onChange={(e) => setRemarks(e.target.value)}/></div>

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-[12px] text-red-700">{error}</p>}

        </div>

      )}

    </DialogShell>

  );

}

function RetailerDialog({ onClose, onSaved }) {

  const [form, setForm] = useState({ business:"", owner:"", mobile:"", email:"", address:"", pan:"", gst:"", password:"", status:"Active" });

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {

    e.preventDefault();

    if (saving) return;

    const { business, owner, mobile, email, address, pan, gst, password } = form;

    if (![business,owner,mobile,email,address,pan,password].every((v) => v.trim())) { setError("Please fill all required fields."); return; }

    if (!/^[6-9]\d{9}$/.test(mobile)) { setError("Enter a valid 10-digit Indian mobile number."); return; }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase())) { setError("Enter a valid PAN number (e.g. ABCPK1234L)."); return; }

    if (gst && !/^\d{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(gst.toUpperCase())) { setError("Enter a valid GST number or leave it blank."); return; }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) { setError("Password must have at least 8 characters, including letters and numbers."); return; }

    setError("");

    setSaving(true);

    try {

      const { data } = await api.post("/admin/retailers", {

        shop: business.trim(), owner: owner.trim(), mobile, email: email.trim(), address: address.trim(),

        pan: pan.toUpperCase(), gst: gst ? gst.toUpperCase() : undefined, password, status: form.status.toLowerCase(),

      });

      onSaved(`${business.trim()} (${data?.data?.id}) onboarded. They can now log in with the mobile/email and password you set.`);

    } catch (err) {

      setError(getErrorMessage(err, "Unable to create retailer. Please try again."));

    } finally {

      setSaving(false);

    }

  };

  return (

    <DialogShell wide title="Add new retailer" subtitle="Create a partner account with dashboard login credentials." icon={UserRoundPlus} onClose={onClose}

      footer={<><button type="button" onClick={onClose} className={secondaryBtn}>Cancel</button><button type="submit" form="retailer-create-form" disabled={saving} className={`${primaryBtn} disabled:opacity-60`}><UserRoundPlus size={17}/>{saving ? "Creating..." : "Create retailer"}</button></>}>

      <form id="retailer-create-form" onSubmit={submit} className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

        <div><label className={fieldLabel}>Business / shop name <span className="text-red-600">*</span></label><input autoFocus className={fieldClass} value={form.business} onChange={(e) => set("business",e.target.value)} placeholder="e.g. Shree Ganesh Mobile Point"/></div>

        <div><label className={fieldLabel}>Owner name <span className="text-red-600">*</span></label><input className={fieldClass} value={form.owner} onChange={(e) => set("owner",e.target.value)} placeholder="Full name as per PAN"/></div>

        <div><label className={fieldLabel}>Mobile number <span className="text-red-600">*</span></label><div className="flex"><span className="flex h-[51px] items-center rounded-l-xl border border-r-0 border-app-border bg-app-surface-muted px-3 text-[13px] font-semibold">+91</span><input inputMode="numeric" maxLength={10} className={`${fieldClass} rounded-l-none`} value={form.mobile} onChange={(e) => set("mobile",e.target.value.replace(/\D/g,""))} placeholder="10-digit mobile"/></div></div>

        <div><label className={fieldLabel}>Email address <span className="text-red-600">*</span></label><input type="email" className={fieldClass} value={form.email} onChange={(e) => set("email",e.target.value)} placeholder="owner@business.in"/></div>

        <div className="sm:col-span-2"><label className={fieldLabel}>Business address <span className="text-red-600">*</span></label><textarea rows={3} className={`${fieldClass} h-auto resize-y py-3`} value={form.address} onChange={(e) => set("address",e.target.value)} placeholder="Shop no., street, city, state - PIN"/></div>

        <div><label className={fieldLabel}>PAN number <span className="text-red-600">*</span></label><input maxLength={10} className={`${fieldClass} uppercase`} value={form.pan} onChange={(e) => set("pan",e.target.value.toUpperCase())} placeholder="ABCPK1234L"/><p className="mt-1 text-[11px] text-app-text-secondary">10 characters, e.g. ABCPK1234L.</p></div>

        <div><label className={fieldLabel}>GST number <span className="font-normal text-app-text-secondary">Optional</span></label><input maxLength={15} className={`${fieldClass} uppercase`} value={form.gst} onChange={(e) => set("gst",e.target.value.toUpperCase())} placeholder="24ABCPK1234L1Z5"/></div>

        <div><label className={fieldLabel}>Login password <span className="text-red-600">*</span></label><div className="relative"><input type={showPassword ? "text" : "password"} className={`${fieldClass} pr-12`} value={form.password} onChange={(e) => set("password",e.target.value)} placeholder="Min. 8 chars, letters & numbers"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-app-text">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>

        <div><label className={fieldLabel}>Retailer status</label><select className={fieldClass} value={form.status} onChange={(e) => set("status",e.target.value)}><option value="Active">Active — can log in</option><option value="Inactive">Inactive — login disabled</option></select></div>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-[12px] text-red-700 sm:col-span-2">{error}</p>}

        <p className="text-[11px] leading-5 text-app-text-secondary sm:col-span-2">This creates a real retailer account with a ₹0 wallet. The retailer can log in immediately if the status is Active.</p>

      </form>

    </DialogShell>

  );

}

export default function Overview() {

  const navigate = useNavigate();

  const [activeDialog, setActiveDialog] = useState(null);

  const [toast, setToast] = useState("");

  const [overview, setOverview] = useState(null);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const loadOverview = useCallback(() => api.get("/admin/overview")

    .then(({ data }) => { setOverview(data?.data ?? null); setLoadError(""); })

    .catch((err) => setLoadError(getErrorMessage(err, "Unable to load dashboard data.")))

    .finally(() => setLoading(false)), []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const retry = () => { setLoading(true); setLoadError(""); loadOverview(); };

  // Refresh the dashboard so new balances / retailers are reflected right away.

  const finish = (message) => { setActiveDialog(null); setToast(message); loadOverview(); };

  const firstName = getUser()?.name?.split(" ")[0] || "Admin";

  const totalRetailers = overview?.kpis?.total_retailers?.value;

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (

    <div className="min-h-screen min-w-0 overflow-x-hidden bg-app-background px-3 py-5 font-['Poppins',sans-serif] sm:px-6 lg:px-7">

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <div>

          <h1 className="text-[25px] font-bold tracking-tight text-app-text sm:text-[28px]">{greeting()}, {firstName}</h1>

          <p className="mt-1.5 text-[13px] text-app-text-secondary">{totalRetailers === undefined ? "Platform performance" : `Platform performance across ${formatCount(totalRetailers)} ${totalRetailers === 1 ? "retailer" : "retailers"}`} · {today}</p>

        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">

          <button onClick={() => navigate("/super-admin/reports")} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface px-2 text-[11px] sm:px-4 sm:text-[12px] font-semibold text-app-text shadow-sm hover:bg-app-surface-muted"><FileBarChart size={17} />View reports</button>

          <button onClick={() => setActiveDialog("wallet")} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface px-2 text-[11px] sm:px-4 sm:text-[12px] font-semibold text-app-text shadow-sm hover:bg-app-surface-muted"><Wallet size={17} />Add balance</button>

          <button onClick={() => setActiveDialog("retailer")} className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2850e8] px-4 text-[12px] sm:col-span-1 font-semibold text-white shadow-sm hover:bg-[#1c3ec6]"><UserRoundPlus size={17} />Add retailer</button>

        </div>

      </div>

      {loadError && (

        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">

          <span>{loadError}</span>

          <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-100"><RefreshCw size={15} />Retry</button>

        </div>

      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {buildMetrics(overview?.kpis).map((item) => <MetricCard key={item.label} item={item} />)}

      </div>

      <div className="mt-5 grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(350px,1fr)]">

        <TrendPanel navigate={navigate} monthly={overview?.monthly_trends ?? []} />

        <CategoryPanel distribution={overview?.category_distribution} />

      </div>

      <div className="mt-5 grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(350px,1fr)]">

        <RevenuePanel analytics={overview?.revenue_analytics} monthly={overview?.revenue_analytics?.monthly ?? []} />

        <SuccessPanel rates={overview?.success_rates} hasVerifications={Number(overview?.kpis?.total_verifications?.value) > 0} />

      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(350px,1fr)]">

        <ActivityPanel navigate={navigate} activity={overview?.recent_activity} loading={loading} />

        <div className="flex min-w-0 flex-col gap-5">

          <RetailersPanel retailers={overview?.top_retailers} loading={loading} />

          <AlertsPanel navigate={navigate} fundRequests={overview?.alerts?.fund_requests} loading={loading} />

        </div>

      </div>

      {activeDialog === "wallet" && <WalletDialog onClose={() => setActiveDialog(null)} onSaved={finish} />}

      {activeDialog === "retailer" && <RetailerDialog onClose={() => setActiveDialog(null)} onSaved={finish} />}

      {toast && <div role="status" className="fixed bottom-4 left-4 right-4 z-[110] sm:bottom-5 sm:left-auto sm:right-5 flex max-w-[430px] items-start gap-3 rounded-xl border border-[#bdebd0] bg-app-surface p-4 text-[13px] text-[#115c37] shadow-xl"><CheckCircle2 className="shrink-0" size={20}/><span>{toast}</span><button aria-label="Dismiss" onClick={() => setToast("")}><X size={16}/></button></div>}

    </div>

  );

}
