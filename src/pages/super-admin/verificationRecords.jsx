import { useEffect, useMemo, useState } from "react";
import {
  Search, Download, Eye, X, ChevronLeft, ChevronRight,
  Fingerprint, CreditCard, Landmark, FileSignature,

} from "lucide-react";
import api, { getErrorMessage } from "../../api";

// Data: GET /admin/records (server-side filters, pagination and summary stats) · retailers filter: GET /admin/retailers
const SERVICES = {
  Aadhaar: { type: "aadhaar", label: "Aadhaar Verification (OTP)", Icon: Fingerprint, color: "text-violet-600 bg-violet-500/15" },
  PAN: { type: "pan", label: "PAN Card Verification", Icon: CreditCard, color: "text-blue-600 bg-blue-500/15" },
  Bank: { type: "bank", label: "Bank Account Verification (Penny Drop)", Icon: Landmark, color: "text-sky-600 bg-sky-500/15" },
  "e-Sign": { type: "esign", label: "Consent Letter with e-Sign", Icon: FileSignature, color: "text-teal-600 bg-teal-500/15" },
};
const SERVICE_BY_TYPE = Object.fromEntries(Object.entries(SERVICES).map(([key, s]) => [s.type, key]));
const STATUS_LABEL = { verified: "Verified", failed: "Failed", pending: "Pending" };
const PAGE_SIZE = 10;
const toRow = (v) => ({
  id: v.id,
  retailer: v.retailer?.shop || v.retailer_id,
  service: SERVICE_BY_TYPE[v.type] || "PAN",
  document: v.doc || "—",
  date: v.created_at,
  status: STATUS_LABEL[v.status] || v.status,
  response: v.response || "—",
  name: v.name || "—",
  amount: Number(v.amount) || 0,
  channel: v.channel || "—",
  details: v.details && typeof v.details === "object" ? v.details : {},
});
const money = n => `₹${Number(n).toLocaleString("en-IN")}`;
const dateLabel = d => new Date(d).toLocaleString("en-GB", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true});
const inputClass = "h-11 w-full rounded-lg border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none focus:border-[#3156e8] focus:ring-2 focus:ring-primary/15";
function ServiceIcon({service}) {
  const {Icon,color} = SERVICES[service];
  return <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
<Icon size={17}/>
</span>;
}
function Status({status}) {
  const ok=status==="Verified";
  return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${ok ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : status==="Failed" ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-amber-500/15 text-amber-700"}`}>
<span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-600" : status==="Failed" ? "bg-red-500" : "bg-amber-500"}`}/>{status}</span>;
}
function downloadCSV(data) {
  const header=["Verification ID","Retailer","Service","Document (masked)","Date","Provider response","Status","Charged"];
  const body=data.map(r=>[r.id,r.retailer,r.service,r.document,dateLabel(r.date),r.response,r.status,r.amount]);
  const csv=[header,...body].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\r\n");
  const blob=new Blob(["﻿",csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download="verifyhub-verification-records.csv";a.click();URL.revokeObjectURL(url);
}
function downloadReceipt(record) {
  const receipt = ["VERIFYHUB — VERIFICATION RECEIPT","Not an official KYC document","",`Verification ID: ${record.id}`,`Retailer: ${record.retailer}`,`Service: ${SERVICES[record.service].label}`,`Document (masked): ${record.document}`,`Date: ${dateLabel(record.date)}`,`Status: ${record.status}`,`Provider response: ${record.response}`,`Amount charged: ${money(record.amount)}`,...Object.entries(record.details).map(([k,v])=>`${k}: ${v}`)].join("\n");
  const url=URL.createObjectURL(new Blob([receipt],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`${record.id}-receipt.txt`;a.click();URL.revokeObjectURL(url);
}
export default function VerificationRecords() {
  const [search,setSearch]=useState("");
  const [query,setQuery]=useState("");
  const [retailer,setRetailer]=useState("");
  const [service,setService]=useState("");
  const [status,setStatus]=useState("");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [page,setPage]=useState(1);
  const [selected,setSelected]=useState(null);
  const [retailers,setRetailers]=useState([]);
  const [result,setResult]=useState({rows:[],total:0,stats:null});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [exporting,setExporting]=useState(false);
  const [exportError,setExportError]=useState("");

  useEffect(()=>{let active=true;api.get("/admin/retailers").then(({data})=>{if(active)setRetailers((data?.data??[]).map(r=>({id:r.id,shop:r.shop})))}).catch(()=>{});return()=>{active=false}},[]);
  // Debounce search so the API isn't called on every keystroke.
  useEffect(()=>{const t=setTimeout(()=>{setQuery(search.trim());setPage(1)},400);return()=>clearTimeout(t)},[search]);
  const params=useMemo(()=>({search:query||undefined,retailer_id:retailer||undefined,type:service?SERVICES[service].type:undefined,status:status?status.toLowerCase():undefined,start_date:from||undefined,end_date:to||undefined}),[query,retailer,service,status,from,to]);
  useEffect(()=>{
    let active=true;
    api.get("/admin/records",{params:{...params,page,per_page:PAGE_SIZE}})
      .then(({data})=>{if(!active)return;setResult({rows:(data?.data?.data??[]).map(toRow),total:Number(data?.data?.total)||0,stats:data?.data?.stats??null});setError("")})
      .catch(err=>{if(active)setError(getErrorMessage(err,"Unable to load verification records."))})
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[params,page]);

  const setFilter=setter=>value=>{setter(value);setPage(1)};
  const filteredTotal=result.total;
  const totalPages=Math.max(1,Math.ceil(filteredTotal/PAGE_SIZE));
  const currentPage=Math.min(page,totalPages);
  const visible=result.rows;
  // Summary stats are computed by the backend on the filtered scope (before the status filter).
  const stats=result.stats;
  const verified=stats?.verified??0;
  const failed=stats?.failed??0;
  const pending=stats?Math.max(0,stats.total-stats.verified-stats.failed):0;
  const billed=stats?.deducted??0;
  useEffect(()=>{if(!selected)return;const onKey=e=>{if(e.key==="Escape")setSelected(null)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[selected]);
  const reset=()=>{setSearch("");setQuery("");setRetailer("");setService("");setStatus("");setFrom("");setTo("");setPage(1)};
  const exportCSV=async()=>{
    if(exporting)return;
    setExportError("");
    if(!filteredTotal){setExportError("No records to export for these filters.");return}
    setExporting(true);
    try{const {data}=await api.get("/admin/records",{params:{...params,page:1,per_page:Math.min(filteredTotal,5000)}});downloadCSV((data?.data?.data??[]).map(toRow))}
    catch(err){setExportError(getErrorMessage(err,"Unable to export records."))}
    finally{setExporting(false)}
  };
  return <div className="min-w-0 bg-app-background text-app-text">
      <main className="min-w-0 px-4 py-6 sm:px-7 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
<div>
<h1 className="text-2xl font-bold tracking-tight sm:text-[27px]">Verification records</h1>
<p className="mt-1 text-sm text-app-text-secondary sm:text-base">Every KYC request across the platform with provider responses and billing.</p>
</div>
<button onClick={exportCSV} disabled={exporting} className="inline-flex h-11 items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 text-sm font-semibold shadow-sm hover:bg-app-surface-muted disabled:opacity-60">
<Download size={17}/>{exporting?"Exporting...":"Export CSV"}</button>
</div>
      {(error||exportError)&&<div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error||exportError}</div>}
      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-app-border p-4 sm:p-5">
          <div className="relative min-w-[220px] flex-1 lg:max-w-[300px]">
<Search className="absolute left-3 top-3 text-app-text-muted" size={18}/>
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Verification ID, retailer, document..." className={`${inputClass} pl-10`}/>
</div>
          <select aria-label="Filter retailer" className={`${inputClass} sm:w-[205px]`} value={retailer} onChange={e=>setFilter(setRetailer)(e.target.value)}>
<option value="">All retailers</option>{retailers.map(r=>
<option key={r.id} value={r.id}>{r.shop}</option>)}</select>
          <select aria-label="Filter service" className={`${inputClass} sm:w-[155px]`} value={service} onChange={e=>setFilter(setService)(e.target.value)}>
<option value="">All services</option>{Object.keys(SERVICES).map(s=>
<option key={s}>{s}</option>)}</select>
          <select aria-label="Filter status" className={`${inputClass} sm:w-[150px]`} value={status} onChange={e=>setFilter(setStatus)(e.target.value)}>
<option value="">All statuses</option>
<option>Verified</option>
<option>Failed</option>
<option>Pending</option>
</select>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
<input aria-label="Start date" type="date" value={from} onChange={e=>setFilter(setFrom)(e.target.value)} className={`${inputClass} min-w-0 flex-1 sm:w-[165px] sm:flex-none`}/>
<span className="text-app-text-muted">–</span>
<input aria-label="End date" type="date" min={from||undefined} value={to} onChange={e=>setFilter(setTo)(e.target.value)} className={`${inputClass} min-w-0 flex-1 sm:w-[165px] sm:flex-none`}/>
</div>
          <button onClick={reset} className="inline-flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-app-text-secondary hover:text-blue-600">
<X size={16}/>Clear</button>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-app-border px-4 py-4 text-sm sm:px-5">
<span>
<strong>{filteredTotal}</strong> <span className="text-app-text-muted">records</span>
</span>
<span className="font-semibold text-emerald-500">{verified} verified</span>
<span className="font-semibold text-red-500">{failed} failed</span>
<span className="font-semibold text-amber-600">{pending} pending</span>
<span>
<strong>{money(billed)}</strong> <span className="text-app-text-muted">billed</span>
</span>
</div>
        <div className="w-full overflow-x-auto">
<table className="w-full min-w-[1220px] border-collapse text-left text-sm">
<thead className="bg-app-surface-muted text-[11px] font-bold uppercase tracking-wide text-app-text-muted">
<tr>{["Verification ID","Retailer","Type","Document (masked)","Date & Time","Provider Response","Status","Charged",""].map((h,i)=>
<th key={i} className="whitespace-nowrap border-b border-app-border px-4 py-4">{h}</th>)}</tr>
</thead>
<tbody>{visible.map(r=>
<tr key={r.id} className="border-b border-app-border hover:bg-app-surface-muted">
<td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-semibold">{r.id}</td>
<td className="whitespace-nowrap px-4 py-4 font-semibold">{r.retailer}</td>
<td className="px-4 py-4">
<div className="flex items-center gap-2 whitespace-nowrap">
<ServiceIcon service={r.service}/>
<span className="font-medium">{r.service}</span>
</div>
</td>
<td className="whitespace-nowrap px-4 py-4 font-mono text-xs">{r.document}</td>
<td className="whitespace-nowrap px-4 py-4">{dateLabel(r.date)}</td>
<td className="max-w-[330px] whitespace-nowrap px-4 py-4 font-mono text-xs text-app-text-secondary">{r.response}</td>
<td className="px-4 py-4">
<Status status={r.status}/>
</td>
<td className="whitespace-nowrap px-4 py-4 font-semibold">{money(r.amount)}</td>
<td className="px-4 py-4">
<button onClick={()=>setSelected(r)} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 font-semibold text-app-text-secondary hover:bg-app-surface-muted hover:text-blue-600">
<Eye size={18}/>View</button>
</td>
</tr>)}{!visible.length&&<tr>
<td colSpan={9} className="px-5 py-14 text-center text-app-text-secondary">{loading?"Loading verification records...":"No verification records match your filters."}</td>
</tr>}</tbody>
</table>
</div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
<p className="text-sm text-app-text-secondary">Showing <strong>{filteredTotal?(currentPage-1)*PAGE_SIZE+1:0}–{Math.min(currentPage*PAGE_SIZE,filteredTotal)}</strong> of <strong>{filteredTotal}</strong>
</p>
<div className="flex flex-wrap items-center gap-1.5">
<button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded-lg border border-app-border p-2 disabled:opacity-40" aria-label="Previous page">
<ChevronLeft size={18}/>
</button>{Array.from({length:totalPages},(_,i)=>i+1).filter(p=>totalPages<=7||p===1||p===totalPages||Math.abs(p-currentPage)<=1).map((p,i,a)=>
<span key={p} className="flex items-center gap-1.5">{i>0&&p-a[i-1]>1&&<span className="px-1 text-app-text-muted">…</span>}<button onClick={()=>setPage(p)} className={`min-w-9 rounded-lg border px-2.5 py-2 text-sm font-semibold ${p===currentPage?"border-[#2d51e8] bg-[#2d51e8] text-white":"border-app-border bg-app-surface hover:bg-app-surface-muted"}`}>{p}</button>
</span>)}<button disabled={currentPage===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="rounded-lg border border-app-border p-2 disabled:opacity-40" aria-label="Next page">
<ChevronRight size={18}/>
</button>
</div>
</div>
      </section>
    </main>
    {selected&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1530]/55 p-3 backdrop-blur-[2px] sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
<section role="dialog" aria-modal="true" aria-label="Verification details" className="flex max-h-[min(90vh,850px)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl bg-app-surface shadow-2xl">
<header className="flex shrink-0 items-center gap-4 border-b border-app-border px-4 py-5 sm:px-6">
<div className="flex h-12 w-24 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 sm:w-[42%]">
<Landmark size={22}/>
</div>
<div className="min-w-0 flex-1">
<h2 className="text-lg font-bold sm:text-xl">Verification details</h2>
<p className="mt-1 truncate text-sm text-app-text-secondary">{selected.id}</p>
</div>
<button aria-label="Close details" onClick={()=>setSelected(null)} className="rounded-lg p-2 hover:bg-app-surface-muted">
<X size={20}/>
</button>
</header>
<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
<div className="mb-5 flex items-center justify-between gap-3">
<div className="flex items-center gap-2 font-semibold">
<ServiceIcon service={selected.service}/>{selected.service}</div>
<Status status={selected.status}/>
</div>
<div className="grid grid-cols-1 overflow-hidden rounded-xl border border-app-border sm:grid-cols-2">{[
      ["Verification ID",selected.id],["Retailer",selected.retailer],["Service",SERVICES[selected.service].label],["Document (masked)",selected.document],["Name",selected.name],["Amount charged",money(selected.amount)],["Date & time",dateLabel(selected.date)],["Channel",selected.channel],...Object.entries(selected.details).map(([k,v])=>[k,String(v)]),["Provider response",selected.response],["Verification status",selected.status]
    ].map(([label,value],i)=>
<div key={`${label}-${i}`} className={`min-w-0 border-b border-app-border px-4 py-4 ${i%2===0?"sm:border-r":""}`}>
<p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">{label}</p>
<p className="mt-1 break-words text-sm font-semibold text-app-text sm:text-base">{value}</p>
</div>)}</div>
<p className="mt-4 text-xs text-app-text-secondary">Identifiers are masked. Details are shown exactly as recorded for this verification.</p>
</div>
<footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-app-border bg-app-surface-muted px-4 py-4 sm:px-6">
<button onClick={()=>downloadReceipt(selected)} className="inline-flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 py-2.5 text-sm font-semibold hover:bg-app-surface-muted">
<Download size={17}/>Download receipt</button>
<button onClick={()=>setSelected(null)} className="rounded-lg bg-[#2c50e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Close</button>
</footer>
</section>
</div>}
  </div>;
}
