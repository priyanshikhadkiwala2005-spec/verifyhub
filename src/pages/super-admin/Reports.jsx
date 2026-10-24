import { useMemo, useState } from "react";
import {
  CalendarDays, Store, Layers, IndianRupee, ArrowLeftRight,
  Download, Printer, Table2, ChevronLeft, ChevronRight,
  FlaskConical, X, CheckCircle2, BarChart3
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, LineChart, Line
} from "recharts";

const TABS = [
  { id: "daily", name: "Daily verification", icon: CalendarDays },
  { id: "monthly", name: "Monthly verification", icon: CalendarDays },
  { id: "retailer", name: "Retailer-wise", icon: Store },
  { id: "service", name: "Service-wise", icon: Layers },
  { id: "revenue", name: "Revenue", icon: IndianRupee },
  { id: "wallet", name: "Wallet transactions", icon: ArrowLeftRight },
];
const BLUE = "#2d50e7", RED = "#e23d45", AMBER = "#e39810", GREEN = "#07965a";
const DAY = 86400000;
const formatDate = (date) => date.toISOString().slice(0, 10);
const dateLabel = (value, short = false) => new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", ...(short ? {} : { year: "numeric" }) });
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const pad = (n) => String(n).padStart(2, "0");
const rangeEnd = "2026-10-23";
const initialStart = "2026-09-24";
const retailers = ["Shree Ganesh Mobile Point", "Sai Digital Services", "Annapurna Finserv Kendra", "Krishna CSC Centre", "Royal Enterprises", "Metro Fintech Hub", "Om Sai Multiservices", "Laxmi Money Point", "Navkar Digital Point", "Bharat Seva Kendra", "Balaji Online Seva", "Green Valley Traders"];
const services = ["Aadhaar", "PAN", "Bank", "e-Sign"];
const prices = [20, 10, 15, 30];

// Synthetic sample data for UI demonstration; replace with API responses later.
const DEMO_RECORDS = Array.from({ length: 365 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 9, 21) - index * DAY);
  const key = formatDate(date);
  const verified = index === 0 || index === 1 ? 0 : (index * 7 + 3) % 6 + (index % 11 === 0 ? 2 : 0);
  const failed = index === 0 || index === 1 ? 0 : index % 7 === 0 || index % 9 === 0 ? 1 : 0;
  const pending = 0;
  const count = verified + failed + pending;
  const billed = count ? verified * (index % 3 === 0 ? 20 : 15) + failed * 10 : 0;
  return { date: key, verified, failed, pending, total: count, billed };
});

function getDateRange(preset) {
  const end = new Date(`${rangeEnd}T00:00:00Z`);
  const start = new Date(end);
  if (preset === "7D") start.setUTCDate(end.getUTCDate() - 6);
  if (preset === "30D") start.setUTCDate(end.getUTCDate() - 29);
  if (preset === "90D") start.setUTCDate(end.getUTCDate() - 89);
  if (preset === "6M") start.setUTCMonth(end.getUTCMonth() - 6);
  if (preset === "1Y") start.setUTCFullYear(end.getUTCFullYear() - 1);
  return [formatDate(start), formatDate(end)];
}

