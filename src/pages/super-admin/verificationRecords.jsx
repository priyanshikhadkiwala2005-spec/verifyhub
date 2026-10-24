import { useEffect, useMemo, useState } from "react";
import {
  Search, Download, Eye, X, ChevronLeft, ChevronRight, ChevronDown,
  Fingerprint, CreditCard, Landmark, FileSignature, FlaskConical,
  CheckCircle2, XCircle, Clock3, RotateCcw
} from "lucide-react";

const SERVICES = {
  Aadhaar: { label: "Aadhaar Verification (OTP)", Icon: Fingerprint, price: 20, color: "text-violet-600 bg-violet-100" },
  PAN: { label: "PAN Card Verification", Icon: CreditCard, price: 10, color: "text-blue-600 bg-blue-100" },
  Bank: { label: "Bank Account Verification (Penny Drop)", Icon: Landmark, price: 15, color: "text-sky-600 bg-sky-100" },
  "e-Sign": { label: "Consent Letter with e-Sign", Icon: FileSignature, price: 30, color: "text-teal-600 bg-teal-100" },
};
const RETAILERS = [
  "Green Valley Traders", "Sai Digital Services", "Metro Fintech Hub",
  "Royal Enterprises", "Shree Ganesh Mobile Point", "Krishna CSC Centre",
  "Annapurna Finserv Kendra", "Balaji Online Seva", "Laxmi Money Point",
  "Navkar Digital Point", "Bharat Seva Kendra", "Om Sai Multiservices"
];
const initial = [
  ["VRF26102154232",0,"Aadhaar","XXXX XXXX 0442","2026-10-21T13:14:00","Verified","200 · VERIFIED · OTP authenticated","Ramesh Patel"],
  ["VRF26102133499",1,"Bank","XXXXXX1027","2026-10-21T08:56:00","Verified","200 · SUCCESS · ₹1 credited · name returned","Sai Kumar"],
  ["VRF26102133346",2,"PAN","MWXXXXX51Q","2026-10-21T06:43:00","Verified","200 · VALID · Record found","Ananya Iyer"],
  ["VRF26102105816",3,"PAN","CFXXXXX51Q","2026-10-21T05:53:00","Failed","422 · INVALID_PAN · Checksum mismatch","Imran Shaikh"],
  ["VRF26102160045",2,"Aadhaar","XXXX XXXX 4682","2026-10-21T02:06:00","Verified","200 · VERIFIED · OTP authenticated","Ananya Iyer"],
  ["VRF26102158760",2,"Bank","XXXXXX9833","2026-10-21T00:53:00","Verified","200 · SUCCESS · ₹1 credited · name returned","Ananya Iyer"],
  ["VRF26102061119",4,"e-Sign","CL-2610209040","2026-10-20T23:13:00","Verified","200 · SIGNED · Document e-signed","Vikram Shah"],
  ["VRF26102069904",3,"Bank","XXXXXX4320","2026-10-20T21:18:00","Verified","200 · SUCCESS · ₹1 credited · name returned","Imran Shaikh"],
  ["VRF26102058521",5,"Bank","XXXXXX7608","2026-10-20T19:39:00","Failed","503 · BANK_OFFLINE · IMPS unavailable","Mahesh Yadav"],
  ["VRF26102089706",0,"Bank","XXXXXX8631","2026-10-20T19:22:00","Verified","200 · SUCCESS · ₹1 credited · name returned","Mohammed Arif"],
];
const rows = [
  ...initial.map(([id,r,service,document,date,status,response,name]) => ({ id, retailer: RETAILERS[r], service, document, date, status, response, name, amount: SERVICES[service].price })),
  ...Array.from({length: 45}, (_,i) => {
    const service = Object.keys(SERVICES)[i%4];
    const status = i%11===0 ? "Failed" : "Verified";
    const day = 19-Math.floor(i/5);
    return {
      id: `VRF2610${String(day).padStart(2,"0")}${String(30000+i*137).padStart(5,"0")}`,
      retailer: RETAILERS[(i+6)%RETAILERS.length], service,
      document: service==="Aadhaar" ? `XXXX XXXX ${String(1200+i*43).slice(-4)}` : service==="PAN" ? `ABXXXXX${i%10}Q` : service==="Bank" ? `XXXXXX${String(2300+i*41).slice(-4)}` : `CL-2610${day}${9000+i}`,
      date: `2026-10-${String(day).padStart(2,"0")}T${String(8+i%11).padStart(2,"0")}:30:00`,
      status, response: status==="Verified" ? "200 · SUCCESS · Verification completed" : "422 · VALIDATION_FAILED · Verification unsuccessful",
      name: "Demo Customer", amount: SERVICES[service].price
    };
  })
];
const money = n => `₹${Number(n).toLocaleString("en-IN")}`;
const dateLabel = d => new Date(d).toLocaleString("en-GB", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true});
const inputClass = "h-11 w-full rounded-lg border border-[#d4ddec] bg-white px-3 text-sm text-[#172343] outline-none focus:border-[#3156e8] focus:ring-2 focus:ring-blue-100";
function ServiceIcon({service}) {
  const {Icon,color} = SERVICES[service];
  return <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon size={17}/></span>;
}
function Status({status}) {
  const ok=status==="Verified";
  return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${ok ? "bg-[#e3f6ed] text-[#07945a]" : status==="Failed" ? "bg-[#feebed] text-[#e43e4c]" : "bg-amber-100 text-amber-700"}`}><span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-600" : status==="Failed" ? "bg-red-500" : "bg-amber-500"}`}/>{status}</span>;
}
function downloadCSV(data) {
  const header=["Verification ID","Retailer","Service","Document (masked)","Date","Provider response","Status","Charged"];
  const body=data.map(r=>[r.id,r.retailer,r.service,r.document,dateLabel(r.date),r.response,r.status,r.amount]);
  const csv=[header,...body].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\r\n");
  const blob=new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download="verifyhub-verification-records.csv";a.click();URL.revokeObjectURL(url);
}
function downloadReceipt(record) {
  const receipt = ["VERIFYHUB — DEMO VERIFICATION RECEIPT","Synthetic data · Not an official KYC document","",`Verification ID: ${record.id}`,`Retailer: ${record.retailer}`,`Service: ${SERVICES[record.service].label}`,`Document (masked): ${record.document}`,`Date: ${dateLabel(record.date)}`,`Status: ${record.status}`,`Provider response: ${record.response}`,`Amount charged: ${money(record.amount)}`].join("\n");
  const url=URL.createObjectURL(new Blob([receipt],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`${record.id}-demo-receipt.txt`;a.click();URL.revokeObjectURL(url);
}
export default function VerificationRecords() {
  const [banner,setBanner]=useState(true);
  const [search,setSearch]=useState("");
  const [retailer,setRetailer]=useState("");
  const [service,setService]=useState("");
  const [status,setStatus]=useState("");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [page,setPage]=useState(1);
  const [selected,setSelected]=useState(null);
  const filtered=useMemo(()=>rows.filter(r=>{
    const q=search.toLowerCase().trim();
    return (!q||[r.id,r.retailer,r.document,r.response].some(v=>v.toLowerCase().includes(q)))&&(!retailer||r.retailer===retailer)&&(!service||r.service===service)&&(!status||r.status===status)&&(!from||r.date.slice(0,10)>=from)&&(!to||r.date.slice(0,10)<=to);
  }),[search,retailer,service,status,from,to]);
  const pageSize=10, totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const currentPage=Math.min(page,totalPages);
  const visible=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
  const verified=filtered.filter(r=>r.status==="Verified").length;
  const failed=filtered.filter(r=>r.status==="Failed").length;
  const pending=filtered.filter(r=>r.status==="Pending").length;
  const billed=filtered.reduce((sum,r)=>sum+r.amount,0);
  useEffect(()=>setPage(1),[search,retailer,service,status,from,to]);
  useEffect(()=>{if(!selected)return;const onKey=e=>{if(e.key==="Escape")setSelected(null)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[selected]);
  const reset=()=>{setSearch("");setRetailer("");setService("");setStatus("");setFrom("");setTo("");setPage(1)};
  return <div className="min-w-0 bg-[#f3f5fc] text-[#101b38]">
      <main className="min-w-0 px-4 py-6 sm:px-7 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight sm:text-[27px]">Verification records</h1><p className="mt-1 text-sm text-[#647391] sm:text-base">Every KYC request across the platform with provider responses and billing.</p></div><button onClick={()=>downloadCSV(filtered)} className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#d4ddec] bg-white px-4 text-sm font-semibold shadow-sm hover:bg-slate-50"><Download size={17}/>Export CSV</button></div>
      <section className="overflow-hidden rounded-2xl border border-[#dfe5f0] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#e0e6f0] p-4 sm:p-5">
          <div className="relative min-w-[220px] flex-1 lg:max-w-[300px]"><Search className="absolute left-3 top-3 text-[#91a0bc]" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Verification ID, retailer, document..." className={`${inputClass} pl-10`}/></div>
          <select aria-label="Filter retailer" className={`${inputClass} sm:w-[205px]`} value={retailer} onChange={e=>setRetailer(e.target.value)}><option value="">All retailers</option>{RETAILERS.map(r=><option key={r}>{r}</option>)}</select>
          <select aria-label="Filter service" className={`${inputClass} sm:w-[155px]`} value={service} onChange={e=>setService(e.target.value)}><option value="">All services</option>{Object.keys(SERVICES).map(s=><option key={s}>{s}</option>)}</select>
          <select aria-label="Filter status" className={`${inputClass} sm:w-[150px]`} value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option>Verified</option><option>Failed</option><option>Pending</option></select>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto"><input aria-label="Start date" type="date" value={from} onChange={e=>setFrom(e.target.value)} className={`${inputClass} min-w-0 flex-1 sm:w-[165px] sm:flex-none`}/><span className="text-[#93a0b9]">–</span><input aria-label="End date" type="date" min={from||undefined} value={to} onChange={e=>setTo(e.target.value)} className={`${inputClass} min-w-0 flex-1 sm:w-[165px] sm:flex-none`}/></div>
          <button onClick={reset} className="inline-flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-[#576786] hover:text-blue-600"><X size={16}/>Clear</button>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-[#e0e6f0] px-4 py-4 text-sm sm:px-5"><span><strong>{filtered.length}</strong> <span className="text-[#8b99b4]">records</span></span><span className="font-semibold text-emerald-600">{verified} verified</span><span className="font-semibold text-red-500">{failed} failed</span><span className="font-semibold text-amber-600">{pending} pending</span><span><strong>{money(billed)}</strong> <span className="text-[#8b99b4]">billed</span></span></div>
        <div className="w-full overflow-x-auto"><table className="w-full min-w-[1220px] border-collapse text-left text-sm"><thead className="bg-[#f7f9fc] text-[11px] font-bold uppercase tracking-wide text-[#8a98b2]"><tr>{["Verification ID","Retailer","Type","Document (masked)","Date & Time","Provider Response","Status","Charged",""].map((h,i)=><th key={i} className="whitespace-nowrap border-b border-[#e1e7f0] px-4 py-4">{h}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id} className="border-b border-[#e2e8f2] hover:bg-[#f8faff]"><td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-semibold">{r.id}</td><td className="whitespace-nowrap px-4 py-4 font-semibold">{r.retailer}</td><td className="px-4 py-4"><div className="flex items-center gap-2 whitespace-nowrap"><ServiceIcon service={r.service}/><span className="font-medium">{r.service}</span></div></td><td className="whitespace-nowrap px-4 py-4 font-mono text-xs">{r.document}</td><td className="whitespace-nowrap px-4 py-4">{dateLabel(r.date)}</td><td className="max-w-[330px] whitespace-nowrap px-4 py-4 font-mono text-xs text-[#53617d]">{r.response}</td><td className="px-4 py-4"><Status status={r.status}/></td><td className="whitespace-nowrap px-4 py-4 font-semibold">{money(r.amount)}</td><td className="px-4 py-4"><button onClick={()=>setSelected(r)} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 font-semibold text-[#53617d] hover:bg-blue-50 hover:text-blue-600"><Eye size={18}/>View</button></td></tr>)}{!visible.length&&<tr><td colSpan={9} className="px-5 py-14 text-center text-[#71809c]">No verification records match your filters.</td></tr>}</tbody></table></div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"><p className="text-sm text-[#657491]">Showing <strong>{filtered.length?(currentPage-1)*pageSize+1:0}–{Math.min(currentPage*pageSize,filtered.length)}</strong> of <strong>{filtered.length}</strong></p><div className="flex flex-wrap items-center gap-1.5"><button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded-lg border p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={18}/></button>{Array.from({length:totalPages},(_,i)=>i+1).filter(p=>totalPages<=7||p===1||p===totalPages||Math.abs(p-currentPage)<=1).map((p,i,a)=><span key={p} className="flex items-center gap-1.5">{i>0&&p-a[i-1]>1&&<span className="px-1 text-[#8a98b2]">…</span>}<button onClick={()=>setPage(p)} className={`min-w-9 rounded-lg border px-2.5 py-2 text-sm font-semibold ${p===currentPage?"border-[#2d51e8] bg-[#2d51e8] text-white":"border-[#dbe3f0] bg-white hover:bg-slate-50"}`}>{p}</button></span>)}<button disabled={currentPage===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="rounded-lg border p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight size={18}/></button></div></div>
      </section>
    </main>
    {selected&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1530]/55 p-3 backdrop-blur-[2px] sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section role="dialog" aria-modal="true" aria-label="Verification details" className="flex max-h-[min(90vh,850px)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex shrink-0 items-center gap-4 border-b border-[#e0e6f0] px-4 py-5 sm:px-6"><div className="flex h-12 w-24 shrink-0 items-center justify-center rounded-xl bg-[#e6f7ed] text-emerald-600 sm:w-[42%]"><Landmark size={22}/></div><div className="min-w-0 flex-1"><h2 className="text-lg font-bold sm:text-xl">Verification details</h2><p className="mt-1 truncate text-sm text-[#60708f]">{selected.id}</p></div><button aria-label="Close details" onClick={()=>setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100"><X size={20}/></button></header><div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"><div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-semibold"><ServiceIcon service={selected.service}/>{selected.service}</div><Status status={selected.status}/></div><div className="grid grid-cols-1 overflow-hidden rounded-xl border border-[#dce4ef] sm:grid-cols-2">{[
      ["Verification ID",selected.id],["Retailer",selected.retailer],["Service",SERVICES[selected.service].label],["Document (masked)",selected.document],["Name returned",selected.name],["Amount charged",money(selected.amount)],["Date & time",dateLabel(selected.date)],["Channel","Web dashboard"],...(selected.service==="Bank"?[["Bank","ICICI Bank"],["IFSC","ICIC0757823"],["Penny drop","₹1.00 credited via IMPS"],["IMPS RRN","652234781684"]]:[]),["Provider response",selected.response],["Verification status",selected.status]
    ].map(([label,value],i)=><div key={`${label}-${i}`} className={`min-w-0 border-b border-[#dce4ef] px-4 py-4 ${i%2===0?"sm:border-r":""}`}><p className="text-xs font-bold uppercase tracking-wide text-[#8b99b3]">{label}</p><p className="mt-1 break-words text-sm font-semibold text-[#172343] sm:text-base">{value}</p></div>)}</div><p className="mt-4 text-xs text-[#7a88a2]">Demo only. Identifiers are masked and provider responses are illustrative.</p></div><footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#dfe6f0] bg-[#f7f9fc] px-4 py-4 sm:px-6"><button onClick={()=>downloadReceipt(selected)} className="inline-flex items-center gap-2 rounded-lg border border-[#d3ddec] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><Download size={17}/>Download receipt</button><button onClick={()=>setSelected(null)} className="rounded-lg bg-[#2c50e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Close</button></footer></section></div>}
  </div>;
}
