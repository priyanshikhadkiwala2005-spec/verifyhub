import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Store, Layers, IndianRupee, ArrowLeftRight,
  Download, Printer, Table2, ChevronLeft, ChevronRight,
  X, CheckCircle2, BarChart3
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, LineChart, Line
} from "recharts";
import api, { getErrorMessage } from "../../api";

// Data: GET /admin/reports?start_date&end_date returns every tab's dataset in one response.
// Note: the backend's monthly and revenue datasets are all-time (not limited to the date range),
// and its wallet dataset lists at most the latest 100 transactions in the range.
const TABS = [
  { id: "daily", name: "Daily verification", icon: CalendarDays },
  { id: "monthly", name: "Monthly verification", icon: CalendarDays },
  { id: "retailer", name: "Retailer-wise", icon: Store },
  { id: "service", name: "Service-wise", icon: Layers },
  { id: "revenue", name: "Revenue", icon: IndianRupee },
  { id: "wallet", name: "Wallet transactions", icon: ArrowLeftRight },
];
const BLUE = "#5275ff", RED = "#e23d45", AMBER = "#e39810", GREEN = "#07965a";
const pad = (n) => String(n).padStart(2, "0");
// Local calendar date (toISOString would shift the day for IST users near midnight).
const formatDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateLabel = (value, short = false) => new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", ...(short ? {} : { year: "numeric" }) });
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const CHRONOLOGICAL_TABS = ["daily", "monthly", "revenue", "wallet"];
const ALL_TIME_TABS = ["monthly", "revenue"];

function getDateRange(preset) {
  const end = new Date();
  const start = new Date(end);
  if (preset === "7D") start.setDate(end.getDate() - 6);
  if (preset === "30D") start.setDate(end.getDate() - 29);
  if (preset === "90D") start.setDate(end.getDate() - 89);
  if (preset === "6M") start.setMonth(end.getMonth() - 6);
  if (preset === "1Y") start.setFullYear(end.getFullYear() - 1);
  return [formatDate(start), formatDate(end)];
}
const [initialStart, initialEnd] = getDateRange("30D");

const verificationRow = (r, name, label = name) => ({ name, label, total: Number(r.total) || 0, verified: Number(r.verified) || 0, failed: Number(r.failed) || 0, pending: Number(r.pending) || 0, billed: Number(r.billed) || 0, success: Number(r.success_pct) || 0 });

// Groups wallet transactions (newest first from the API) into daily credit/debit totals, oldest first.
function walletByDay(transactions) {
  const groups = new Map();
  for (const tx of transactions) {
    const day = String(tx.created_at || "").split(",")[0];
    if (!groups.has(day)) groups.set(day, { name: day, label: day, total: 0, credits: 0, debits: 0, sort: new Date(day).getTime() || 0 });
    const g = groups.get(day);
    g.total += 1;
    if (tx.type === "credit") g.credits += Number(tx.amount) || 0;
    else g.debits += Number(tx.amount) || 0;
  }
  return [...groups.values()].sort((a, b) => a.sort - b.sort);
}

function toTabData(report, tab) {
  if (!report) return [];
  if (tab === "daily") return [...(report.daily?.table ?? [])].reverse().map((r) => verificationRow(r, dateLabel(r.raw_date, true), r.date));
  if (tab === "monthly") return [...(report.monthly?.table ?? [])].reverse().map((r) => verificationRow(r, r.month));
  if (tab === "retailer") return (report.retailer?.table ?? []).map((r) => verificationRow(r, r.shop));
  if (tab === "service") return (report.service?.table ?? []).map((r) => ({ ...verificationRow(r, r.name), cost: Number(r.provider_cost) || 0, margin: Number(r.gross_margin) || 0 }));
  if (tab === "revenue") return [...(report.revenue?.table ?? [])].reverse().map((r) => ({ name: r.month, label: r.month, total: Number(r.verifications) || 0, billed: Number(r.revenue) || 0, cost: Number(r.provider_cost) || 0, margin: Number(r.gross_margin) || 0 }));
  return walletByDay(report.wallet?.table ?? []);
}