function csvDownload(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.map(escape).join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const card = "rounded-2xl border border-[#dfe5f1] bg-white shadow-[0_1px_3px_rgba(21,37,75,.06)]";
const small = "text-[12px] font-semibold uppercase tracking-[.035em] text-[#8b98b2]";
const th = "whitespace-nowrap px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[.035em] text-[#8b98b2]";
const td = "whitespace-nowrap border-t border-[#e4eaf4] px-4 py-4 text-[13px] text-[#17213e]";

export default function Reports() {
  const [tab, setTab] = useState("daily");
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(rangeEnd);
  const [preset, setPreset] = useState("30D");
  const [page, setPage] = useState(1);
  const [banner, setBanner] = useState(true);
  const [toast, setToast] = useState("");
  const [generated, setGenerated] = useState("23 Oct 2026, 09:12 pm");

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

  const data = useMemo(() => {
    if (!start || !end || start > end) return [];
    const filtered = DEMO_RECORDS.filter((r) => r.date >= start && r.date <= end).sort((a, b) => a.date.localeCompare(b.date));
    if (tab === "daily") return filtered.map((r) => ({ ...r, name: dateLabel(r.date, true), label: dateLabel(r.date), success: r.total ? (r.verified / r.total) * 100 : 0 }));
    if (tab === "monthly") {
      const groups = new Map();
      for (const r of filtered) {
        const key = r.date.slice(0, 7);
        if (!groups.has(key)) groups.set(key, { key, name: new Date(`${key}-01T12:00:00`).toLocaleDateString("en-GB", { month: "short", year: "numeric" }), verified: 0, failed: 0, pending: 0, total: 0, billed: 0 });
        const g = groups.get(key);
        for (const k of ["verified", "failed", "pending", "total", "billed"]) g[k] += r[k];
      }
      return [...groups.values()].map((r) => ({ ...r, success: r.total ? r.verified / r.total * 100 : 0 }));
    }
    const total = filtered.reduce((acc, r) => acc + r.total, 0);
    const weights = tab === "retailer" ? [12, 10, 17, 11, 20, 17, 9, 13, 8, 6, 7, 12] : [31, 31, 25, 13];
    const names = tab === "retailer" ? retailers : services;
    if (tab === "retailer" || tab === "service") {
      const sumWeights = weights.reduce((a, b) => a + b, 0);
      return names.map((name, i) => {
        const count = Math.round(total * weights[i] / sumWeights);
        const failed = Math.round(count * (i % 4 === 0 ? .12 : .07));
        const verified = count - failed;
        const billed = tab === "service" ? count * prices[i] : Math.round(count * 17);
        return { name, total: count, verified, failed, pending: 0, billed, success: count ? verified / count * 100 : 0 };
      });
    }
    if (tab === "revenue") return filtered.map((r) => ({ ...r, name: dateLabel(r.date, true), label: dateLabel(r.date), cost: Math.round(r.billed * .42), margin: Math.round(r.billed * .58), success: r.total ? r.verified / r.total * 100 : 0 }));
    return filtered.map((r) => ({ ...r, name: dateLabel(r.date, true), label: dateLabel(r.date), credits: r.total ? (Number(r.date.slice(-2)) % 6 === 0 ? 500 : 0) : 0, debits: r.billed, success: r.total ? r.verified / r.total * 100 : 0 }));
  }, [start, end, tab]);

  const stats = useMemo(() => data.reduce((acc, r) => {
    acc.total += r.total || 0; acc.verified += r.verified || 0; acc.failed += r.failed || 0;
    acc.billed += r.billed || 0; acc.credits += r.credits || 0; acc.debits += r.debits || 0;
    acc.margin += r.margin || 0; return acc;
  }, { total: 0, verified: 0, failed: 0, billed: 0, credits: 0, debits: 0, margin: 0 }), [data]);
  const successRate = stats.total ? `${(stats.verified / stats.total * 100).toFixed(1)}%` : "0.0%";
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const visible = [...data].reverse().slice((page - 1) * pageSize, page * pageSize);
  const title = TABS.find((t) => t.id === tab)?.name || "Report";
  const summary = tab === "revenue" ? [
    ["GROSS REVENUE", money(stats.billed)], ["PROVIDER COST", money(stats.billed - stats.margin)], ["GROSS MARGIN", money(stats.margin)], ["MARGIN %", stats.billed ? `${(stats.margin / stats.billed * 100).toFixed(1)}%` : "0.0%"]
  ] : tab === "wallet" ? [
    ["WALLET TRANSACTIONS", stats.total], ["CREDITS", money(stats.credits)], ["DEBITS", money(stats.debits)], ["NET MOVEMENT", money(stats.credits - stats.debits)]
  ] : [
    ["VERIFICATIONS", stats.total], ["SUCCESS RATE", successRate], ["FAILED", stats.failed], ["BILLED", money(stats.billed)]
  ];
  const exportReport = () => {
    csvDownload(`verifyhub-${tab}-${start}-to-${end}.csv`, [...data].reverse().map(({ name, label, key, date, total, verified, failed, pending, success, billed, cost, margin, credits, debits }) => ({
      Period: label || name, Total: total, Verified: verified, Failed: failed, Pending: pending,
      "Success %": Number(success || 0).toFixed(1), "Billed INR": billed,
      ...(tab === "revenue" ? { "Provider Cost INR": cost, "Margin INR": margin } : {}),
      ...(tab === "wallet" ? { "Credits INR": credits, "Debits INR": debits } : {})
    })));
    setToast("Report CSV exported successfully.");
  };
  const displayRange = start && end ? `${dateLabel(start)} – ${dateLabel(end)}` : "Select date range";
  const cols = tab === "revenue" ? ["DATE", "VERIFICATIONS", "GROSS REVENUE", "PROVIDER COST", "GROSS MARGIN", "MARGIN %"] : tab === "wallet" ? ["DATE", "TRANSACTIONS", "CREDITS", "DEBITS", "NET MOVEMENT"] : [tab === "daily" ? "DATE" : tab === "monthly" ? "MONTH" : tab === "retailer" ? "RETAILER" : "SERVICE", "TOTAL", "VERIFIED", "FAILED", "PENDING", "SUCCESS %", "BILLED"];

  return (
    <div className="min-w-0 bg-[#f3f5fb] text-[#111b36] print:bg-white">
     
      <div className="mx-auto max-w-[1700px] space-y-5 px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-[24px] font-bold tracking-[-.025em] sm:text-[27px]">Reports &amp; analytics</h1><p className="mt-1 text-[13px] text-[#536383] sm:text-[14px]">Operational, financial and wallet reports with exportable data.</p></div>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-[#d3dcec] bg-white px-3 py-2.5 text-[13px] font-semibold shadow-sm hover:bg-slate-50 sm:px-4"><Printer size={17} />Print</button>
            <button onClick={exportReport} disabled={!data.length} className="inline-flex items-center gap-2 rounded-lg bg-[#2d50e7] px-3 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#2043d1] disabled:opacity-50 sm:px-4"><Download size={17} />Export CSV</button>
          </div>
        </div>

        <div className={`${card} overflow-hidden print:hidden`}>
          <div className="flex gap-1 overflow-x-auto border-b border-[#e2e8f2] px-3 pt-1 sm:px-4">
            {TABS.map(({ id, name, icon: Icon }) => <button key={id} onClick={() => changeTab(id)} className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-4 text-[13px] font-semibold transition-colors sm:px-4 ${tab === id ? "border-[#2d50e7] text-[#2d50e7]" : "border-transparent text-[#536383] hover:text-[#2d50e7]"}`}><Icon size={17} />{name}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-4 py-4 sm:px-5">
            <span className="mr-1 text-[13px] font-semibold text-[#536383]">Date range</span>
            <input aria-label="Start date" type="date" value={start} max={end || undefined} onChange={(e) => changeDate("start", e.target.value)} className="min-w-0 rounded-lg border border-[#d1daeb] bg-white px-2 py-2.5 text-[13px] outline-none focus:border-[#2d50e7] sm:px-3" />
            <span className="text-[#9aa6bc]">–</span>
            <input aria-label="End date" type="date" value={end} min={start || undefined} onChange={(e) => changeDate("end", e.target.value)} className="min-w-0 rounded-lg border border-[#d1daeb] bg-white px-2 py-2.5 text-[13px] outline-none focus:border-[#2d50e7] sm:px-3" />
            <div className="flex flex-wrap gap-1.5 sm:ml-1">{["7D", "30D", "90D", "6M", "1Y"].map((p) => <button key={p} onClick={() => selectPreset(p)} className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${preset === p ? "border-[#2d50e7] bg-[#eef2ff] text-[#2d50e7]" : "border-[#d1daeb] bg-white text-[#536383] hover:bg-slate-50"}`}>{p}</button>)}</div>
            <span className="w-full text-[12px] text-[#8b98b2] xl:ml-auto xl:w-auto">Generated {generated}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {summary.map(([label, value]) => <div key={label} className="rounded-xl border border-[#e0e6f0] bg-white p-4 sm:p-5"><p className={small}>{label}</p><p className="mt-1 text-[21px] font-bold tracking-tight sm:text-[23px]">{value}</p></div>)}
        </div>

        <section className={`${card} min-w-0 p-4 sm:p-6`}>
          <div className="flex items-start gap-2.5"><BarChart3 size={20} className="mt-0.5 shrink-0 text-[#2d50e7]" /><div><h2 className="text-[16px] font-bold sm:text-[17px]">{title} report</h2><p className="mt-1 text-[12px] text-[#8b98b2] sm:text-[13px]">{displayRange}</p></div></div>
          {data.length ? <div className="mt-8 h-[310px] w-full sm:mt-10 sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {tab === "revenue" || tab === "wallet" ? <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                <CartesianGrid stroke="#e2e8f2" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#536383", fontSize: 11 }} interval="preserveStartEnd" angle={-30} textAnchor="end" height={60} /><YAxis tick={{ fill: "#536383", fontSize: 11 }} /><Tooltip formatter={(v) => money(v)} /><Legend verticalAlign="top" align="right" height={35} />
                {tab === "revenue" ? <><Line name="Revenue" dataKey="billed" stroke={BLUE} strokeWidth={2.5} dot={false} /><Line name="Provider cost" dataKey="cost" stroke={RED} strokeWidth={2} dot={false} /><Line name="Gross margin" dataKey="margin" stroke={GREEN} strokeWidth={2} dot={false} /></> : <><Line name="Credit" dataKey="credits" stroke={GREEN} strokeWidth={2.5} dot={false} /><Line name="Debit" dataKey="debits" stroke={RED} strokeWidth={2.5} dot={false} /></>}
              </LineChart> : <BarChart data={data} margin={{ top: 10, right: 8, left: -15, bottom: 25 }} barCategoryGap="20%">
                <CartesianGrid stroke="#e2e8f2" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#536383", fontSize: 11 }} interval={tab === "retailer" ? 0 : "preserveStartEnd"} angle={-35} textAnchor="end" height={75} /><YAxis allowDecimals={false} tick={{ fill: "#536383", fontSize: 11 }} /><Tooltip /><Legend verticalAlign="top" align="right" height={35} /><Bar dataKey="verified" name="Verified" stackId="checks" fill={BLUE} maxBarSize={34} radius={[2, 2, 0, 0]} /><Bar dataKey="failed" name="Failed" stackId="checks" fill={RED} maxBarSize={34} /><Bar dataKey="pending" name="Pending" stackId="checks" fill={AMBER} maxBarSize={34} />
              </BarChart>}
            </ResponsiveContainer>
          </div> : <p className="py-16 text-center text-[#8b98b2]">No demo records for this date range.</p>}
        </section>

        <section className={`${card} min-w-0 overflow-hidden`}>
          <div className="flex items-center gap-2.5 px-5 py-5"><Table2 size={19} className="text-[#2d50e7]" /><h2 className="text-[16px] font-bold">Report data</h2></div>
          <div className="w-full overflow-x-auto"><table className="w-full min-w-[740px] border-collapse"><thead className="bg-[#f7f9fc]"><tr>{cols.map((c) => <th key={c} className={th}>{c}</th>)}</tr></thead><tbody>
            {visible.length ? visible.map((r, i) => <tr key={`${r.date || r.key || r.name}-${i}`} className="hover:bg-[#f8faff]">
              <td className={`${td} font-semibold`}>{r.label || r.name}</td>
              {tab === "revenue" ? <><td className={td}>{r.total}</td><td className={td}>{money(r.billed)}</td><td className={td}>{money(r.cost)}</td><td className={`${td} text-[#07965a]`}>{money(r.margin)}</td><td className={td}>{r.billed ? (r.margin / r.billed * 100).toFixed(1) : "0.0"}%</td></> : tab === "wallet" ? <><td className={td}>{r.total}</td><td className={`${td} text-[#07965a]`}>{money(r.credits)}</td><td className={`${td} text-[#e23d45]`}>{money(r.debits)}</td><td className={td}>{money(r.credits - r.debits)}</td></> : <><td className={`${td} text-center`}>{r.total}</td><td className={`${td} text-center text-[#07965a]`}>{r.verified}</td><td className={`${td} text-center text-[#e23d45]`}>{r.failed}</td><td className={`${td} text-center`}>{r.pending}</td><td className={`${td} text-center`}>{r.success.toFixed(1)}%</td><td className={`${td} text-right font-semibold`}>{money(r.billed)}</td></>}
            </tr>) : <tr><td colSpan={cols.length} className="px-4 py-12 text-center text-[#8b98b2]">No data found for the selected period.</td></tr>}
          </tbody></table></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4eaf4] px-4 py-4 sm:px-5"><span className="text-[12px] text-[#536383]">Showing <strong>{data.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, data.length)}</strong> of <strong>{data.length}</strong></span><div className="flex items-center gap-1"><button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-[#dce4f0] p-2 disabled:opacity-35" aria-label="Previous page"><ChevronLeft size={16} /></button>{Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => totalPages <= 6 || p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => <span key={p} className="flex items-center gap-1">{i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-[#8b98b2]">…</span>}<button onClick={() => setPage(p)} className={`min-w-9 rounded-lg border px-2 py-2 text-[12px] font-semibold ${page === p ? "border-[#2d50e7] bg-[#2d50e7] text-white" : "border-[#dce4f0] text-[#536383] hover:bg-[#f3f6fc]"}`}>{p}</button></span>)}<button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border border-[#dce4f0] p-2 disabled:opacity-35" aria-label="Next page"><ChevronRight size={16} /></button></div></div>
        </section>
        {toast && <div role="status" className="fixed bottom-5 right-5 z-[90] flex max-w-[calc(100vw-40px)] items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-[13px] font-medium text-emerald-700 shadow-xl"><CheckCircle2 size={18} />{toast}<button aria-label="Dismiss message" onClick={() => setToast("")}><X size={16} /></button></div>}
      </div>
    </div>
  );
}
