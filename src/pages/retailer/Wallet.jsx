import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet as WalletIcon, Plus, Download, X, Send, Info, ArrowDownLeft, ArrowUpRight, Search, ChevronLeft, ChevronRight, CalendarDays, ReceiptText, CheckCircle2, Clock3, XCircle } from "lucide-react";
import api, { getErrorMessage } from "../../api";
import { getUser } from "../../auth";

// Balance + this month: GET /retailer/overview · statement: GET /wallet/transactions?retailer_id=… (server-side filters/pagination)
// Fund requests: GET /wallet/fund-requests?retailer_id=… · new request: POST /retailer/fund-requests
// retailer_id is passed explicitly because these backend routes do not resolve the logged-in retailer from the token yet.
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDate = (value) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}); };
const downloadCSV = (name, rows) => { const csv = rows.map(row => row.map(cell => `"${String(cell ?? "").replaceAll('"','""')}"`).join(",")).join("\r\n"); const url = URL.createObjectURL(new Blob(["﻿",csv],{type:"text/csv;charset=utf-8"})); const link=document.createElement("a"); link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url); };
const toTxn = (t) => ({ id: t.id, date: t.created_at, description: t.note || "Wallet transaction", reference: t.ref || "—", type: t.type === "credit" ? "Credit" : "Debit", amount: Number(t.amount) || 0, balance: Number(t.balance_after) || 0, status: t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : "—", mode: t.mode || "—" });
const REQUEST_STATUS = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700", Icon: Clock3 },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-600", Icon: XCircle },
};
const inputClass = "w-full rounded-xl border border-[#d4ddec] bg-app-surface px-4 py-3 text-[13px] text-app-text outline-none transition focus:border-[#3158ed] focus:ring-2 focus:ring-[#3158ed]/10";
const cardClass = "overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-[0_1px_3px_rgba(19,37,72,0.06)]";
const pageSize = 8;