function csvDownload(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.map(escape).join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\r\n");
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const card = "rounded-2xl border border-app-border bg-app-surface shadow-[0_1px_3px_rgba(21,37,75,.06)]";
const small = "text-[12px] font-semibold uppercase tracking-[.035em] text-app-text-muted";
const th = "whitespace-nowrap px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[.035em] text-app-text-muted";
const td = "whitespace-nowrap border-t border-app-border px-4 py-4 text-[13px] text-app-text";

export default function Reports() {
  const [tab, setTab] = useState("daily");
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [preset, setPreset] = useState("30D");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState("");
  const [version, setVersion] = useState(0);

  const validRange = Boolean(start && end && start <= end);
  useEffect(() => {
    if (!validRange) return;
    let active = true;
    api.get("/admin/reports", { params: { start_date: start, end_date: end } })
      .then(({ data }) => {
        if (!active) return;
        setReport(data?.data ?? null);
        setError("");
        setGenerated(new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }));
      })
      .catch((err) => { if (active) setError(getErrorMessage(err, "Unable to load reports.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [start, end, validRange, version]);

  const changeTab = (value) => { setTab(value); setPage(1); };
  const selectPreset = (value) => {
    const [a, b] = getDateRange(value);
    setStart(a); setEnd(b); setPreset(value); setPage(1);
  };
  const changeDate = (which, value) => {
    if (which === "start") setStart(value);
    else setEnd(value);
    setPreset(""); setPage(1);
  };
  const retry = () => { setLoading(true); setError(""); setVersion((v) => v + 1); };

  const data = useMemo(() => (validRange ? toTabData(report, tab) : []), [report, tab, validRange]);
  const kpis = report?.kpis;
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  // Charts read oldest → newest; the table lists newest first.
  const tableRows = CHRONOLOGICAL_TABS.includes(tab) ? [...data].reverse() : data;
  const visible = tableRows.slice((page - 1) * pageSize, page * pageSize);
  const title = TABS.find((t) => t.id === tab)?.name || "Report";
  const percent = (value) => `${Number(value || 0).toFixed(1)}%`;
  const summary = tab === "revenue" ? [
    ["GROSS REVENUE", money(report?.revenue_kpis?.gross_revenue)], ["PROVIDER COST", money(report?.revenue_kpis?.provider_cost)], ["GROSS MARGIN", money(report?.revenue_kpis?.gross_margin)], ["MARGIN %", percent(report?.revenue_kpis?.margin_pct)]
  ] : tab === "wallet" ? [
    ["WALLET TRANSACTIONS", report?.wallet_kpis?.transaction_count ?? 0], ["CREDITS", money(report?.wallet_kpis?.credits)], ["DEBITS", money(report?.wallet_kpis?.debits)], ["NET MOVEMENT", money(report?.wallet_kpis?.net_flow)]
  ] : tab === "monthly" ? [
    ["VERIFICATIONS", report?.monthly_kpis?.verifications ?? 0], ["SUCCESS RATE", percent(report?.monthly_kpis?.success_rate)], ["FAILED", report?.monthly_kpis?.failed ?? 0], ["BILLED", money(report?.monthly_kpis?.billed)]
  ] : [
    ["VERIFICATIONS", kpis?.verifications ?? 0], ["SUCCESS RATE", percent(kpis?.success_rate)], ["FAILED", kpis?.failed ?? 0], ["BILLED", money(kpis?.billed)]
  ];
  const walletTruncated = tab === "wallet" && (report?.wallet_kpis?.transaction_count ?? 0) > (report?.wallet?.table?.length ?? 0);
  const exportReport = () => {
    csvDownload(`verifyhub-${tab}-${ALL_TIME_TABS.includes(tab) ? "all-time" : `${start}-to-${end}`}.csv`, tableRows.map(({ name, label, total, verified, failed, pending, success, billed, cost, margin, credits, debits }) => (
      tab === "revenue" ? { Month: label, Verifications: total, "Revenue INR": billed, "Provider Cost INR": cost, "Margin INR": margin }
      : tab === "wallet" ? { Date: label, Transactions: total, "Credits INR": credits, "Debits INR": debits, "Net INR": credits - debits }
      : { Period: label || name, Total: total, Verified: verified, Failed: failed, Pending: pending, "Success %": Number(success || 0).toFixed(1), "Billed INR": billed, ...(tab === "service" ? { "Provider Cost INR": cost, "Margin INR": margin } : {}) }
    )));
    setToast("Report CSV exported successfully.");
  };
  const displayRange = ALL_TIME_TABS.includes(tab) ? "All time · grouped by month" : validRange ? `${dateLabel(start)} – ${dateLabel(end)}` : "Select a valid date range";
  const cols = tab === "revenue" ? ["MONTH", "VERIFICATIONS", "GROSS REVENUE", "PROVIDER COST", "GROSS MARGIN", "MARGIN %"] : tab === "wallet" ? ["DATE", "TRANSACTIONS", "CREDITS", "DEBITS", "NET MOVEMENT"] : [tab === "daily" ? "DATE" : tab === "monthly" ? "MONTH" : tab === "retailer" ? "RETAILER" : "SERVICE", "TOTAL", "VERIFIED", "FAILED", "PENDING", "SUCCESS %", "BILLED"];
  const emptyMessage = !validRange ? "Start date must be on or before the end date." : loading ? "Loading report..." : error ? error : "No data found for the selected period.";

  return (
    <div className="min-w-0 bg-app-background text-app-text print:bg-white">

      <div className="mx-auto max-w-[1700px] space-y-5 px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-[24px] font-bold tracking-[-.025em] sm:text-[27px]">Reports &amp; analytics</h1>
            <p className="mt-1 text-[13px] text-app-text-secondary sm:text-[14px]">Operational, financial and wallet reports with exportable data.</p>
            </div>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2.5 text-[13px] font-semibold shadow-sm hover:bg-app-surface-muted sm:px-4"><Printer size={17} />Print</button>
            <button onClick={exportReport} disabled={!data.length} className="inline-flex items-center gap-2 rounded-lg bg-[#2d50e7] px-3 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#2043d1] disabled:opacity-50 sm:px-4"><Download size={17} />Export CSV</button>
          </div>
        </div>

        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700 print:hidden"><span>{error}</span><button type="button" onClick={retry} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-100">Retry</button></div>}

        <div className={`${card} overflow-hidden print:hidden`}>
          <div className="flex gap-1 overflow-x-auto border-b border-app-border px-3 pt-1 sm:px-4">
            {TABS.map(({ id, name, icon: Icon }) => <button key={id} onClick={() => changeTab(id)} className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-4 text-[13px] font-semibold transition-colors sm:px-4 ${tab === id ? "border-primary text-primary" : "border-transparent text-app-text-secondary hover:text-primary"}`}><Icon size={17} />{name}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-4 py-4 sm:px-5">
            <span className="mr-1 text-[13px] font-semibold text-app-text-secondary">Date range</span>
            <input aria-label="Start date" type="date" value={start} max={end || undefined} onChange={(e) => changeDate("start", e.target.value)} className="min-w-0 rounded-lg border border-app-border bg-app-surface px-2 py-2.5 text-[13px] outline-none focus:border-primary sm:px-3" />
            <span className="text-app-text-muted">–</span>
            <input aria-label="End date" type="date" value={end} min={start || undefined} onChange={(e) => changeDate("end", e.target.value)} className="min-w-0 rounded-lg border border-app-border bg-app-surface px-2 py-2.5 text-[13px] outline-none focus:border-primary sm:px-3" />
            <div className="flex flex-wrap gap-1.5 sm:ml-1">{["7D", "30D", "90D", "6M", "1Y"].map((p) => <button key={p} onClick={() => selectPreset(p)} className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${preset === p ? "border-primary bg-brand-primary-light text-primary" : "border-app-border bg-app-surface text-app-text-secondary hover:bg-app-surface-muted"}`}>{p}</button>)}</div>
            <span className="w-full text-[12px] text-app-text-muted xl:ml-auto xl:w-auto">{generated ? `Generated ${generated}` : "Generating report..."}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {summary.map(([label, value]) => <div key={label} className="rounded-xl border border-app-border bg-app-surface p-4 sm:p-5">
            <p className={small}>{label}</p>
            <p className="mt-1 text-[21px] font-bold tracking-tight sm:text-[23px]">{report ? value : "—"}</p>
            </div>)}
        </div>

        <section className={`${card} min-w-0 p-4 sm:p-6`}>
          <div className="flex items-start gap-2.5"><BarChart3 size={20} className="mt-0.5 shrink-0 text-primary" />
            <div><h2 className="text-[16px] font-bold sm:text-[17px]">{title} report</h2>
            <p className="mt-1 text-[12px] text-app-text-muted sm:text-[13px]">{displayRange}</p>
            {walletTruncated && <p className="mt-1 text-[12px] text-app-text-muted">Chart and table show the latest {report.wallet.table.length} of {report.wallet_kpis.transaction_count} transactions; totals above include all of them.</p>}
            </div></div>
          {data.length ? <div className="mt-8 h-[310px] w-full sm:mt-10 sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {tab === "revenue" || tab === "wallet" ? <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                <CartesianGrid stroke="var(--app-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "var(--app-text-secondary)", fontSize: 11 }} interval="preserveStartEnd" angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "var(--app-text-secondary)", fontSize: 11 }} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ backgroundColor: "var(--app-surface)", color: "var(--app-text)", borderColor: "var(--app-border)", borderRadius: 12 }} labelStyle={{ color: "var(--app-text)" }} />
            <Legend verticalAlign="top" align="right" height={35} wrapperStyle={{ color: "var(--app-text-secondary)" }} />
                {tab === "revenue" ? <><Line name="Revenue" dataKey="billed" stroke={BLUE} strokeWidth={2.5} dot={data.length === 1} /><Line name="Provider cost" dataKey="cost" stroke={RED} strokeWidth={2} dot={data.length === 1} /><Line name="Gross margin" dataKey="margin" stroke={GREEN} strokeWidth={2} dot={data.length === 1} /></> : <><Line name="Credit" dataKey="credits" stroke={GREEN} strokeWidth={2.5} dot={data.length === 1} /><Line name="Debit" dataKey="debits" stroke={RED} strokeWidth={2.5} dot={data.length === 1} /></>}
              </LineChart> : <BarChart data={data} margin={{ top: 10, right: 8, left: -15, bottom: 25 }} barCategoryGap="20%">
                <CartesianGrid stroke="var(--app-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "var(--app-text-secondary)", fontSize: 11 }} interval={tab === "retailer" ? 0 : "preserveStartEnd"} angle={-35} textAnchor="end" height={75} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--app-text-secondary)", fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: "var(--app-surface)", color: "var(--app-text)", borderColor: "var(--app-border)", borderRadius: 12 }} labelStyle={{ color: "var(--app-text)" }} />
            <Legend verticalAlign="top" align="right" height={35} wrapperStyle={{ color: "var(--app-text-secondary)" }} /><Bar dataKey="verified" name="Verified" stackId="checks" fill={BLUE} maxBarSize={34} radius={[2, 2, 0, 0]} /><Bar dataKey="failed" name="Failed" stackId="checks" fill={RED} maxBarSize={34} /><Bar dataKey="pending" name="Pending" stackId="checks" fill={AMBER} maxBarSize={34} />
              </BarChart>}
            </ResponsiveContainer>
          </div> : <p className="py-16 text-center text-app-text-muted">{emptyMessage === "No data found for the selected period." ? "No activity in this period." : emptyMessage}</p>}
        </section>

        <section className={`${card} min-w-0 overflow-hidden`}>
          <div className="flex items-center gap-2.5 px-5 py-5"><Table2 size={19} className="text-primary" /><h2 className="text-[16px] font-bold">Report data</h2>
            </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[740px] border-collapse">
            <thead className="bg-app-surface-muted">
            <tr>{cols.map((c) => <th key={c} className={th}>{c}</th>)}</tr></thead>
            <tbody>
            {visible.length ? visible.map((r, i) => <tr key={`${r.label || r.name}-${i}`} className="hover:bg-app-surface-muted">
              <td className={`${td} font-semibold`}>{r.label || r.name}</td>
              {tab === "revenue" ? <>
            <td className={td}>{r.total}</td>
            <td className={td}>{money(r.billed)}</td>
            <td className={td}>{money(r.cost)}</td>
            <td className={`${td} text-[#07965a]`}>{money(r.margin)}</td>
            <td className={td}>{r.billed ? (r.margin / r.billed * 100).toFixed(1) : "0.0"}%</td></> : tab === "wallet" ? <>
            <td className={td}>{r.total}</td>
            <td className={`${td} text-[#07965a]`}>{money(r.credits)}</td>
            <td className={`${td} text-[#e23d45]`}>{money(r.debits)}</td>
            <td className={td}>{money(r.credits - r.debits)}</td></> : <>
            <td className={`${td} text-center`}>{r.total}</td>
            <td className={`${td} text-center text-[#07965a]`}>{r.verified}</td>
            <td className={`${td} text-center text-[#e23d45]`}>{r.failed}</td>
            <td className={`${td} text-center`}>{r.pending}</td>
            <td className={`${td} text-center`}>{r.success.toFixed(1)}%</td>
            <td className={`${td} text-right font-semibold`}>{money(r.billed)}</td></>}
            </tr>) : <tr>
            <td colSpan={cols.length} className="px-4 py-12 text-center text-app-text-muted">{emptyMessage}</td></tr>}
          </tbody></table>
            </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-4 py-4 sm:px-5">
            <span className="text-[12px] text-app-text-secondary">Showing <strong>{data.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, data.length)}</strong> of <strong>{data.length}</strong></span>
            <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-app-border p-2 disabled:opacity-35" aria-label="Previous page"><ChevronLeft size={16} />
            </button>{Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => totalPages <= 6 || p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => <span key={p} className="flex items-center gap-1">{i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-app-text-muted">…</span>}<button onClick={() => setPage(p)} className={`min-w-9 rounded-lg border px-2 py-2 text-[12px] font-semibold ${page === p ? "border-primary bg-[#2d50e7] text-white" : "border-app-border text-app-text-secondary hover:bg-app-surface-muted"}`}>{p}</button></span>)}<button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border border-app-border p-2 disabled:opacity-35" aria-label="Next page"><ChevronRight size={16} />
            </button>
            </div></div>
        </section>
        {toast && <div role="status" className="fixed bottom-5 right-5 z-[90] flex max-w-[calc(100vw-40px)] items-center gap-3 rounded-xl border border-emerald-200 bg-app-surface px-4 py-3 text-[13px] font-medium text-emerald-700 shadow-xl"><CheckCircle2 size={18} />{toast}<button aria-label="Dismiss message" onClick={() => setToast("")}><X size={16} />
            </button>
            </div>}
      </div>
    </div>
  );
}
