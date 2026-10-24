import { useEffect, useMemo, useState } from "react";
import { Search, Download, Eye, X, ChevronLeft, ChevronRight, Fingerprint, CreditCard, Landmark, FilePenLine, CalendarDays, CheckCircle2, XCircle, FileText } from "lucide-react";

const retailer = "Shree Ganesh Mobile Point";
const samples = [
  { id: "VRF261024XIBCY", type: "e-Sign", document: "CL-261024XIBCY", name: "PRIYA KAPOOR", date: "2026-10-24T12:06:00", status: "Verified", amount: 30, mobile: "98XXXXXX10", hash: "1F7E7D6BDD323858", purpose: "KYC verification for account opening" },
  { id: "VRF261024MN9K", type: "Bank", document: "XXXXXX7891", name: "RAHUL CHOUDHARY", date: "2026-10-24T12:01:00", status: "Verified", amount: 15, bank: "Demo Bank", ifsc: "DEMO0001234" },
  { id: "VRF261024Q4BMK", type: "PAN", document: "ABXXXXX34L", name: "PRIYA KAPOOR", date: "2026-10-24T11:52:00", status: "Verified", amount: 10 },
  { id: "VRF261024UK3GU", type: "Aadhaar", document: "XXXX XXXX 9264", name: "PRIYA KAPOOR", date: "2026-10-24T11:47:00", status: "Verified", amount: 20 },
  { id: "VRF26102465CFV", type: "e-Sign", document: "CL-26102465CFV", name: "PANKAJ MISHRA", date: "2026-10-24T11:38:00", status: "Verified", amount: 30, mobile: "91XXXXXX45", hash: "C48D7A9E1F56D002", purpose: "KYC verification for account opening" },
  { id: "VRF261024PZ21S", type: "Bank", document: "XXXXXX9000", name: "PANKAJ MISHRA", date: "2026-10-24T11:37:00", status: "Verified", amount: 15 },
  { id: "VRF2610248N3CA", type: "PAN", document: "PQXXXXX81F", name: "PANKAJ MISHRA", date: "2026-10-24T11:33:00", status: "Verified", amount: 10 },
  { id: "VRF261024A7C9Q", type: "Aadhaar", document: "XXXX XXXX 1545", name: "PANKAJ MISHRA", date: "2026-10-24T11:28:00", status: "Verified", amount: 20 },
  { id: "VRF261023G2W9T", type: "PAN", document: "LMXXXXX71P", name: "NEHA SHAH", date: "2026-10-23T16:10:00", status: "Failed", amount: 10 },
  { id: "VRF261023H4P8L", type: "Bank", document: "XXXXXX2468", name: "AMIT PATEL", date: "2026-10-23T14:45:00", status: "Verified", amount: 15 },
  { id: "VRF261022K8J1D", type: "Aadhaar", document: "XXXX XXXX 3782", name: "KIRAN DESAI", date: "2026-10-22T10:20:00", status: "Failed", amount: 20 },
  { id: "VRF261021N2V6B", type: "e-Sign", document: "CL-261021N2V6B", name: "SNEHA PATEL", date: "2026-10-21T17:15:00", status: "Verified", amount: 30, mobile: "98XXXXXX32", purpose: "KYC verification for account opening" },
];

