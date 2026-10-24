import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ShieldCheck, Check, CheckCircle2, XCircle, Clock3, Copy, Receipt, RotateCcw, Sparkles, Info, ArrowRight, History, Download, X, Search, Eye, AlertTriangle, LoaderCircle } from "lucide-react";

const initialChecks = [
  { id: "VH261024P004", pan: "ABCDE1234F", name: "PRIYA KAPOOR", status: "Verified", date: "24 Oct 2026, 11:52 am", amount: 10 },
  { id: "VH261024P003", pan: "BDFPK4721M", name: "PANKAJ MISHRA", status: "Verified", date: "24 Oct 2026, 11:30 am", amount: 10 },
  { id: "VH261024P002", pan: "ABCPD3029Q", name: "GAURAV SHARMA", status: "Verified", date: "24 Oct 2026, 10:28 am", amount: 10 },
  { id: "VH261024P001", pan: "CDEPS5604N", name: "DIVYA MENON", status: "Verified", date: "24 Oct 2026, 09:12 am", amount: 10 },
];
const maskPAN = (pan) => pan ? `${pan.slice(0, 2)}XXXXX${pan.slice(-3)}` : "—";
const fmtMoney = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const nowLabel = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const makeId = () => `VH${Date.now().toString().slice(-10)}P`;

