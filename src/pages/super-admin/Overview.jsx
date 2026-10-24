import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {

  Store, UserRoundCheck, ShieldCheck, BadgeCheck, CircleX, Activity,

  IndianRupee, ArrowLeftRight, FileBarChart, Wallet, UserRoundPlus,

  LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart3,

  Gauge, History, Trophy, BellRing, ArrowRight, ChevronRight,

  Fingerprint, Landmark, CreditCard, FileSignature, HandCoins,

  AlertTriangle, FileCheck2, TrendingUp, TrendingDown, X, Eye, EyeOff, RefreshCw, CheckCircle2

} from "lucide-react";

import {

  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,

  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,

  ComposedChart

} from "recharts";

// All values are illustrative demo data. Replace with API responses later.

const chartTheme = { color: "var(--app-text-secondary)" };

const metrics = [

  { label: "Total Retailers", value: "12", icon: Store, bg: "#eef2ff", color: "#2451ea", note: "+2 onboarded in 30 days" },

  { label: "Active Retailers", value: "10", icon: UserRoundCheck, bg: "#e5f7ed", color: "#078448", note: "83% of network active" },

  { label: "Total KYC Verifications", value: "547", icon: ShieldCheck, bg: "#f0eaff", color: "#683bea", change: "2.4%", note: "last 30 days vs prior", positive: true },

  { label: "Successful Verifications", value: "497", icon: BadgeCheck, bg: "#e5f7ed", color: "#078448", change: "13.3%", note: "90.9% success rate", positive: true },

  { label: "Failed Verifications", value: "50", icon: CircleX, bg: "#ffebee", color: "#e02836", change: "57.9%", down: true, note: "9.1% of all requests", positive: true },

  { label: "Today's Transactions", value: "0", icon: Activity, bg: "#e6f4ff", color: "#087cbe", change: "100.0%", down: true, note: "₹0 billed · pace vs 7-day avg", positive: false },

  { label: "Total Revenue", value: "₹9,280", icon: IndianRupee, bg: "#eef2ff", color: "#2451ea", change: "1.2%", note: "gross billed to retailers", positive: true },

  { label: "Wallet Transactions", value: "559", icon: ArrowLeftRight, bg: "#fff2df", color: "#d97706", change: "4.0%", note: "₹45,000 credited in total", positive: true },

];

const monthly = [

  { month: "May", verified: 55, failed: 0, pending: 0, revenue: 1050, cost: 450, margin: 600 },

  { month: "Jun", verified: 60, failed: 8, pending: 0, revenue: 1150, cost: 470, margin: 680 },

  { month: "Jul", verified: 73, failed: 5, pending: 0, revenue: 1230, cost: 490, margin: 740 },

  { month: "Aug", verified: 98, failed: 11, pending: 0, revenue: 1790, cost: 730, margin: 1060 },

  { month: "Sept", verified: 112, failed: 16, pending: 0, revenue: 2230, cost: 945, margin: 1285 },

  { month: "Oct", verified: 88, failed: 8, pending: 0, revenue: 1650, cost: 670, margin: 980 },

];

const categories = [

  { name: "Aadhaar Verification (OTP)", value: 167, percent: 31, color: "#6845e8" },

  { name: "PAN Card Verification", value: 171, percent: 31, color: "#2850e8" },

  { name: "Bank Account Verification (Penny Drop)", value: 136, percent: 25, color: "#0b83c7" },

  { name: "Consent Letter with e-Sign", value: 73, percent: 13, color: "#0d9388" },

];

const successServices = [

  { name: "Aadhaar verification", rate: 92.8, color: "#6845e8" },

  { name: "PAN verification", rate: 88.9, color: "#2850e8" },

  { name: "Bank verification", rate: 89.0, color: "#0b83c7" },

  { name: "e-Sign verification", rate: 94.5, color: "#0d9388" },

];

const records = [

  { id: "VRF26102154232", retailer: "Green Valley Traders", service: "Aadhaar", doc: "XXXX XXXX 0442", status: "Verified", amount: 20, ago: "1d ago" },

  { id: "VRF26102133499", retailer: "Sai Digital Services", service: "Bank", doc: "XXXXXX1027", status: "Verified", amount: 15, ago: "2d ago" },

  { id: "VRF26102133346", retailer: "Metro Fintech Hub", service: "PAN", doc: "MWXXXXX51Q", status: "Verified", amount: 10, ago: "2d ago" },

  { id: "VRF26102105816", retailer: "Royal Enterprises", service: "PAN", doc: "CFXXXXX51Q", status: "Failed", amount: 10, ago: "2d ago" },

  { id: "VRF26102160045", retailer: "Metro Fintech Hub", service: "Aadhaar", doc: "XXXX XXXX 4682", status: "Verified", amount: 20, ago: "2d ago" },

  { id: "VRF26102158760", retailer: "Metro Fintech Hub", service: "Bank", doc: "XXXXXX9833", status: "Verified", amount: 15, ago: "2d ago" },

  { id: "VRF26102061119", retailer: "Shree Ganesh Mobile Point", service: "e-Sign", doc: "CL-2610209040", status: "Verified", amount: 30, ago: "2d ago" },

];