export default function Wallet() {
  const retailer = getUser();
  const retailerId = retailer?.id;
  const [wallet, setWallet] = useState(null);
  const [requests, setRequests] = useState([]);
  const [recentCredits, setRecentCredits] = useState([]);
  const [statement, setStatement] = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [statementLoading, setStatementLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statementError, setStatementError] = useState("");
  const [version, setVersion] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("UPI");
  const [transferDate, setTransferDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [utr, setUtr] = useState("");
  const [remarks, setRemarks] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All entries");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);

  const loadSummary = useCallback(() => Promise.all([
    api.get("/retailer/overview"),
    api.get("/wallet/fund-requests", { params: { retailer_id: retailerId } }),
    api.get("/wallet/transactions", { params: { retailer_id: retailerId, type: "credit", per_page: 3 } }),
  ])
    .then(([overviewRes, requestsRes, creditsRes]) => {
      setWallet(overviewRes.data?.data?.wallet ?? null);
      setRequests(requestsRes.data?.data ?? []);
      setRecentCredits((creditsRes.data?.data?.data ?? []).map(toTxn));
      setLoadError("");
    })
    .catch((err) => setLoadError(getErrorMessage(err, "Unable to load your wallet.")))
    .finally(() => setLoading(false)), [retailerId]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  // Debounce the statement search so the API isn't called on every keystroke.
  useEffect(() => { const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 400); return () => clearTimeout(t); }, [search]);
  const statementParams = useMemo(() => ({ retailer_id: retailerId, type: filter === "Credits" ? "credit" : filter === "Debits" ? "debit" : "all", search: query || undefined, start_date: fromDate || undefined, end_date: toDate || undefined }), [retailerId, filter, query, fromDate, toDate]);
  useEffect(() => {
    let active = true;
    api.get("/wallet/transactions", { params: { ...statementParams, page, per_page: pageSize } })
      .then(({ data }) => { if (!active) return; setStatement({ rows: (data?.data?.data ?? []).map(toTxn), total: Number(data?.data?.total) || 0 }); setStatementError(""); })
      .catch((err) => { if (active) setStatementError(getErrorMessage(err, "Unable to load your wallet statement.")); })
      .finally(() => { if (active) setStatementLoading(false); });
    return () => { active = false; };
  }, [statementParams, page, version]);

  useEffect(() => { if (!showModal) return; const onKey = (event) => { if(event.key === "Escape" && !submitting) setShowModal(false); }; window.addEventListener("keydown",onKey); return () => window.removeEventListener("keydown",onKey); }, [showModal, submitting]);
  const totalPages = Math.max(1,Math.ceil(statement.total/pageSize));
  const requestPages = Math.max(1,Math.ceil(requests.length/5));
  const visibleRequests = requests.slice((Math.min(requestPage,requestPages)-1)*5,Math.min(requestPage,requestPages)*5);
  const exportStatement = async () => {
    if (exporting) return;
    if (!statement.total) { setNotice("No wallet transactions to export for these filters."); return; }
    setExporting(true);
    try {
      const { data } = await api.get("/wallet/transactions", { params: { ...statementParams, page: 1, per_page: Math.min(statement.total, 5000) } });
      const rows = (data?.data?.data ?? []).map(toTxn);
      downloadCSV("verifyhub-wallet-statement.csv",[["Date & time","Description","Reference","Mode","Type","Amount (INR)","Balance (INR)","Status"],...rows.map(t=>[formatDate(t.date),t.description,t.reference,t.mode,t.type,t.type==="Debit"?-t.amount:t.amount,t.balance,t.status])]);
    } catch (err) {
      setNotice(getErrorMessage(err, "Unable to export the statement."));
    } finally {
      setExporting(false);
    }
  };
  const submitRequest = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const n=Number(amount);
    if(!Number.isFinite(n) || n<500) {setFormError("Minimum top-up amount is ₹500.");return;}
    if(!transferDate || utr.trim().length<6) {setFormError("Enter a transfer date and valid transaction reference (at least 6 characters).");return;}
    setSubmitting(true); setFormError("");
    try {
      const { data } = await api.post("/retailer/fund-requests", { retailer_id: retailerId, amount: n, mode, utr: utr.trim(), transfer_date: transferDate, remarks: remarks.trim() || undefined });
      setShowModal(false); setAmount(""); setUtr(""); setRemarks(""); setRequestPage(1);
      setNotice(data?.message || "Top-up request submitted. Status: Pending admin approval.");
      loadSummary();
    } catch (err) {
      setFormError(getErrorMessage(err, "Unable to submit the top-up request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };
  const retry = () => { setLoading(true); setLoadError(""); loadSummary(); setVersion((v) => v + 1); };
  return <div className="min-h-full bg-app-background px-4 py-5 text-app-text sm:px-6 lg:px-7">
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-[22px] font-bold tracking-tight">My wallet</h1><p className="mt-1 text-[13px] text-app-text-secondary">Prepaid balance used for verification charges.</p></div><div className="flex flex-wrap gap-2"><button onClick={exportStatement} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-[13px] font-semibold hover:bg-app-surface-muted disabled:opacity-60"><Download size={16}/> {exporting ? "Preparing..." : "Download statement"}</button><button onClick={()=>setShowModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#2b50e9] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2343c7]"><Plus size={17}/> Add funds</button></div></div>
    {loadError && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"><span>{loadError}</span><button onClick={retry} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold">Retry</button></div>}
    {notice && <div role="status" className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800"><span>{notice}</span><button onClick={()=>setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}
    <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(270px,0.95fr)_minmax(0,1.8fr)]"><div className="relative min-h-[235px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#102457] via-[#2343ac] to-[#305cf1] p-6 text-white shadow-lg"><div className="absolute -bottom-24 -right-14 h-72 w-72 rounded-full border-[42px] border-white/5"/><div className="relative"><p className="flex items-center gap-2 text-[13px] text-blue-100"><WalletIcon size={17}/> Current wallet balance</p><p className="mt-3 text-[36px] font-bold tracking-tight">{wallet ? money(wallet.balance) : "—"}</p><div className="mt-5 flex gap-7 text-[12px]"><div><p className="text-blue-100">Credits this month</p><p className="mt-1 text-[15px] font-bold">{wallet ? money(wallet.credits_this_month) : "—"}</p></div><div><p className="text-blue-100">Charges this month</p><p className="mt-1 text-[15px] font-bold">{wallet ? money(wallet.charges_this_month) : "—"}</p></div></div>{wallet?.pending_request_amount > 0 && <p className="mt-3 text-[12px] text-blue-100">{money(wallet.pending_request_amount)} awaiting admin approval</p>}<button onClick={()=>setShowModal(true)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-[#203fba]"><Plus size={16}/> Add funds</button></div></div><section className={cardClass}><div className="border-b border-app-border px-5 py-4"><h2 className="flex items-center gap-2 text-[15px] font-semibold"><ArrowDownLeft size={17} className="text-[#3158ed]"/> Recent credits</h2><p className="mt-1 text-[12px] text-app-text-secondary">Top-ups added to your wallet</p></div><div className="divide-y divide-app-border">{recentCredits.length?recentCredits.map(t=><div key={t.id} className="flex items-center justify-between gap-3 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><ArrowDownLeft size={19}/></span><div className="min-w-0"><p className="text-[13px] font-semibold">{t.description}</p><p className="mt-1 truncate text-[11px] text-app-text-secondary">{formatDate(t.date)} · {t.mode} · {t.reference}</p></div></div><span className="shrink-0 text-[13px] font-semibold text-emerald-600">+{money(t.amount)}</span></div>):<p className="p-5 text-[13px] text-app-text-secondary">{loading ? "Loading credits..." : "No credits yet."}</p>}</div></section></div>
    <section className={`${cardClass} mb-5`}><div className="border-b border-app-border px-5 py-4"><h2 className="flex items-center gap-2 text-[15px] font-semibold"><Send size={16} className="text-[#3158ed]"/> Fund requests</h2><p className="mt-1 text-[12px] text-app-text-secondary">Track the status of your top-up requests</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-[12px]"><thead className="bg-app-surface-muted text-[10px] uppercase tracking-wide text-app-text-secondary"><tr>{["Request","Amount","Mode","UTR","Status"].map(h=><th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-app-border">{visibleRequests.map(r=>{ const s = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.pending; return <tr key={r.id}><td className="px-5 py-3"><p className="font-semibold">{r.id}</p><p className="mt-1 text-app-text-secondary">{formatDate(r.created_at)}</p></td><td className="px-5 py-3 font-semibold">{money(r.amount)}</td><td className="px-5 py-3">{r.mode}</td><td className="px-5 py-3 font-mono text-[11px]">{r.utr}</td><td className="px-5 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${s.cls}`}><s.Icon size={12}/>{s.label}</span></td></tr>; })}{visibleRequests.length===0&&<tr><td colSpan={5} className="px-5 py-10 text-center text-app-text-secondary">{loading ? "Loading requests..." : "No top-up requests yet."}</td></tr>}</tbody></table></div><Pagination page={Math.min(requestPage,requestPages)} pages={requestPages} count={requests.length} pageSize={5} setPage={setRequestPage}/></section>
    <section className={cardClass}><div className="border-b border-app-border px-5 py-4"><h2 className="flex items-center gap-2 text-[15px] font-semibold"><ReceiptText size={17} className="text-[#3158ed]"/> Wallet statement</h2><p className="mt-1 text-[12px] text-app-text-secondary">Credits, verification charges and adjustments</p></div><div className="flex flex-wrap items-center gap-3 border-b border-app-border px-5 py-4"><label className="relative min-w-[180px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Reference or service" className={`${inputClass} pl-10`}/></label><select aria-label="Transaction type" className={`${inputClass} w-full sm:w-[160px]`} value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option>All entries</option><option>Credits</option><option>Debits</option></select><label className="flex items-center gap-2 text-[12px] text-app-text-secondary"><CalendarDays size={15}/><input aria-label="From date" type="date" value={fromDate} onChange={e=>{setFromDate(e.target.value);setPage(1);}} className={`${inputClass} w-[150px]`}/></label><label className="flex items-center gap-2 text-[12px] text-app-text-secondary">to <input aria-label="To date" type="date" value={toDate} min={fromDate||undefined} onChange={e=>{setToDate(e.target.value);setPage(1);}} className={`${inputClass} w-[150px]`}/></label><button onClick={exportStatement} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-[12px] font-semibold hover:bg-app-surface-muted disabled:opacity-60"><Download size={15}/> Export CSV</button></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-[12px]"><thead className="bg-app-surface-muted text-[10px] uppercase tracking-wide text-app-text-secondary"><tr>{["Date & time","Description","Reference","Type","Amount","Balance","Status"].map(h=><th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-app-border">{statement.rows.map(t=><tr key={t.id} className="hover:bg-app-surface-muted/50"><td className="whitespace-nowrap px-5 py-4 text-app-text-secondary">{formatDate(t.date)}</td><td className="px-5 py-4 font-medium">{t.description}</td><td className="px-5 py-4 font-mono text-[11px] text-app-text-secondary">{t.reference}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${t.type==="Credit"?"bg-emerald-50 text-emerald-700":"bg-rose-50 text-rose-600"}`}>{t.type==="Credit"?<ArrowDownLeft size={12}/>:<ArrowUpRight size={12}/>} {t.type}</span></td><td className={`px-5 py-4 font-semibold ${t.type==="Credit"?"text-emerald-600":"text-rose-600"}`}>{t.type==="Credit"?"+":"−"}{money(t.amount)}</td><td className="px-5 py-4 font-semibold">{money(t.balance)}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700"><CheckCircle2 size={12}/>{t.status}</span></td></tr>)}{statement.rows.length===0&&<tr><td colSpan={7} className={`px-5 py-12 text-center ${statementError ? "text-red-600" : "text-app-text-secondary"}`}>{statementError || (statementLoading ? "Loading statement..." : "No wallet transactions match your filters.")}</td></tr>}</tbody></table></div><Pagination page={Math.min(page,totalPages)} pages={totalPages} count={statement.total} pageSize={pageSize} setPage={setPage}/></section>
    {showModal&&<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b1430]/60 px-3 py-5 backdrop-blur-[2px]" onMouseDown={e=>{if(e.target===e.currentTarget && !submitting)setShowModal(false);}}><div role="dialog" aria-modal="true" aria-labelledby="topup-title" className="flex max-h-[92vh] w-full max-w-[650px] flex-col overflow-hidden rounded-[20px] bg-app-surface text-app-text shadow-2xl"><div className="flex items-start gap-4 border-b border-app-border px-5 py-5 sm:px-7"><span className="rounded-2xl bg-[#edf1ff] p-4 text-[#3158ed]"><WalletIcon size={22}/></span><div className="flex-1"><h2 id="topup-title" className="text-[19px] font-bold">Request wallet top-up</h2><p className="mt-1 text-[13px] leading-5 text-app-text-secondary">Submit your bank transfer details for admin approval</p></div><button aria-label="Close" disabled={submitting} onClick={()=>setShowModal(false)} className="rounded-lg p-1 text-app-text-secondary hover:bg-app-surface-muted"><X size={20}/></button></div><form onSubmit={submitRequest} className="flex min-h-0 flex-col"><div className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-7"><div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-6 text-[#7b4b00]"><Info size={20} className="shrink-0"/><p><strong>Transfer first, then submit.</strong> No payment is collected here. Send the amount to the company bank account / UPI, then enter the UTR below. Your wallet is credited after the admin verifies the transfer.</p></div><div><label htmlFor="topup-amount" className="mb-2 block text-[13px] font-semibold">Amount <span className="text-red-500">*</span></label><div className="flex"><span className="rounded-l-xl border border-r-0 border-[#d4ddec] bg-app-surface-muted px-4 py-3">₹</span><input id="topup-amount" type="number" min="500" step="1" value={amount} onChange={e=>{setAmount(e.target.value);setFormError("");}} placeholder="Minimum ₹500" className={`${inputClass} rounded-l-none`}/></div><div className="mt-3 flex flex-wrap gap-2">{[1000,2000,5000,10000].map(n=><button type="button" key={n} onClick={()=>setAmount(String(n))} className="rounded-full border border-app-border px-3 py-1.5 text-[12px] font-semibold text-app-text-secondary hover:border-[#3158ed] hover:text-[#3158ed]">{money(n)}</button>)}</div></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-[13px] font-semibold">Payment mode <span className="text-red-500">*</span><select value={mode} onChange={e=>setMode(e.target.value)} className={`${inputClass} mt-2`}><option>UPI</option><option>IMPS</option><option>NEFT</option><option>RTGS</option></select></label><label className="block text-[13px] font-semibold">Transfer date <span className="text-red-500">*</span><input type="date" value={transferDate} max={new Date().toLocaleDateString("en-CA")} onChange={e=>setTransferDate(e.target.value)} className={`${inputClass} mt-2`}/></label></div><label className="block text-[13px] font-semibold">UTR / transaction reference <span className="text-red-500">*</span><input value={utr} onChange={e=>{setUtr(e.target.value);setFormError("");}} placeholder="e.g. UTR428193746512" className={`${inputClass} mt-2`}/></label><label className="block text-[13px] font-semibold">Remarks <span className="font-normal text-app-text-secondary">(Optional)</span><textarea rows={3} value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Anything the admin should know" className={`${inputClass} mt-2 resize-none`}/></label>{formError&&<p role="alert" className="text-[12px] font-semibold text-red-600">{formError}</p>}</div><div className="flex justify-end gap-3 border-t border-app-border bg-app-surface-muted px-5 py-4 sm:px-7"><button type="button" disabled={submitting} onClick={()=>setShowModal(false)} className="rounded-xl border border-app-border bg-app-surface px-5 py-3 text-[13px] font-semibold">Cancel</button><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-[#2b50e9] px-5 py-3 text-[13px] font-semibold text-white hover:bg-[#2343c7] disabled:opacity-60"><Send size={16}/> {submitting ? "Submitting..." : "Submit request"}</button></div></form></div></div>}
  </div>;
}
function Pagination({page,pages,count,pageSize,setPage}) { return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-5 py-3 text-[11px] text-app-text-secondary"><span>Showing {count===0?0:(page-1)*pageSize+1}–{Math.min(page*pageSize,count)} of {count}</span><div className="flex items-center gap-2"><button aria-label="Previous page" disabled={page<=1} onClick={()=>setPage(page-1)} className="rounded-lg border border-app-border p-2 disabled:opacity-40"><ChevronLeft size={15}/></button><span className="rounded-lg bg-[#2b50e9] px-3 py-2 font-semibold text-white">{page}</span><span>of {pages}</span><button aria-label="Next page" disabled={page>=pages} onClick={()=>setPage(page+1)} className="rounded-lg border border-app-border p-2 disabled:opacity-40"><ChevronRight size={15}/></button></div></div>; }