const typeConfig = {
  Aadhaar: { Icon: Fingerprint, bg: "bg-[#f0eaff]", color: "text-[#7851eb]", service: "Aadhaar OTP Verification" },
  PAN: { Icon: CreditCard, bg: "bg-[#edf0ff]", color: "text-[#3159f2]", service: "PAN Card Verification" },
  Bank: { Icon: Landmark, bg: "bg-[#e5f4ff]", color: "text-[#0795d1]", service: "Bank Account Verification (Penny Drop)" },
  "e-Sign": { Icon: FilePenLine, bg: "bg-[#e3f7f4]", color: "text-[#009b91]", service: "Consent Letter with e-Sign" },
};
const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const formatDate = (value) => new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
const csvEscape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
function downloadText(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function TypeIcon({ type, size = 17 }) {
  const config = typeConfig[type] || typeConfig.PAN;
  const Icon = config.Icon;
  return <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg} ${config.color}`}><Icon size={size} strokeWidth={1.9} /></span>;
}
function Status({ status }) {
  const good = status === "Verified";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${good ? "bg-[#e5f7ee] text-[#06975a]" : "bg-[#ffeaed] text-[#e33c4d]"}`}><span className={`h-1.5 w-1.5 rounded-full ${good ? "bg-[#06975a]" : "bg-[#e33c4d]"}`} />{status}</span>;
}
function DetailCell({ label, value }) {
  return <div className="min-w-0 border-b border-[#e1e7f1] px-4 py-4 sm:px-[18px]"><p className="mb-1 text-[11px] font-bold uppercase tracking-[0.025em] text-[#8a96af] sm:text-[12px]">{label}</p><p className="break-words text-[13px] font-semibold leading-6 text-[#14203c] sm:text-[14px]">{value || "—"}</p></div>;
}
function DetailsModal({ record, onClose }) {
  useEffect(() => {
    if (!record) return;
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [record, onClose]);
  if (!record) return null;
  const config = typeConfig[record.type];
  const Icon = config.Icon;
  const extra = record.type === "e-Sign"
    ? [["DOCUMENT", "Customer consent letter"], ["SIGNER MOBILE", record.mobile || "98XXXXXX10"], ["SIGN METHOD", "Aadhaar OTP e-Sign"], ["PURPOSE", record.purpose || "KYC verification for account opening"], ["DOCUMENT HASH", record.hash || "DEMO-SIGN-HASH"]]
    : record.type === "Bank"
      ? [["ACCOUNT", record.document], ["IFSC", record.ifsc || "DEMO0001234"], ["BANK", record.bank || "Demo Bank"], ["VERIFICATION METHOD", "₹1 penny drop (demo)"]]
      : record.type === "PAN"
        ? [["VERIFICATION METHOD", "PAN database lookup (demo)"], ["PAN", record.document]]
        : [["VERIFICATION METHOD", "Aadhaar OTP (demo)"], ["AADHAAR", record.document]];
  const details = [
    ["VERIFICATION ID", record.id], ["RETAILER", retailer],
    ["SERVICE", config.service], ["DOCUMENT (MASKED)", record.document],
    ["NAME RETURNED", record.name], ["AMOUNT CHARGED", rupees(record.amount)],
    ["DATE & TIME", formatDate(record.date)], ["CHANNEL", "Web dashboard"], ...extra,
  ];
  const receipt = `VERIFYHUB - DEMO RECEIPT\nVerification ID: ${record.id}\nRetailer: ${retailer}\nService: ${config.service}\nDocument: ${record.document}\nName: ${record.name}\nStatus: ${record.status}\nAmount charged: ${rupees(record.amount)}\nDate: ${formatDate(record.date)}\n\nSynthetic demo record. Not an official verification receipt.`;
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0c1730]/60 p-3 backdrop-blur-[2px] sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="verification-detail-title" className="flex max-h-[min(90vh,850px)] w-full max-w-[975px] flex-col overflow-hidden rounded-[19px] border border-[#dfe5ef] bg-white text-[#14203c] shadow-[0_24px_75px_rgba(12,22,45,.25)]">
      <div className="flex shrink-0 items-center gap-3 border-b border-[#e0e6f0] px-4 py-4 sm:gap-5 sm:px-7 sm:py-6">
        <div className={`flex h-[49px] w-[70px] shrink-0 items-center justify-center rounded-xl sm:w-[45%] ${record.type === "e-Sign" ? "bg-[#e4f6ee] text-[#0b9c62]" : `${config.bg} ${config.color}`}`}><Icon size={24} /></div>
        <div className="min-w-0 flex-1"><h2 id="verification-detail-title" className="text-[17px] font-bold sm:text-[20px]">Verification details</h2><p className="mt-1 break-all text-[12px] text-[#52617f] sm:text-[14px]">{record.id}</p></div>
        <button onClick={onClose} aria-label="Close details" className="rounded-lg p-2 text-[#63708d] hover:bg-[#f1f4fa]"><X size={20}/></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7">
        <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><TypeIcon type={record.type}/><span className="font-semibold">{record.type}</span></div><Status status={record.status}/></div>
        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-[#e1e7f1] sm:grid-cols-2">{details.map(([label, value]) => <DetailCell key={label} label={label} value={value}/>)}</div>
        <p className="mt-4 text-[12px] text-[#8a96af]">This is a synthetic demo record. No live KYC source was contacted.</p>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#e1e7f1] bg-[#f8faff] px-4 py-4 sm:px-7">
        <button onClick={() => downloadText(`receipt-${record.id}.txt`, receipt, "text/plain;charset=utf-8")} className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#d2dced] bg-white px-4 py-3 text-[13px] font-semibold text-[#14203c] shadow-sm hover:bg-[#f1f4fa]"><Download size={17}/> Download receipt</button>
        <button onClick={onClose} className="rounded-[10px] bg-[#2c50eb] px-6 py-3 text-[13px] font-semibold text-white hover:bg-[#2143d2]">Close</button>
      </div>
    </div>
  </div>;
}
export default function VerificationHistory() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All types");
  const [status, setStatus] = useState("All statuses");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const pageSize = 8;
  const filtered = useMemo(() => samples.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [r.id, r.type, r.document, r.name].some((v) => String(v).toLowerCase().includes(q));
    return matchesSearch && (type === "All types" || r.type === type) && (status === "All statuses" || r.status === status) && (!from || r.date.slice(0,10) >= from) && (!to || r.date.slice(0,10) <= to);
  }), [search, type, status, from, to]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const verified = filtered.filter((r) => r.status === "Verified").length;
  const failed = filtered.filter((r) => r.status === "Failed").length;
  const deducted = filtered.reduce((sum, r) => sum + r.amount, 0);
  const change = (setter) => (value) => { setter(value); setPage(1); };
  const exportCsv = () => {
    const headings = ["Verification ID", "Type", "Document (masked)", "Name", "Verification date", "Status", "Deducted (INR)"];
    const lines = filtered.map((r) => [r.id, r.type, r.document, r.name, formatDate(r.date), r.status, r.amount].map(csvEscape).join(","));
    downloadText("verifyhub-verification-history.csv", "\uFEFF" + [headings.map(csvEscape).join(","), ...lines].join("\r\n"), "text/csv;charset=utf-8");
  };
  return <div className="min-h-full bg-app-background px-4 py-6 font-poppins text-app-text sm:px-6 lg:px-7 lg:py-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-[23px] font-bold tracking-[-0.5px] sm:text-[27px]">Verification history</h1><p className="mt-1 text-[13px] text-app-text-secondary sm:text-[14px]">All verifications performed by {retailer}.</p></div>
      <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-[13px] font-semibold shadow-sm transition hover:bg-app-surface-muted"><Download size={17}/> Export CSV</button>
    </div>
    <div className="overflow-hidden rounded-[15px] border border-app-border bg-app-surface shadow-[0_1px_3px_rgba(16,30,70,.06)]">
      <div className="grid gap-3 border-b border-app-border p-4 sm:p-5 xl:grid-cols-[minmax(210px,1.5fr)_minmax(130px,.7fr)_minmax(130px,.7fr)_minmax(165px,.8fr)_minmax(165px,.8fr)]">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93a0b9]" size={18}/><input value={search} onChange={(e)=>change(setSearch)(e.target.value)} placeholder="Verification ID, document or name" aria-label="Search verifications" className="h-11 w-full rounded-lg border border-app-border bg-app-surface pl-10 pr-3 text-[13px] outline-none focus:border-[#4566f2]"/></div>
        <select value={type} onChange={(e)=>change(setType)(e.target.value)} aria-label="Filter by type" className="h-11 min-w-0 rounded-lg border border-app-border bg-app-surface px-3 text-[13px] outline-none"><option>All types</option>{Object.keys(typeConfig).map(t=><option key={t}>{t}</option>)}</select>
        <select value={status} onChange={(e)=>change(setStatus)(e.target.value)} aria-label="Filter by status" className="h-11 min-w-0 rounded-lg border border-app-border bg-app-surface px-3 text-[13px] outline-none"><option>All statuses</option><option>Verified</option><option>Failed</option></select>
        <label className="flex min-w-0 items-center gap-2"><span className="sr-only">From date</span><input type="date" value={from} max={to || undefined} onChange={(e)=>change(setFrom)(e.target.value)} className="h-11 w-full min-w-0 rounded-lg border border-app-border bg-app-surface px-2 text-[12px] outline-none"/></label>
        <label className="flex min-w-0 items-center gap-2"><span className="sr-only">To date</span><input type="date" value={to} min={from || undefined} onChange={(e)=>change(setTo)(e.target.value)} className="h-11 w-full min-w-0 rounded-lg border border-app-border bg-app-surface px-2 text-[12px] outline-none"/></label>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-app-border px-4 py-4 text-[13px] sm:px-5"><span><strong className="text-app-text">{filtered.length}</strong> <span className="text-app-text-secondary">records</span></span><span className="font-semibold text-[#099b60]">{verified} verified</span><span className="font-semibold text-[#e34351]">{failed} failed</span><span><strong>{rupees(deducted)}</strong> <span className="text-app-text-secondary">deducted</span></span></div>
      <div className="w-full overflow-x-auto"><table className="w-full min-w-[1000px] border-collapse text-left text-[13px]"><thead className="bg-app-surface-muted text-[11px] font-bold uppercase tracking-[.035em] text-app-text-muted"><tr>{["Verification ID","Type","Document (masked)","Name","Verification date","Status","Deducted", ""].map((h,i)=><th key={i} className={`whitespace-nowrap border-b border-app-border px-4 py-4 ${i===6 ? "text-right" : ""}`}>{h}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id} className="border-b border-app-border transition hover:bg-app-surface-muted"><td className="whitespace-nowrap px-4 py-4 font-mono text-[12px] font-semibold">{r.id}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><TypeIcon type={r.type}/><span className="font-semibold">{r.type}</span></div></td><td className="whitespace-nowrap px-4 py-4 font-mono text-[12px]">{r.document}</td><td className="whitespace-nowrap px-4 py-4">{r.name}</td><td className="whitespace-nowrap px-4 py-4">{formatDate(r.date)}</td><td className="px-4 py-4"><Status status={r.status}/></td><td className="whitespace-nowrap px-4 py-4 text-right font-bold">{rupees(r.amount)}</td><td className="px-4 py-4"><button onClick={()=>setSelected(r)} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 font-semibold text-app-text-secondary hover:bg-app-surface-muted hover:text-primary"><Eye size={17}/> View</button></td></tr>)}{visible.length===0&&<tr><td colSpan={8} className="px-5 py-14 text-center text-app-text-secondary">No verification records match your filters.</td></tr>}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"><p className="text-[12px] text-app-text-secondary">Showing {filtered.length ? (safePage-1)*pageSize+1 : 0}–{Math.min(safePage*pageSize, filtered.length)} of {filtered.length} records</p><div className="flex items-center gap-2"><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1} className="rounded-lg border border-app-border p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={17}/></button><span className="px-2 text-[12px] font-semibold">Page {safePage} of {totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages} className="rounded-lg border border-app-border p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight size={17}/></button></div></div>
    </div>
    <DetailsModal record={selected} onClose={()=>setSelected(null)}/>
  </div>;
}