const topRetailers = [

  { name: "Royal Enterprises", amount: 400, checks: 20 },

  { name: "Annapurna Finserv Kendra", amount: 290, checks: 17 },

  { name: "Green Valley Traders", amount: 255, checks: 12 },

  { name: "Metro Fintech Hub", amount: 250, checks: 17 },

  { name: "Balaji Online Seva", amount: 200, checks: 10 },

];

const initialAlerts = [

  { id: 1, title: "Fund request · ₹5,000", detail: "Shree Ganesh Mobile Point · 2d ago", icon: HandCoins, path: "/super-admin/wallet" },

  { id: 2, title: "Fund request · ₹2,000", detail: "Balaji Online Seva · 2d ago", icon: HandCoins, path: "/super-admin/wallet" },

  { id: 3, title: "Aadhaar OTP latency", detail: "Provider response time elevated · 3d ago", icon: AlertTriangle, path: "/super-admin/kyc-services" },

  { id: 4, title: "Monthly report generated", detail: "September summary available · 4d ago", icon: FileCheck2, path: "/super-admin/reports" },

];

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

function TrendPanel({ navigate }) {

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

            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--app-text-secondary)", fontSize: 12 }} dy={9} />

            <YAxis domain={[0, 120]} ticks={[0, 20, 40, 60, 80, 100, 120]} axisLine={false} tickLine={false} tick={{ fill: "var(--app-text-secondary)", fontSize: 12 }} />

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

function CategoryPanel() {

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

          <span className="text-[32px] font-bold text-app-text">547</span>

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

function RevenuePanel() {

  return (

    <section className={`${card} p-5 sm:p-6`}>

      <SectionTitle icon={BarChart3} title="Revenue analytics" subtitle="Retailer billing vs provider cost — illustrative demo pricing"

        action={<div className="flex gap-5">

          <div><p className={muted}>Gross margin (30d)</p><p className="text-[19px] font-bold text-app-text">₹1,285</p></div>

          <div><p className={muted}>Margin %</p><p className="text-[19px] font-bold text-app-text">58.5%</p></div>

        </div>}

      />

      <div className="mt-5 h-[250px] w-full min-w-0 sm:mt-7 sm:h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

          <ComposedChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>

            <CartesianGrid stroke="var(--app-border)" vertical={false} />

            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--app-text-secondary)", fontSize: 12 }} dy={8} />

            <YAxis domain={[0, 2500]} ticks={[0, 500, 1000, 1500, 2000, 2500]} tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`} axisLine={false} tickLine={false} tick={{ fill: "var(--app-text-secondary)", fontSize: 11 }} width={65} />

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

function SuccessPanel() {

  const rate = 90.9;

  return (

    <section className={`${card} p-5 sm:p-6`}>

      <SectionTitle icon={Gauge} title="Verification success rate" subtitle="All-time, by outcome and service" />

      <div className="relative mx-auto mt-6 h-[175px] w-full max-w-[340px] overflow-hidden">

        <svg viewBox="0 0 340 185" className="h-full w-full" aria-label="Verification success rate 90.9 percent">

          <path d="M 26 168 A 144 144 0 0 1 314 168" fill="none" stroke="#e83b47" strokeWidth="37" strokeLinecap="butt" />

          <path d="M 26 168 A 144 144 0 0 1 307.9 126" fill="none" stroke="#0f9857" strokeWidth="37" strokeLinecap="butt" />

        </svg>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">

          <strong className="text-[34px] leading-none text-app-text">90.9%</strong>

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

  const { Icon, bg, color } = configs[service];

  return <span className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: bg, color }}><Icon size={17} /></span>{service}</span>;

}

function ActivityPanel({ navigate }) {

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

            {records.map((record) => (

              <tr key={record.id} className="border-b border-app-border last:border-b-0 hover:bg-app-surface-muted">

                <td className="whitespace-nowrap px-4 py-4"><div className="font-mono text-[12px] font-semibold text-app-text">{record.id}</div><div className="mt-1 text-[11px] text-app-text-secondary">{record.ago}</div></td>

                <td className="px-4 py-4 text-[12px] font-semibold text-app-text">{record.retailer}</td>

                <td className="whitespace-nowrap px-4 py-4 text-[12px] font-medium text-app-text"><ServiceIcon service={record.service} /></td>

                <td className="whitespace-nowrap px-4 py-4 font-mono text-[12px] text-app-text">{record.doc}</td>

                <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${record.status === "Verified" ? "bg-[#e5f7ed] text-[#078448]" : "bg-[#ffebee] text-[#df2737]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{record.status}</span></td>

                <td className="whitespace-nowrap px-4 py-4 text-right text-[13px] font-bold text-app-text">₹{record.amount}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>

  );

}

function RetailersPanel() {

  return (

    <section className={card}>

      <div className="border-b border-app-border p-5 sm:p-6">

        <SectionTitle icon={Trophy} title="Top performing retailers" subtitle="By billed volume · last 30 days" />

      </div>

      {topRetailers.map((retailer, i) => (

        <div key={retailer.name} className="flex items-center gap-3 border-b border-app-border px-5 py-4 last:border-b-0">

          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${i === 0 ? "bg-[#fff1cc] text-[#936100]" : i === 2 ? "bg-[#ffebdf] text-[#a14c19]" : "bg-[#eef2f7] text-[#42577a]"}`}>{i + 1}</div>

          <div className="min-w-0 flex-1">

            <p className="truncate text-[12px] font-semibold text-app-text">{retailer.name}</p>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-surface-muted">

              <div className="h-full rounded-full bg-[#2850e8]" style={{ width: `${(retailer.amount / 400) * 100}%` }} />

            </div>

          </div>

          <div className="shrink-0 text-right">

            <p className="text-[13px] font-bold text-app-text">₹{retailer.amount}</p>

            <p className="mt-1 text-[11px] text-app-text-secondary">{retailer.checks} checks</p>

          </div>

        </div>

      ))}

    </section>

  );

}

