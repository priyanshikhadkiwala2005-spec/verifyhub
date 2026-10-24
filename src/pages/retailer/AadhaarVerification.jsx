import { useEffect, useRef, useState } from "react";
import { Fingerprint, Check, X, Send, LockKeyhole, Wallet, Clock3, Copy, Download, RotateCcw, ShieldCheck, AlertTriangle, CheckCircle2, Info, LoaderCircle } from "lucide-react";

const PRICE = 20;
const START_BALANCE = 2995;
const DEMO_OTP = "123456";
const sampleRows = [
  { id: "VRF261024BP038", last4: "8070", status: "Verified", ago: "9 min ago" },
  { id: "VRF2610240DXXH", last4: "7070", status: "Verified", ago: "13 min ago" },
  { id: "VRF261024ZHL7K", last4: "8070", status: "Verified", ago: "20 min ago" },
  { id: "VRF261024MRIPX", last4: "2121", status: "Verified", ago: "24 min ago" },
];
const formatAadhaar = (value) => value.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})(?=\d)/g, "$1 ");
const newId = () => `VRF${new Date().toISOString().slice(2,10).replace(/-/g, "")}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const nowText = () => new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
const initialHistory = sampleRows.map((row) => ({ ...row, charge: PRICE }));

export default function AadhaarVerification() {
  const [aadhaar, setAadhaar] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [consent, setConsent] = useState(false);
  const [sampleType, setSampleType] = useState("valid");
  const [phase, setPhase] = useState("idle");
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [attempts, setAttempts] = useState(3);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [result, setResult] = useState(null);
  const [balance, setBalance] = useState(START_BALANCE);
  const [history, setHistory] = useState(initialHistory);
  const otpRef = useRef(null);
  const timers = useRef([]);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  useEffect(() => {
    if (phase !== "otp" || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [phase, seconds]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3800);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { if (phase === "otp") otpRef.current?.focus(); }, [phase]);

  const reset = () => {
    clearTimers(); setAadhaar(""); setCustomerName(""); setConsent(false);
    setSampleType("valid"); setPhase("idle"); setOtp(""); setSeconds(30);
    setAttempts(3); setProgress(0); setError(""); setResult(null);
  };
  const fillSample = (kind) => {
    setSampleType(kind); setAadhaar(kind === "valid" ? "482153079264" : "999988887777");
    setCustomerName(kind === "valid" ? "Priya Kapoor" : "Unknown Customer");
    setError(""); setResult(null); setPhase("idle"); setOtp("");
  };
  const sendOtp = () => {
    if (aadhaar.replace(/\D/g, "").length !== 12) return setError("Enter a valid 12-digit demo Aadhaar number.");
    if (!consent) return setError("Customer consent is required before sending an OTP.");
    if (balance < PRICE) return setError("Insufficient demo wallet balance.");
    setError(""); setOtp(""); setAttempts(3); setSeconds(30); setPhase("otp");
    setToast("Demo Aadhaar OTP generated. Use 123456 to continue.");
  };
  const verifyOtp = () => {
    if (otp.length !== 6) return setError("Please enter the complete 6-digit OTP.");
    if (otp !== DEMO_OTP) {
      const remaining = attempts - 1;
      setAttempts(remaining); setOtp("");
      if (remaining <= 0) { setPhase("idle"); setError("Too many incorrect attempts. Please send a new OTP."); }
      else setError(`Incorrect demo OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`);
      return;
    }
    setError(""); setPhase("verifying"); setProgress(0); clearTimers();
    [1, 2, 3].forEach((step, index) => {
      timers.current.push(setTimeout(() => setProgress(step), 700 + index * 1050));
    });
    timers.current.push(setTimeout(() => {
      const status = sampleType === "valid" ? "Verified" : "Not found";
      const data = {
        id: newId(), status, last4: aadhaar.replace(/\D/g, "").slice(-4),
        name: sampleType === "valid" ? "Priya Kapoor" : "—", gender: sampleType === "valid" ? "Female" : "—",
        birthYear: sampleType === "valid" ? "1990" : "—", state: sampleType === "valid" ? "Bihar" : "—",
        date: nowText(), nameMatch: customerName.trim() && sampleType === "valid" ? "Match · 100%" : "Not requested",
        charge: PRICE,
      };
      setResult(data); setBalance((v) => Math.max(0, v - PRICE));
      setHistory((rows) => [{ ...data, ago: "Just now" }, ...rows]);
      setPhase("done"); setToast(status === "Verified" ? `Aadhaar verified · ₹${PRICE} deducted` : `Aadhaar not found · ₹${PRICE} deducted`);
    }, 4050));
  };
  const resendOtp = () => {
    if (seconds > 0) return;
    setOtp(""); setSeconds(30); setError(""); setToast("New demo OTP sent. Use 123456.");
    otpRef.current?.focus();
  };
  const copyId = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.id); setToast("Request ID copied to clipboard."); }
    catch { setToast(`Request ID: ${result.id}`); }
  };
  const downloadReceipt = () => {
    if (!result) return;
    const receipt = ["VERIFYHUB - DEMO AADHAAR VERIFICATION RECEIPT", "", `Reference: ${result.id}`, `Date: ${result.date}`, `Aadhaar: XXXX XXXX ${result.last4}`, `Status: ${result.status}`, `Charge: INR ${PRICE}`, `Wallet balance: INR ${balance}`, "", "Synthetic demo record. Not an official UIDAI verification."].join("\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `${result.id}-receipt.txt`; a.click();
    URL.revokeObjectURL(url);
  };
  const card = "rounded-2xl border border-app-border bg-app-surface shadow-sm";
  const field = "w-full rounded-xl border border-app-border bg-app-surface px-4 py-3 text-[14px] text-app-text outline-none transition focus:border-[#3159eb] focus:ring-2 focus:ring-[#3159eb]/10 disabled:opacity-70";
  const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-[13px] font-semibold text-app-text shadow-sm transition hover:bg-app-surface-muted";
  const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#2d52e9] px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#2044d6] disabled:cursor-not-allowed disabled:opacity-55";
  return (
    <div className="min-h-full bg-app-background px-4 py-5 font-poppins text-app-text sm:px-6 lg:px-7">
      {toast && <div role="status" className="fixed right-4 top-20 z-[90] flex max-w-[390px] items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-[#15213c] shadow-xl"><CheckCircle2 size={19} className="shrink-0 text-emerald-600"/><span className="flex-1">{toast}</span><button onClick={() => setToast("")} aria-label="Close notification"><X size={17}/></button></div>}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-[22px] font-bold tracking-tight sm:text-[25px]">Aadhaar Verification</h1><p className="mt-1 text-[13px] text-app-text-secondary">Authenticate the customer with an OTP sent to their Aadhaar-linked mobile.</p></div>
        <div className="flex items-center gap-2"><button className={secondaryButton} onClick={() => document.getElementById("aadhaar-history")?.scrollIntoView({ behavior: "smooth" })}><Clock3 size={16}/> Aadhaar history</button><button className={secondaryButton} onClick={() => document.getElementById("complete-kyc-note")?.scrollIntoView({ behavior: "smooth" })}><ShieldCheck size={16}/> Complete KYC</button></div>
      </div>
      
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
        <section className={`${card} overflow-hidden`}>
          <div className="flex items-center gap-4 border-b border-app-border px-5 py-5 sm:px-6"><span className="rounded-xl bg-violet-100 p-3 text-violet-600"><Fingerprint size={24}/></span><div><h2 className="text-[16px] font-bold">Aadhaar Verification (OTP)</h2><p className="mt-1 text-[12px] text-app-text-secondary">Demo simulator · synthetic responses only</p></div></div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">{[{label:"Charge per request",value:`₹${PRICE}`},{label:"Wallet balance",value:`₹${balance.toLocaleString("en-IN")}`},{label:"Today",value:`${history.length} checks`}].map((item)=><div key={item.label} className="min-w-0 rounded-xl border border-app-border bg-app-surface-muted p-3"><p className="text-[10px] leading-4 text-app-text-secondary sm:text-[11px]">{item.label}</p><p className="mt-1 text-[15px] font-bold sm:text-[17px]">{item.value}</p></div>)}</div>
            <div><label htmlFor="aadhaar-input" className="mb-2 flex justify-between text-[13px] font-semibold">Aadhaar number <span className="text-rose-500">*</span></label><input id="aadhaar-input" inputMode="numeric" autoComplete="off" placeholder="XXXX XXXX XXXX" className={`${field} font-mono tracking-wider`} value={aadhaar} disabled={phase === "verifying"} onChange={(e)=>{setAadhaar(formatAadhaar(e.target.value));setError("");if(phase!=="idle"){setPhase("idle");setResult(null);}}}/><p className="mt-2 text-[11px] text-app-text-secondary">12 digits. Only the last 4 digits are kept in demo history.</p></div>
            <div><label htmlFor="aadhaar-name" className="mb-2 flex flex-wrap justify-between gap-1 text-[13px] font-semibold">Customer name <span className="font-normal text-app-text-secondary">Optional · for name match</span></label><input id="aadhaar-name" placeholder="Full name" className={field} value={customerName} disabled={phase === "verifying"} onChange={(e)=>setCustomerName(e.target.value)}/></div>
            <div className="flex flex-wrap items-center gap-2 text-[12px]"><span className="mr-1 font-semibold text-app-text-secondary">Try sample:</span><button className={`${secondaryButton} !rounded-full !px-3 !py-2`} onClick={()=>fillSample("valid")}><Check size={14}/> Valid Aadhaar</button><button className={`${secondaryButton} !rounded-full !px-3 !py-2`} onClick={()=>fillSample("missing")}><X size={14}/> Not found</button></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-app-border bg-app-surface-muted p-4 text-[12px] leading-5 text-app-text-secondary"><input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#2d52e9]"/><span>I confirm that the customer has given explicit <b>consent</b> for this verification, and it is being performed for a lawful KYC purpose in line with VerifyHub's acceptable use policy.</span></label>
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</p>}
            <div className="flex items-center justify-end gap-3"><button className="px-3 py-2 text-[13px] font-semibold text-app-text-secondary hover:text-app-text" onClick={reset}>Clear</button><button className={primaryButton} disabled={phase === "verifying"} onClick={sendOtp}><Send size={16}/> Send Aadhaar OTP</button></div>
            <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-[12px] leading-5 text-[#25455d]"><LockKeyhole size={19} className="mt-0.5 shrink-0 text-sky-600"/><span>The full Aadhaar number is not saved in history. Use <b>synthetic test values only.</b> This demo does not contact UIDAI, any bank or any government source.</span></div>
          </div>
        </section>
        <div className="space-y-5">
          <section className={`${card} min-h-[330px] overflow-hidden`}>
            {phase === "idle" && <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-12 text-center"><div className="mb-5 rounded-full border border-dashed border-app-border p-2"><div className="rounded-full bg-app-surface-muted p-7 text-app-text-muted"><Fingerprint size={36}/></div></div><h3 className="text-[17px] font-bold">Verification result</h3><p className="mt-2 max-w-[350px] text-[13px] leading-6 text-app-text-secondary">Submit the details and enter the OTP. The result will appear here.</p></div>}
            {phase === "otp" && <div className="px-5 py-6 sm:px-7"><div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-3 text-[#2d52e9]"><ShieldCheck size={22}/></span><div><h3 className="font-bold">Enter Aadhaar OTP</h3><p className="text-[12px] text-app-text-secondary">A 6-digit demo OTP has been sent to the simulated linked mobile.</p></div></div><p className="mb-2 text-[13px] font-semibold">6-digit OTP</p><input ref={otpRef} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="0 0 0 0 0 0" value={otp} onChange={(e)=>{setOtp(e.target.value.replace(/\D/g, "").slice(0,6));setError("");}} className={`${field} max-w-[320px] text-center font-mono text-[22px] tracking-[0.4em]`}/><p className="mt-2 text-[12px] text-app-text-secondary">Demo OTP: <b>123456</b> · {attempts} attempts left</p><div className="mt-6 flex flex-wrap items-center justify-end gap-3"><button className="mr-auto text-[12px] font-semibold text-app-text-secondary hover:text-app-text" onClick={()=>{setPhase("idle");setOtp("");setError("");}}>Cancel</button><button className={secondaryButton} disabled={seconds>0} onClick={resendOtp}>Resend OTP {seconds>0?`(${seconds}s)`:""}</button><button className={primaryButton} onClick={verifyOtp}><ShieldCheck size={16}/> Verify OTP</button></div></div>}
            {phase === "verifying" && <div className="flex min-h-[370px] flex-col items-center justify-center px-5 py-9"><div className="mb-4 rounded-full border-2 border-[#d7e0ff] p-2"><div className="rounded-full bg-[#edf1ff] p-6 text-[#2d52e9]"><Fingerprint size={38} className="animate-pulse"/></div></div><h3 className="text-[18px] font-bold">Verifying...</h3><p className="mt-1 text-[13px] text-app-text-secondary">Please don't close this page</p><div className="mt-7 w-full max-w-[345px] space-y-5">{["Validating Aadhaar and consent","Authenticating with UIDAI partner (sandbox)","Fetching e-KYC details and masking"].map((label,i)=><div key={label} className="flex items-center gap-4"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-semibold ${progress>i?"border-emerald-600 bg-emerald-600 text-white":progress===i?"border-[#3159eb] text-[#3159eb]":"border-app-border text-app-text-muted"}`}>{progress>i?<Check size={16}/>:i+1}</span><span className={`text-[13px] ${progress===i?"font-semibold text-app-text":"text-app-text-secondary"}`}>{label}</span></div>)}</div></div>}
            {phase === "done" && result && <div><div className="border-b border-app-border px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${result.status==="Verified"?"bg-emerald-50 text-emerald-600":"bg-rose-50 text-rose-600"}`}>{result.status==="Verified"?<CheckCircle2 size={24}/>:<AlertTriangle size={24}/>}</span><div><h3 className="text-[17px] font-bold">{result.status==="Verified"?"Aadhaar verified":"Aadhaar not found"}</h3><p className="text-[12px] text-app-text-secondary">Demo response · {result.id}</p></div></div></div><div className="grid grid-cols-1 sm:grid-cols-2">{[{label:"AADHAAR",value:`XXXX XXXX ${result.last4}`},{label:"CUSTOMER NAME",value:result.name},{label:"GENDER",value:result.gender},{label:"YEAR OF BIRTH",value:result.birthYear},{label:"STATE",value:result.state},{label:"MOBILE LINKED",value:result.status==="Verified"?"Yes · XXXXXX80":"—"},{label:"NAME MATCH",value:result.nameMatch},{label:"STATUS",value:result.status},{label:"REQUEST / REFERENCE ID",value:result.id},{label:"DATE & TIME",value:result.date},{label:"PROVIDER RESPONSE",value:result.status==="Verified"?"200 · VERIFIED · OTP authenticated":"404 · NOT_FOUND · Demo response"}].map((item)=><div key={item.label} className="min-w-0 border-b border-app-border px-5 py-4 sm:border-r sm:px-6"><p className="text-[10px] font-bold tracking-wide text-app-text-muted">{item.label}</p><p className="mt-1 break-words text-[12px] font-semibold sm:text-[13px]">{item.value}</p></div>)}</div><div className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2 rounded-lg border border-app-border bg-app-surface-muted px-4 py-3 text-[12px]"><Wallet size={17} className="text-[#3159eb]"/><span>₹{PRICE} deducted from demo wallet · new balance <b>₹{balance.toLocaleString("en-IN")}</b></span></div><div className="flex flex-wrap justify-end gap-2"><button className={secondaryButton} onClick={downloadReceipt}><Download size={16}/> Receipt</button><button className={secondaryButton} onClick={copyId}><Copy size={16}/> Copy ID</button><button className={primaryButton} onClick={reset}><RotateCcw size={16}/> New verification</button></div></div></div>}
          </section>
          <section id="aadhaar-history" className={`${card} overflow-hidden`}><div className="flex items-center gap-2 border-b border-app-border px-5 py-5 sm:px-6"><Clock3 size={20} className="text-[#3159eb]"/><h3 className="text-[16px] font-bold">Recent Aadhaar checks</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-[12px]"><thead className="bg-app-surface-muted text-[11px] uppercase tracking-wide text-app-text-muted"><tr><th className="px-5 py-3 font-bold">Request</th><th className="px-4 py-3 font-bold">Document</th><th className="px-4 py-3 font-bold">Status</th><th className="px-5 py-3 text-right font-bold">Charged</th></tr></thead><tbody>{history.map((row)=><tr key={row.id} className="border-t border-app-border"><td className="px-5 py-4"><span className="font-mono font-semibold">{row.id}</span><p className="mt-1 text-[11px] text-app-text-muted">{row.ago || row.date}</p></td><td className="px-4 py-4 font-mono">XXXX XXXX {row.last4}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2 py-1 font-semibold ${row.status==="Verified"?"bg-emerald-50 text-emerald-700":"bg-rose-50 text-rose-700"}`}>• {row.status}</span></td><td className="px-5 py-4 text-right font-semibold">₹{row.charge}</td></tr>)}</tbody></table></div></section>
        </div>
      </div>
      <div id="complete-kyc-note" className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-app-text-secondary"><Info size={15} className="mt-0.5 shrink-0"/> This standalone Aadhaar check is a frontend demo. The Complete KYC multi-step flow remains a separate page. No actual OTP is sent or government identity data retrieved.</div>
    </div>
  );
}
