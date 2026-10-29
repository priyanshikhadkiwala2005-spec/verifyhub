import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, History, ListChecks, Clock3, Check, X, Copy, ReceiptText, RotateCcw, LockKeyhole, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import api, { getErrorMessage } from "../../api";
import { getUser } from "../../auth";

// Price + wallet: GET /retailer/overview · check: POST /verifications/verify (service_type "bank")
// Recent checks + today's count: GET /verifications/records?type=bank&retailer_id=…
const HISTORY_SIZE = 20;
const stages = ["Validating account and IFSC", "Sending ₹1 via IMPS (penny drop)", "Reading beneficiary name from bank", "Matching name and masking"];
// Same IFSC prefixes the backend recognises, used only for the hint under the IFSC field.
const BANKS = { SBIN: "State Bank of India", HDFC: "HDFC Bank", ICIC: "ICICI Bank", UTIB: "Axis Bank", PUNB: "Punjab National Bank", BARB: "Bank of Baroda", KKBK: "Kotak Mahindra Bank", CNRB: "Canara Bank", UBIN: "Union Bank of India", IDFB: "IDFC FIRST Bank", YESB: "Yes Bank", INDB: "IndusInd Bank" };
const inputStyle = "mt-2 w-full rounded-[10px] border border-[#d4deef] bg-white px-4 py-3 text-[14px] text-[#14213e] outline-none transition focus:border-[#3155ec] focus:ring-[3px] focus:ring-[#3155ec]/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white";
const panel = "overflow-hidden rounded-2xl border border-[#dfe6f2] bg-white shadow-[0_2px_4px_rgba(20,35,70,.04)] dark:border-slate-700 dark:bg-slate-900";
function money(n) { return n === null || n === undefined ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }
const today = () => new Date().toLocaleDateString("en-CA");
const statusLabel = (status) => (status === "verified" ? "Verified" : "Failed");
function timeAgo(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutes)) return "";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} hr ago` : new Date(iso).toLocaleString("en-IN");
}
const recordRows = (r) => [["Request ID", r.id], ["Account", r.doc], ["Beneficiary", r.name], ...Object.entries(r.details || {}).filter(([k]) => k !== "Beneficiary name").map(([k, v]) => [k, String(v)]), ["Status", statusLabel(r.status)], ["Charged", money(r.amount)], ["Date", new Date(r.created_at).toLocaleString("en-IN")], ["Provider response", r.response]];

export default function BankPennyDrop() {
  const navigate = useNavigate();
  const retailer = getUser();
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [price, setPrice] = useState(null);
  const [available, setAvailable] = useState(true);
  const [balance, setBalance] = useState(null);
  const [todayCount, setTodayCount] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const timers = useRef([]);

  const loadData = useCallback(() => {
    const scope = { type: "bank", retailer_id: retailer?.id };
    return Promise.all([
      api.get("/retailer/overview"),
      api.get("/verifications/records", { params: { ...scope, per_page: HISTORY_SIZE } }),
      api.get("/verifications/records", { params: { ...scope, start_date: today(), end_date: today(), per_page: 1 } }),
    ])
      .then(([overviewRes, historyRes, todayRes]) => {
        const d = overviewRes.data?.data;
        const service = (d?.quick_services ?? []).find((s) => s.id === "bank");
        setPrice(service ? Number(service.price) : null);
        setAvailable(service ? service.status === "available" : true);
        setBalance(Number(d?.wallet?.balance) || 0);
        setRecords(historyRes.data?.data?.data ?? []);
        setTodayCount(Number(todayRes.data?.data?.total) || 0);
        setLoadError("");
      })
      .catch((err) => setLoadError(getErrorMessage(err, "Unable to load your wallet and bank verification history.")))
      .finally(() => setRecordsLoading(false));
  }, [retailer?.id]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3500); return () => clearTimeout(t); }, [toast]);
  function clearForm() { timers.current.forEach(clearTimeout); timers.current = []; setAccount(""); setIfsc(""); setName(""); setConsent(false); setErrors({}); setPhase("idle"); setResult(null); setProgress(0); }
  // Test values: the backend's sandbox gateway fails any account number ending in 0000.
  function fillSample(kind) { setAccount(kind === "valid" ? "50100234567891" : "50100234560000"); setIfsc("HDFC0001234"); setName("Rahul Choudhary"); setConsent(true); setErrors({}); setResult(null); setPhase("idle"); }
  function validate() { const e = {}; if (!/^\d{9,18}$/.test(account)) e.account = "Enter a valid account number (9–18 digits)."; if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) e.ifsc = "Enter a valid 11-character IFSC code."; if (!/^[a-zA-Z .'-]{2,80}$/.test(name.trim())) e.name = "Enter the beneficiary name as per the bank account."; if (!consent) e.consent = "Customer consent is required."; if (!available) e.balance = "Bank verification is currently paused by the platform administrator."; else if (balance !== null && price !== null && balance < price) e.balance = `Insufficient wallet balance. You need ${money(price)}; available ${money(balance)}.`; setErrors(e); return Object.keys(e).length === 0; }
  async function verify(e) {
    e.preventDefault(); if (phase === "loading" || !validate()) return;
    setPhase("loading"); setResult(null); setProgress(0);
    stages.slice(0, -1).forEach((_, i) => { const t = setTimeout(() => setProgress(i + 1), (i + 1) * 750); timers.current.push(t); });
    try {
      const [{ data }] = await Promise.all([
        api.post("/verifications/verify", { retailer_id: retailer?.id, service_type: "bank", payload: { account, ifsc, name: name.trim() } }),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      const rec = data?.data;
      setResult(rec); setPhase("done");
      setToast(rec?.status === "verified" ? `Bank verified · ${money(rec.amount)} deducted` : `Account not found · ${money(rec?.amount)} deducted`);
    } catch (err) {
      setPhase("idle");
      setErrors({ balance: getErrorMessage(err, "Verification could not be completed. Please try again.") });
    } finally {
      timers.current.forEach(clearTimeout); timers.current = [];
      loadData();
    }
  }
  async function copyId(id) { try { await navigator.clipboard.writeText(id); setToast("Request ID copied"); } catch { setToast("Could not copy. Please copy manually."); } }
  function receipt(record) {
    const content = [`VERIFYHUB - BANK VERIFICATION RECEIPT`, `Retailer: ${retailer?.shop ?? ""} (${retailer?.id ?? ""})`, ...recordRows(record).map(([k, v]) => `${k}: ${v}`)].join("\n");
    const blob = new Blob([content], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `VerifyHub-Bank-${record.id}.txt`; a.click(); URL.revokeObjectURL(url);
  }
  const filtered = records.filter(r => `${r.id} ${r.doc} ${r.status} ${r.name}`.toLowerCase().includes(query.toLowerCase()));
  const visible = showAll ? filtered : filtered.slice(0, 5);
  const verified = result?.status === "verified";
  const bankHint = BANKS[ifsc.slice(0, 4)];
  return (
    <div className="min-h-screen bg-[#f3f5fb] px-4 py-5 font-poppins text-[#111d38] dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-xl font-bold sm:text-[23px]">Bank Account Verification (Penny Drop)</h1><p className="mt-1 text-[13px] leading-6 text-[#7b89a7] dark:text-slate-400">Send ₹1 to the account by IMPS and confirm the beneficiary name registered with the bank.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => navigate("/retailer/verification-history")} className="inline-flex items-center gap-2 rounded-lg border border-[#d8e1f0] bg-white px-4 py-2.5 text-[12px] font-semibold dark:border-slate-700 dark:bg-slate-900"><History size={16}/> Bank history</button><button onClick={() => navigate("/retailer/complete-kyc")} className="inline-flex items-center gap-2 rounded-lg border border-[#d8e1f0] bg-white px-4 py-2.5 text-[12px] font-semibold dark:border-slate-700 dark:bg-slate-900"><ListChecks size={16}/> Complete KYC</button></div>
      </div>
      {loadError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{loadError}</p>}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(340px,.94fr)_minmax(0,1.06fr)]">
        <section className={panel}>
          <div className="flex items-center gap-3 border-b border-[#e5eaf3] px-5 py-5 dark:border-slate-700"><div className="rounded-xl bg-[#e4f6f6] p-3 text-[#138e9a]"><Landmark size={23}/></div><div><h2 className="text-[14px] font-bold">Bank Account Verification (Penny Drop)</h2><p className="mt-1 text-[12px] text-[#8290a9]">{available ? "Charged to your wallet per request" : "Currently paused by the platform administrator"}</p></div></div>
          <form onSubmit={verify} className="space-y-4 p-5">
            <div className="grid grid-cols-3 gap-2">{[["Charge per request", money(price)], ["Wallet balance", money(balance)], ["Today", todayCount === null ? "—" : `${todayCount} checks`]].map(([label,value]) => <div key={label} className="rounded-lg border border-[#e7ebf4] bg-[#f7f9fd] p-3 dark:border-slate-700 dark:bg-slate-800"><p className="text-[10px] text-[#8390aa]">{label}</p><p className="mt-1 text-[13px] font-bold sm:text-[15px]">{value}</p></div>)}</div>
            <div><label className="flex justify-between text-[13px] font-semibold">Bank account number <span className="text-red-500">*</span></label><input className={inputStyle} inputMode="numeric" autoComplete="off" placeholder="9–18 digits" maxLength={18} value={account} disabled={phase === "loading"} onChange={e => {setAccount(e.target.value.replace(/\D/g, ""));setErrors(v => ({...v, account:""}));}}/>{errors.account && <p className="mt-1 text-xs text-red-500">{errors.account}</p>}</div>
            <div><label className="flex justify-between text-[13px] font-semibold">IFSC code <span className="text-red-500">*</span></label><input className={`${inputStyle} uppercase`} placeholder="e.g. HDFC0001234" maxLength={11} value={ifsc} disabled={phase === "loading"} onChange={e => {setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));setErrors(v => ({...v, ifsc:""}));}}/><p className="mt-1 text-[11px] text-[#8492ad]">{bankHint ? `Bank: ${bankHint}` : "Enter the bank branch IFSC"}</p>{errors.ifsc && <p className="mt-1 text-xs text-red-500">{errors.ifsc}</p>}</div>
            <div><label className="flex justify-between gap-2 text-[13px] font-semibold"><span>Beneficiary name <span className="text-red-500">*</span></span><span className="text-right text-[11px] font-normal text-[#8794ad]">Used for name match</span></label><input className={inputStyle} placeholder="Full name as per bank account" value={name} maxLength={80} disabled={phase === "loading"} onChange={e => {setName(e.target.value);setErrors(v => ({...v, name:""}));}}/>{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}</div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8995ae]">Try sample: <button type="button" onClick={() => fillSample("valid")} disabled={phase === "loading"} className="rounded-full border border-[#d6dff0] px-3 py-1.5 text-[#44516c] hover:bg-[#eef3ff] dark:text-slate-200">✓ Valid account</button><button type="button" onClick={() => fillSample("invalid")} disabled={phase === "loading"} className="rounded-full border border-[#d6dff0] px-3 py-1.5 text-[#44516c] hover:bg-[#eef3ff] dark:text-slate-200">× Invalid account</button></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-[#d8e1f0] bg-[#f8faff] p-4 text-[12px] leading-5 text-[#52617d] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><input type="checkbox" checked={consent} disabled={phase === "loading"} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#2d52e8]"/><span>I confirm that the customer has given explicit consent for this verification, and it is being performed for a lawful KYC purpose in line with VerifyHub's acceptable use policy.</span></label>{errors.consent && <p className="text-xs text-red-500">{errors.consent}</p>}{errors.balance && <p className="text-xs text-red-500">{errors.balance}</p>}
            <div className="flex justify-end gap-3"><button type="button" onClick={clearForm} className="rounded-lg px-4 py-3 text-[13px] font-semibold text-[#5c6a85] hover:bg-[#f2f4fa] dark:text-slate-300">Clear</button><button type="submit" disabled={phase === "loading" || !available} className="inline-flex items-center gap-2 rounded-lg bg-[#2e53eb] px-5 py-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[#2344ce] disabled:opacity-60"><Landmark size={16}/>{phase === "loading" ? "Verifying..." : "Run ₹1 penny drop"}</button></div>
            <div className="flex items-start gap-2 rounded-lg border border-[#d4e9f0] bg-[#eefaff] p-3 text-[11px] leading-5 text-[#587587] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><LockKeyhole size={16} className="mt-0.5 shrink-0"/> Account numbers are masked in history and never stored in full. Each check is charged to your wallet, including checks that fail. The backend currently uses a sandbox gateway, so bank responses are simulated.</div>
          </form>
        </section>
        <div className="space-y-5">
          <section className={`${panel} min-h-[330px]`}>
            {phase === "idle" ? <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-10 text-center"><div className="mb-4 rounded-full border-2 border-[#dce4ff] p-3"><div className="rounded-full bg-[#eef2ff] p-5 text-[#3259eb]"><Landmark size={29}/></div></div><h3 className="font-bold">Verification result</h3><p className="mt-2 max-w-[260px] text-[12px] leading-5 text-[#8794ac]">Submit the details. The response will appear here.</p></div> : null}
            {phase === "loading" ? <div className="flex min-h-[400px] flex-col items-center justify-center p-7 text-center"><div className="mb-4 animate-pulse rounded-full border-2 border-[#c9d6ff] p-2"><div className="rounded-full bg-[#eef2ff] p-5 text-[#2d55ef]"><Landmark size={32}/></div></div><h3 className="text-[18px] font-bold">Verifying...</h3><p className="mt-1 text-[13px] text-[#8995ad]">Please don't close this page</p><div className="mt-7 w-full max-w-[335px] space-y-5 text-left">{stages.map((step,i) => <div key={step} className="flex items-center gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-semibold ${i < progress ? "border-emerald-600 bg-emerald-600 text-white" : i === progress ? "border-[#3157ed] text-[#3157ed]" : "border-[#d6dfed] text-[#a0abc1]"}`}>{i < progress ? <Check size={17}/> : i+1}</div><span className={`text-[13px] ${i === progress ? "font-bold text-[#182440] dark:text-white" : i < progress ? "text-[#54627e] dark:text-slate-300" : "text-[#9ba8be]"}`}>{step}</span></div>)}</div></div> : null}
            {phase === "done" && result ? <div className="p-5 sm:p-7"><div className="flex flex-col items-center py-5 text-center"><div className={`mb-3 rounded-full p-4 ${verified ? "bg-[#e7f8ee] text-[#0b9a60]" : "bg-[#fff0f0] text-red-500"}`}>{verified ? <CheckCircle2 size={38}/> : <AlertTriangle size={38}/>}</div><h3 className="text-[20px] font-bold">{verified ? "Bank account verified" : "Account not found"}</h3><p className="mt-1 text-[12px] text-[#8794ac]">{result.response}</p></div><div className="space-y-3 rounded-xl border border-[#e3e9f3] bg-[#f8faff] p-4 dark:border-slate-700 dark:bg-slate-800">{recordRows(result).map(([k,v]) => <div key={k} className="flex flex-wrap justify-between gap-2 text-[12px]"><span className="text-[#7e8ca6]">{k}</span><strong className="break-all text-right">{v}</strong></div>)}</div><p className="mt-4 text-[12px] text-[#7e8ca6]">New wallet balance <strong className="text-[#14213e] dark:text-white">{money(balance)}</strong></p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => receipt(result)} className="inline-flex items-center gap-2 rounded-lg border border-[#d7e0f0] px-4 py-2.5 text-[12px] font-semibold dark:border-slate-700"><ReceiptText size={15}/> Receipt</button><button onClick={() => copyId(result.id)} className="inline-flex items-center gap-2 rounded-lg border border-[#d7e0f0] px-4 py-2.5 text-[12px] font-semibold dark:border-slate-700"><Copy size={15}/> Copy ID</button><button onClick={clearForm} className="inline-flex items-center gap-2 rounded-lg bg-[#2e53eb] px-4 py-2.5 text-[12px] font-semibold text-white"><RotateCcw size={15}/> New verification</button></div></div> : null}
          </section>
          <section className={panel}><div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5eaf3] px-5 py-4 dark:border-slate-700"><div className="flex items-center gap-2"><Clock3 size={17} className="text-[#516d9c]"/><h3 className="text-[14px] font-bold">Recent Bank checks</h3></div>{filtered.length > 5 && <button onClick={() => setShowAll(v => !v)} className="text-[12px] font-semibold text-[#2d53e9]">{showAll ? "Show less" : "View all"}</button>}</div><div className="p-4"><div className="relative mb-3"><Search size={16} className="absolute left-3 top-3 text-[#92a0b7]"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search request or account" className="w-full rounded-lg border border-[#e0e7f2] bg-white py-2.5 pl-9 pr-3 text-[12px] outline-none focus:border-[#3155eb] dark:border-slate-700 dark:bg-slate-800"/></div><div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-[11px]"><thead><tr className="border-b border-[#e5eaf3] text-[10px] uppercase tracking-wider text-[#8997ae] dark:border-slate-700"><th className="py-3">Request</th><th>Document</th><th>Status</th><th className="text-right">Charged</th></tr></thead><tbody>{visible.map(r => <tr key={r.id} onClick={() => setSelected(r)} className="cursor-pointer border-b border-[#eef1f7] hover:bg-[#f7f9fe] dark:border-slate-800 dark:hover:bg-slate-800"><td className="py-3 pr-3"><p className="font-semibold">{r.id}</p><p className="mt-1 text-[#8a97ae]">{timeAgo(r.created_at)}</p></td><td className="pr-3 text-[#52617d] dark:text-slate-300">{r.doc}</td><td><span className={`rounded-full px-2.5 py-1 font-semibold ${r.status === "verified" ? "bg-[#e5f8ef] text-[#09945a]" : "bg-red-50 text-red-600"}`}>• {statusLabel(r.status)}</span></td><td className="text-right font-semibold">{money(r.amount)}</td></tr>)}</tbody></table>{visible.length === 0 && <p className="py-8 text-center text-[12px] text-[#8794ac]">{recordsLoading ? "Loading checks..." : records.length ? "No matching checks found." : "No bank checks yet."}</p>}</div></div></section>
        </div>
      </div>
      {toast && <div role="status" className="fixed right-4 top-20 z-[100] flex max-w-[340px] items-center gap-2 rounded-xl border border-[#dfe9e4] bg-white px-4 py-3 text-[12px] font-semibold text-[#176d4c] shadow-xl dark:bg-slate-800"><CheckCircle2 size={18}/>{toast}<button onClick={() => setToast("")} aria-label="Close notification"><X size={15}/></button></div>}
      {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101827]/55 p-4" onMouseDown={e => {if(e.target === e.currentTarget)setSelected(null);}}><div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 text-[#14213c] shadow-2xl dark:bg-slate-900 dark:text-white"><div className="flex justify-between gap-3"><h3 className="text-lg font-bold">Bank verification details</h3><button onClick={() => setSelected(null)} aria-label="Close"><X size={20}/></button></div><div className="mt-5 space-y-4">{recordRows(selected).map(([k,v]) => <div key={k} className="flex justify-between gap-4 border-b border-[#eef1f7] pb-2 text-sm dark:border-slate-700"><span className="text-[#8290aa]">{k}</span><span className="break-all text-right font-semibold">{v}</span></div>)}</div><div className="mt-6 flex justify-end gap-2"><button onClick={() => copyId(selected.id)} className="rounded-lg border border-[#d8e1ef] px-4 py-2 text-sm dark:border-slate-700">Copy ID</button><button onClick={() => receipt(selected)} className="rounded-lg bg-[#3155ed] px-4 py-2 text-sm text-white">Receipt</button></div></div></div>}
    </div>
  );
}