function AlertsPanel({ navigate }) {

  const [dismissed, setDismissed] = useState([]);

  const visibleAlerts = initialAlerts.filter((alert) => !dismissed.includes(alert.id));

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

      }) : <p className="p-6 text-[13px] text-app-text-secondary">No pending alerts.</p>}

    </section>

  );

}

// These dialogs are frontend demos. No money is moved and no real account is created.

const retailerOptions = [

  "Annapurna Finserv Kendra · RT1003",

  "Shree Ganesh Mobile Point · RT1001",

  "Balaji Online Seva · RT1002",

  "Royal Enterprises · RT1004",

  "Green Valley Traders · RT1005",

  "Metro Fintech Hub · RT1006",

];

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

  const [retailer, setRetailer] = useState(retailerOptions[0]);

  const [type, setType] = useState("credit");

  const [amount, setAmount] = useState("");

  const [mode, setMode] = useState("NEFT");

  const [reference, setReference] = useState(createReference);

  const [remarks, setRemarks] = useState("");

  const [review, setReview] = useState(false);

  const [error, setError] = useState("");

  const validate = () => {

    const n = Number(amount);

    if (!retailer || !Number.isFinite(n) || n <= 0) { setError("Please select a retailer and enter an amount greater than ₹0."); return; }

    if (!reference.trim()) { setError("Transaction reference number is required."); return; }

    setError(""); setReview(true);

  };

  const save = () => {

    const transaction = { id: reference.trim(), retailer, type, amount: Number(amount), mode, remarks: remarks.trim(), createdAt: new Date().toISOString() };

    try {

      const existing = JSON.parse(localStorage.getItem("verifyhub-demo-wallet-adjustments") || "[]");

      localStorage.setItem("verifyhub-demo-wallet-adjustments", JSON.stringify([transaction, ...existing]));

    } catch { localStorage.setItem("verifyhub-demo-wallet-adjustments", JSON.stringify([transaction])); }

    onSaved(`${type === "credit" ? "Credit" : "Debit"} of ₹${Number(amount).toLocaleString("en-IN")} saved as a demo transaction.`);

  };

  return (

    <DialogShell title="Wallet adjustment" subtitle="Credit or debit a retailer wallet. Demo only — no real money moves." icon={Wallet} onClose={onClose}

      footer={<><button className={secondaryBtn} onClick={review ? () => setReview(false) : onClose}>{review ? "Back to edit" : "Cancel"}</button><button className={primaryBtn} onClick={review ? save : validate}><ShieldCheck size={17}/>{review ? "Confirm demo adjustment" : "Review & confirm"}</button></>}>

      {review ? (

        <div className="space-y-4">

          <p className="rounded-xl bg-brand-primary-light p-4 text-[13px] text-app-text">Please review the details below. Confirming saves a <strong>local demo transaction only</strong>.</p>

          {[["Retailer", retailer],["Adjustment", type === "credit" ? "Add balance (Credit)" : "Deduct (Debit)"],["Amount", `₹${Number(amount).toLocaleString("en-IN")}`],["Payment mode", mode],["Reference", reference],["Remarks", remarks || "—"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-app-border py-2 text-[13px]"><span className="text-app-text-secondary">{label}</span><strong className="text-right text-app-text">{value}</strong></div>)}

        </div>

      ) : (

        <div className="space-y-5">

          <div><label className={fieldLabel}>Retailer <span className="text-red-600">*</span></label><select className={fieldClass} value={retailer} onChange={(e) => setRetailer(e.target.value)}>{retailerOptions.map((item) => <option key={item}>{item}</option>)}</select></div>

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

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {

    e.preventDefault();

    const { business, owner, mobile, email, address, pan, gst, password } = form;

    if (![business,owner,mobile,email,address,pan,password].every((v) => v.trim())) { setError("Please fill all required fields."); return; }

    if (!/^[6-9]\d{9}$/.test(mobile)) { setError("Enter a valid 10-digit Indian mobile number."); return; }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase())) { setError("Enter a valid PAN number (e.g. ABCPK1234L)."); return; }

    if (gst && !/^\d{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(gst.toUpperCase())) { setError("Enter a valid GST number or leave it blank."); return; }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) { setError("Password must have at least 8 characters, including letters and numbers."); return; }

    const entry = { id: "RT" + Date.now().toString().slice(-6), business, owner, mobile, email, address, panMasked: pan.slice(0,2).toUpperCase() + "XXXXXX" + pan.slice(-2).toUpperCase(), gstMasked: gst ? gst.slice(0,2) + "XXXXXXXX" + gst.slice(-3) : "", status: form.status, createdAt: new Date().toISOString() };

    // Password is deliberately not saved to localStorage. Real account creation requires a backend.

    try { const old = JSON.parse(localStorage.getItem("verifyhub-demo-retailers") || "[]"); localStorage.setItem("verifyhub-demo-retailers", JSON.stringify([entry, ...old])); }

    catch { localStorage.setItem("verifyhub-demo-retailers", JSON.stringify([entry])); }

    onSaved(`${business} added to local demo retailers. Backend login credentials have not been created.`);

  };

  return (

    <DialogShell wide title="Add new retailer" subtitle="Create a partner account with dashboard login credentials." icon={UserRoundPlus} onClose={onClose}

      footer={<><button type="button" onClick={onClose} className={secondaryBtn}>Cancel</button><button type="submit" form="retailer-create-form" className={primaryBtn}><UserRoundPlus size={17}/>Create retailer</button></>}>

      <form id="retailer-create-form" onSubmit={submit} className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

        <div><label className={fieldLabel}>Business / shop name <span className="text-red-600">*</span></label><input autoFocus className={fieldClass} value={form.business} onChange={(e) => set("business",e.target.value)} placeholder="e.g. Shree Ganesh Mobile Point"/></div>

        <div><label className={fieldLabel}>Owner name <span className="text-red-600">*</span></label><input className={fieldClass} value={form.owner} onChange={(e) => set("owner",e.target.value)} placeholder="Full name as per PAN"/></div>

        <div><label className={fieldLabel}>Mobile number <span className="text-red-600">*</span></label><div className="flex"><span className="flex h-[51px] items-center rounded-l-xl border border-r-0 border-app-border bg-app-surface-muted px-3 text-[13px] font-semibold">+91</span><input inputMode="numeric" maxLength={10} className={`${fieldClass} rounded-l-none`} value={form.mobile} onChange={(e) => set("mobile",e.target.value.replace(/\D/g,""))} placeholder="10-digit mobile"/></div></div>

        <div><label className={fieldLabel}>Email address <span className="text-red-600">*</span></label><input type="email" className={fieldClass} value={form.email} onChange={(e) => set("email",e.target.value)} placeholder="owner@business.in"/></div>

        <div className="sm:col-span-2"><label className={fieldLabel}>Business address <span className="text-red-600">*</span></label><textarea rows={3} className={`${fieldClass} h-auto resize-y py-3`} value={form.address} onChange={(e) => set("address",e.target.value)} placeholder="Shop no., street, city, state - PIN"/></div>

        <div><label className={fieldLabel}>PAN number <span className="text-red-600">*</span></label><input maxLength={10} className={`${fieldClass} uppercase`} value={form.pan} onChange={(e) => set("pan",e.target.value.toUpperCase())} placeholder="ABCPK1234L"/><p className="mt-1 text-[11px] text-app-text-secondary">Stored masked in demo listings.</p></div>

        <div><label className={fieldLabel}>GST number <span className="font-normal text-app-text-secondary">Optional</span></label><input maxLength={15} className={`${fieldClass} uppercase`} value={form.gst} onChange={(e) => set("gst",e.target.value.toUpperCase())} placeholder="24ABCPK1234L1Z5"/></div>

        <div><label className={fieldLabel}>Login password <span className="text-red-600">*</span></label><div className="relative"><input type={showPassword ? "text" : "password"} className={`${fieldClass} pr-12`} value={form.password} onChange={(e) => set("password",e.target.value)} placeholder="Min. 8 chars, letters & numbers"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-app-text">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>

        <div><label className={fieldLabel}>Retailer status</label><select className={fieldClass} value={form.status} onChange={(e) => set("status",e.target.value)}><option value="Active">Active — can log in</option><option value="Inactive">Inactive — login disabled</option><option value="Pending">Pending approval</option></select></div>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-[12px] text-red-700 sm:col-span-2">{error}</p>}

        <p className="text-[11px] leading-5 text-app-text-secondary sm:col-span-2">Frontend demo: this saves a masked retailer record in this browser only. It does not create a real login account or transmit credentials.</p>

      </form>

    </DialogShell>

  );

}

export default function Overview() {

  const navigate = useNavigate();

  const [activeDialog, setActiveDialog] = useState(null);

  const [toast, setToast] = useState("");

  const finish = (message) => { setActiveDialog(null); setToast(message); };

  return (

    <div className="min-h-screen min-w-0 overflow-x-hidden bg-app-background px-3 py-5 font-['Poppins',sans-serif] sm:px-6 lg:px-7">

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <div>

          <h1 className="text-[25px] font-bold tracking-tight text-app-text sm:text-[28px]">Good afternoon, Arvind</h1>

          <p className="mt-1.5 text-[13px] text-app-text-secondary">Platform performance across 12 retailers · Friday, 23 October 2026</p>

        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">

          <button onClick={() => navigate("/super-admin/reports")} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface px-2 text-[11px] sm:px-4 sm:text-[12px] font-semibold text-app-text shadow-sm hover:bg-app-surface-muted"><FileBarChart size={17} />View reports</button>

          <button onClick={() => setActiveDialog("wallet")} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface px-2 text-[11px] sm:px-4 sm:text-[12px] font-semibold text-app-text shadow-sm hover:bg-app-surface-muted"><Wallet size={17} />Add balance</button>

          <button onClick={() => setActiveDialog("retailer")} className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2850e8] px-4 text-[12px] sm:col-span-1 font-semibold text-white shadow-sm hover:bg-[#1c3ec6]"><UserRoundPlus size={17} />Add retailer</button>

        </div>

      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {metrics.map((item) => <MetricCard key={item.label} item={item} />)}

      </div>

      <div className="mt-5 grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(350px,1fr)]">

        <TrendPanel navigate={navigate} />

        <CategoryPanel />

      </div>

      <div className="mt-5 grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(350px,1fr)]">

        <RevenuePanel />

        <SuccessPanel />

      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(350px,1fr)]">

        <ActivityPanel navigate={navigate} />

        <div className="flex min-w-0 flex-col gap-5">

          <RetailersPanel />

          <AlertsPanel navigate={navigate} />

        </div>

      </div>

      {activeDialog === "wallet" && <WalletDialog onClose={() => setActiveDialog(null)} onSaved={finish} />}

      {activeDialog === "retailer" && <RetailerDialog onClose={() => setActiveDialog(null)} onSaved={finish} />}

      {toast && <div role="status" className="fixed bottom-4 left-4 right-4 z-[110] sm:bottom-5 sm:left-auto sm:right-5 flex max-w-[430px] items-start gap-3 rounded-xl border border-[#bdebd0] bg-app-surface p-4 text-[13px] text-[#115c37] shadow-xl"><CheckCircle2 className="shrink-0" size={20}/><span>{toast}</span><button aria-label="Dismiss" onClick={() => setToast("")}><X size={16}/></button></div>}

    </div>

  );

}