export default function PANVerification() {
  const navigate = useNavigate();
  const [pan, setPan] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [mode, setMode] = useState("valid");
  const [stage, setStage] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [checks, setChecks] = useState(initialChecks);
  const [balance, setBalance] = useState(2875);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [query, setQuery] = useState("");
  const timers = useRef([]);
  const toastTimer = useRef(null);

  useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(toastTimer.current); }, []);
  const notify = (message) => { setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 3500); };
  const reset = () => { timers.current.forEach(clearTimeout); timers.current = []; setPan(""); setName(""); setConsent(false); setMode("valid"); setStage("idle"); setProgress(0); setResult(null); setError(""); };
  const sample = (kind) => { reset(); setMode(kind); setPan(kind === "valid" ? "ABCDE1234F" : "ZZZZZ9999Z"); setName(kind === "valid" ? "Priya Kapoor" : "Test Customer"); setConsent(true); };

  const verify = (event) => {
    event.preventDefault();
    const value = pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)) return setError("Enter a valid PAN format, e.g. ABCDE1234F.");
    if (!consent) return setError("Customer consent is required before verification.");
    if (balance < 10) return setError("Insufficient demo wallet balance.");
    setError(""); setResult(null); setStage("verifying"); setProgress(0);
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => setProgress(1), 700),
      setTimeout(() => setProgress(2), 1650),
      setTimeout(() => {
        const success = mode !== "not-found";
        const record = { id: makeId(), pan: value, name: name.trim() || (success ? "PRIYA KAPOOR" : "—"), status: success ? "Verified" : "Not found", date: nowLabel(), amount: 10 };
        setBalance(b => b - 10); setChecks(c => [record, ...c]); setResult(record); setStage("done");
        notify(success ? "PAN verified · ₹10 deducted (demo)" : "PAN not found · ₹10 deducted (demo)");
      }, 2900),
    ];
  };
  const copyId = async (id) => { try { await navigator.clipboard.writeText(id); notify("Verification ID copied"); } catch { notify(`ID: ${id}`); } };
  const downloadReceipt = (record) => {
    if (!record) return;
    const content = `VERIFYHUB DEMO RECEIPT\nVerification ID: ${record.id}\nService: PAN Card Verification\nPAN: ${maskPAN(record.pan)}\nName: ${record.name}\nStatus: ${record.status}\nDate: ${record.date}\nCharge: ₹10\n\nSynthetic demo only. Not an official verification receipt.`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `pan-receipt-${record.id}.txt`; link.click(); URL.revokeObjectURL(url);
  };
  const filteredChecks = checks.filter(c => `${c.id} ${c.pan} ${c.name} ${c.status}`.toLowerCase().includes(query.toLowerCase()));
  const steps = ["Validating input and consent", "Querying income-tax source (sandbox)", "Matching and masking response"];
  const fieldClass = "w-full rounded-xl border border-[#d5dff0] bg-[#f8faff] px-4 py-3 text-[13px] text-[#111c38] outline-none transition focus:border-[#2e55ee] focus:ring-2 focus:ring-[#2e55ee]/10 dark:border-app-border dark:bg-app-background dark:text-app-text";
  const btnSecondary = "inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5dff0] bg-white px-3 py-2 text-xs font-semibold text-[#40516e] hover:bg-[#f3f6ff] dark:border-app-border dark:bg-app-surface dark:text-app-text";
  return (
    <div className="min-h-full bg-[#f3f5fc] px-3 py-5 font-poppins text-[#111b36] sm:px-5 lg:px-7 dark:bg-app-background dark:text-app-text">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div><div className="mb-1 flex items-center gap-2 text-xs text-[#8795b0]">Retailer <span>›</span> PAN Verification</div><h1 className="text-xl font-bold sm:text-2xl">PAN Card Verification</h1><p className="mt-1 text-xs text-[#8795b0] sm:text-sm">Validate a Permanent Account Number and fetch the holder name.</p></div>
          <div className="flex flex-wrap gap-2"><button className={btnSecondary} onClick={() => navigate("/retailer/verification-history?type=PAN")}><History size={15}/> PAN history</button><button className="inline-flex items-center gap-2 rounded-lg bg-[#2e55ee] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2145cf]" onClick={() => navigate("/retailer/complete-kyc")}><ShieldCheck size={15}/> Complete KYC</button></div>
        </div>
              <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)]">
          <section className="overflow-hidden rounded-2xl border border-[#e1e7f2] bg-white shadow-sm dark:border-app-border dark:bg-app-surface">
            <div className="flex items-center gap-3 border-b border-[#e6ebf5] p-4 sm:p-5 dark:border-app-border"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf1ff] text-[#2d56f0]"><CreditCard size={22}/></div><div><h2 className="text-sm font-bold">PAN Card Verification</h2><p className="text-xs text-[#8996b0]">Demo simulator · synthetic responses only</p></div></div>
            <div className="grid grid-cols-3 gap-2 p-4 sm:gap-3 sm:p-5">
              {[{label:"Charge per request",value:"₹10"},{label:"Wallet balance",value:fmtMoney(balance)},{label:"Today",value:`${checks.length + 1} checks`}].map(s => <div key={s.label} className="rounded-lg bg-[#f5f7fd] px-2 py-3 dark:bg-app-background"><p className="text-[10px] text-[#8290a9] sm:text-xs">{s.label}</p><p className="mt-1 text-sm font-bold sm:text-base">{s.value}</p></div>)}
            </div>
            <form onSubmit={verify} className="space-y-4 px-4 pb-5 sm:px-5">
              <div><label htmlFor="pan-number" className="mb-2 block text-xs font-semibold">PAN number <span className="text-red-500">*</span></label><input id="pan-number" value={pan} maxLength={10} disabled={stage === "verifying"} onChange={e => { setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"")); setError(""); }} placeholder="e.g. ABCDE1234F" className={`${fieldClass} uppercase tracking-wider`}/><p className="mt-1 text-[11px] text-[#8896ae]">10 characters: 5 letters, 4 digits, 1 letter</p></div>
              <div><div className="mb-2 flex flex-wrap justify-between gap-1"><label htmlFor="pan-name" className="text-xs font-semibold">Customer name</label><span className="text-[11px] text-[#8996b0]">Optional · for name match</span></div><input id="pan-name" value={name} disabled={stage === "verifying"} onChange={e => setName(e.target.value)} placeholder="Full name" className={fieldClass}/></div>
              <div className="flex flex-wrap items-center gap-2"><span className="text-[11px] text-[#8795ad]">Try sample:</span><button type="button" className={btnSecondary} onClick={() => sample("valid")}><Sparkles size={13}/> Valid PAN</button><button type="button" className={btnSecondary} onClick={() => sample("not-found")}><RotateCcw size={13}/> Record not found</button></div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-[#d5dff0] bg-[#f8faff] p-3 text-xs leading-5 text-[#51617f] dark:border-app-border dark:bg-app-background dark:text-app-text-secondary"><input type="checkbox" checked={consent} disabled={stage === "verifying"} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#2e55ee]"/><span>I confirm that the customer has given explicit consent for this PAN verification, and it is being performed for a lawful KYC purpose in line with VerifyHub's acceptable use policy.</span></label>
              {error && <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</div>}
              <div className="flex flex-wrap items-center justify-end gap-2"><button type="button" onClick={reset} className={btnSecondary}>Clear</button><button type="submit" disabled={stage === "verifying"} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-[#2e55ee] px-4 py-3 text-xs font-semibold text-white hover:bg-[#2145cf] disabled:opacity-60">{stage === "verifying" ? <><LoaderCircle size={15} className="animate-spin"/> Verifying...</> : <><ShieldCheck size={15}/> Verify PAN</>}</button></div>
              <div className="flex items-start gap-2 rounded-lg bg-[#ecf9ff] p-3 text-[11px] leading-5 text-[#45647a] dark:bg-app-background dark:text-app-text-secondary"><Info size={16} className="mt-0.5 shrink-0 text-[#2e55ee]"/><p>Identifiers are masked in history and result views. This is a simulated verification; it does not contact UIDAI, tax authorities or any live source.</p></div>
            </form>
          </section>
          <div className="space-y-5">
            <section className="min-h-[260px] overflow-hidden rounded-2xl border border-[#e1e7f2] bg-white shadow-sm dark:border-app-border dark:bg-app-surface">
              {stage === "idle" && <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f3ff] text-[#8b9cc7]"><CreditCard size={27}/></div><h3 className="text-sm font-bold">Verification result</h3><p className="mt-2 max-w-xs text-xs text-[#8996b0]">Submit the details. The response will appear here.</p></div>}
              {stage === "verifying" && <div className="flex min-h-[330px] flex-col items-center justify-center px-5 py-8"><div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#dce4ff]"><div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#7c98ff] bg-[#edf1ff] text-[#2e55ee]"><CreditCard size={32}/></div></div><h3 className="text-base font-bold">Verifying...</h3><p className="mt-1 text-sm text-[#8b99b3]">Please don't close this page</p><div className="mt-6 w-full max-w-[315px] space-y-4">{steps.map((s,i) => <div key={s} className="flex items-center gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${i < progress ? "border-emerald-600 bg-emerald-600 text-white" : i === progress ? "border-[#2e55ee] text-[#2e55ee]" : "border-[#d5dff0] text-[#9aa7c0]"}`}>{i < progress ? <Check size={15}/> : i+1}</div><span className={`text-xs sm:text-sm ${i === progress ? "font-semibold text-[#15213e] dark:text-app-text" : "text-[#8996b0]"}`}>{s}</span></div>)}</div></div>}
              {stage === "done" && result && <div className="p-4 sm:p-6"><div className="mb-5 flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${result.status === "Verified" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>{result.status === "Verified" ? <CheckCircle2 size={24}/> : <XCircle size={24}/>}</div><div><h3 className="text-base font-bold">{result.status === "Verified" ? "Verification successful" : "PAN record not found"}</h3><p className="mt-1 text-xs text-[#8290aa]">{result.status === "Verified" ? "PAN is valid and active in the demo response." : "No matching PAN record in this demo scenario."}</p></div><span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-semibold ${result.status === "Verified" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{result.status}</span></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[["Masked PAN",maskPAN(result.pan)],["Name on PAN",result.status === "Verified" ? result.name.toUpperCase() : "Not available"],["Holder type","Individual"],["PAN status",result.status === "Verified" ? "Active" : "Not found"],["Name match",result.status === "Verified" ? "Match · 100%" : "Unavailable"],["Verification date",result.date],["Verification ID",result.id],["Request charge","₹10 · Demo"]].map(([k,v]) => <div key={k} className="rounded-lg border border-[#e7ebf4] bg-[#fafbff] p-3 dark:border-app-border dark:bg-app-background"><p className="text-[10px] text-[#8996b0]">{k}</p><p className="mt-1 break-all text-xs font-semibold">{v}</p></div>)}</div><p className="mt-4 rounded-lg bg-[#f4f7ff] p-3 text-xs text-[#5a6b89] dark:bg-app-background dark:text-app-text-secondary">₹10 deducted from demo wallet · New balance {fmtMoney(balance)}</p><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" className={btnSecondary} onClick={() => { setSelectedCheck(result); setShowReceipt(true); }}><Receipt size={14}/> Receipt</button><button type="button" className={btnSecondary} onClick={() => copyId(result.id)}><Copy size={14}/> Copy ID</button><button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#2e55ee] px-3 py-2 text-xs font-semibold text-white" onClick={reset}><RotateCcw size={14}/> New verification</button></div></div>}
            </section>
            <section className="overflow-hidden rounded-2xl border border-[#e1e7f2] bg-white shadow-sm dark:border-app-border dark:bg-app-surface"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7ebf4] px-4 py-4 sm:px-5 dark:border-app-border"><div><h3 className="flex items-center gap-2 text-sm font-bold"><Clock3 size={16} className="text-[#2e55ee]"/> Recent PAN checks</h3><p className="mt-1 text-xs text-[#8b98b1]">Your latest PAN verification requests</p></div><button className="text-xs font-semibold text-[#2e55ee]" onClick={() => navigate("/retailer/verification-history?type=PAN")}>View all <ArrowRight size={13} className="inline"/></button></div><div className="p-3 sm:p-4"><div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ba7bd]"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search recent checks..." className="w-full rounded-lg border border-[#e0e6f1] bg-[#fafbff] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#2e55ee] dark:border-app-border dark:bg-app-background"/></div><div className="w-full overflow-x-auto"><table className="w-full min-w-[440px] text-left text-[11px]"><thead><tr className="border-b border-[#e9edf6] text-[#8996ae] dark:border-app-border"><th className="py-2 pr-2 font-semibold">REQUEST</th><th className="py-2 pr-2 font-semibold">DOCUMENT</th><th className="py-2 pr-2 font-semibold">STATUS</th><th className="py-2 text-right font-semibold">CHARGED</th></tr></thead><tbody>{filteredChecks.map(c => <tr key={c.id} onClick={() => setSelectedCheck(c)} className="cursor-pointer border-b border-[#f0f2f8] hover:bg-[#f8faff] dark:border-app-border dark:hover:bg-app-background"><td className="py-3 pr-2"><p className="font-semibold">{c.id}</p><p className="text-[10px] text-[#95a0b7]">{c.date}</p></td><td className="py-3 pr-2 font-medium">{maskPAN(c.pan)}</td><td className="py-3 pr-2"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${c.status === "Verified" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>● {c.status}</span></td><td className="py-3 text-right font-semibold">₹{c.amount}</td></tr>)}</tbody></table>{filteredChecks.length === 0 && <p className="py-6 text-center text-xs text-[#8996b0]">No checks found.</p>}</div></div></section>
          </div>
        </div>
      </div>
      {toast && <div role="status" className="fixed right-4 top-20 z-[100] max-w-[calc(100vw-2rem)] rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-semibold text-emerald-700 shadow-xl"><CheckCircle2 size={16} className="mr-2 inline"/>{toast}</div>}
      {selectedCheck && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c1735]/60 p-4" onMouseDown={e => { if(e.target === e.currentTarget){setSelectedCheck(null);setShowReceipt(false);} }}><div role="dialog" aria-modal="true" aria-label="PAN verification details" className="w-full max-w-md rounded-2xl bg-white p-5 text-[#15213e] shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-base font-bold">{showReceipt ? "Demo verification receipt" : "PAN verification details"}</h3><button onClick={() => {setSelectedCheck(null);setShowReceipt(false);}} aria-label="Close"><X size={20}/></button></div><div className="my-4 space-y-3 border-y border-[#e7ebf4] py-4 text-xs">{[["Verification ID",selectedCheck.id],["PAN",maskPAN(selectedCheck.pan)],["Customer",selectedCheck.name],["Status",selectedCheck.status],["Date",selectedCheck.date],["Charge","₹10"]].map(([k,v])=><div key={k} className="flex justify-between gap-4"><span className="text-[#8795ae]">{k}</span><span className="break-all text-right font-semibold">{v}</span></div>)}</div><p className="mb-4 text-[11px] text-[#8996b0]">Demo record only — not a government-issued confirmation.</p><div className="flex flex-wrap justify-end gap-2"><button className={btnSecondary} onClick={() => copyId(selectedCheck.id)}><Copy size={14}/> Copy ID</button><button className="inline-flex items-center gap-2 rounded-lg bg-[#2e55ee] px-3 py-2 text-xs font-semibold text-white" onClick={() => downloadReceipt(selectedCheck)}><Download size={14}/> Download receipt</button></div></div></div>}
    </div>
  );
}
