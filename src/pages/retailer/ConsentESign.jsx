import { useEffect, useRef, useState } from "react";
import { FileSignature, Wallet, Clock3, FileText, Send, ShieldCheck, Check, Copy, Download, RotateCcw, LockKeyhole, UserRound, X, LoaderCircle, CheckCircle2, AlertCircle, Eye, Mail, Smartphone, Search } from "lucide-react";

const PRICE = 30;
const DEMO_OTP = "123456";
const initialChecks = [
  { id: "VRF26102465CFV", doc: "CL-26102465CFV", time: "28 min ago", name: "Demo Customer", amount: 30 },
  { id: "VRF261024DYIJK", doc: "CL-261024DYIJK", time: "31 min ago", name: "Demo Customer", amount: 30 },
  { id: "VRF2610240M0KA", doc: "CL-2610240M0KA", time: "38 min ago", name: "Demo Customer", amount: 30 },
  { id: "VRF2610244VK7G", doc: "CL-2610244VK7G", time: "41 min ago", name: "Demo Customer", amount: 30 },
];
const stages = ["Generating consent letter PDF", "Applying Aadhaar OTP e-Sign (sandbox ESP)", "Embedding certificate and timestamp"];
const purposes = ["KYC verification for account opening", "Customer identity verification", "Bank account verification", "Retailer onboarding", "Other consent-based verification"];
const card = "overflow-hidden rounded-2xl border border-[#dce4f0] bg-white shadow-[0_1px_3px_rgba(18,35,70,0.06)] dark:border-slate-700 dark:bg-slate-900";
const field = "w-full rounded-xl border border-[#cdd8e9] bg-white px-4 py-3 text-[14px] text-[#111b35] outline-none transition focus:border-[#3156ec] focus:ring-2 focus:ring-[#3156ec]/15 dark:border-slate-600 dark:bg-slate-800 dark:text-white";
const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#2c50e9] px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#1e3fd2] disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#d3deee] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#15213c] transition hover:bg-[#f5f7ff] dark:border-slate-600 dark:bg-slate-800 dark:text-white";
const label = "mb-2 block text-[13px] font-semibold text-[#52617f] dark:text-slate-300";
const makeId = () => `VRF${new Date().toISOString().slice(2, 10).replace(/-/g, "")}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const maskMobile = (value) => `+91 ${value.slice(0, 2)}XXXXXX${value.slice(-2)}`;
const formatDate = (date) => date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function ConsentESign() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState(purposes[0]);
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("idle"); // idle, otp, signing, success
  const [stage, setStage] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [attempts, setAttempts] = useState(3);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState(false);
  const [selected, setSelected] = useState(null);
  const [balance, setBalance] = useState(2950);
  const [checks, setChecks] = useState(initialChecks);
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState("");
  const timer = useRef(null);
  const toastTimer = useRef(null);
  const otpInput = useRef(null);

  useEffect(() => {
    if (status !== "otp" || seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((v) => v - 1), 1000);
    return () => window.clearTimeout(id);
  }, [status, seconds]);
  useEffect(() => {
    if (status !== "signing") return;
    const id = window.setInterval(() => setStage((v) => Math.min(v + 1, stages.length)), 950);
    return () => window.clearInterval(id);
  }, [status]);
  useEffect(() => {
    if (status !== "signing" || stage < stages.length) return;
    timer.current = window.setTimeout(() => {
      const id = makeId();
      const data = { id, doc: `CL-${id.slice(3)}`, time: "just now", name: name.trim(), mobile: maskMobile(mobile), email: email.trim(), purpose, amount: PRICE, date: new Date(), hash: Math.random().toString(16).slice(2, 18).toUpperCase() };
      setResult(data);
      setChecks((prev) => [data, ...prev]);
      setBalance((prev) => prev - PRICE);
      setStatus("success");
      setToast("Consent letter signed successfully · ₹30 deducted");
    }, 650);
    return () => window.clearTimeout(timer.current);
  }, [status, stage, name, mobile, email, purpose]);
  useEffect(() => () => { window.clearTimeout(timer.current); window.clearTimeout(toastTimer.current); }, []);
  useEffect(() => { if (status === "otp") otpInput.current?.focus(); }, [status]);
  useEffect(() => {
    if (!toast) return;
    toastTimer.current = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(toastTimer.current);
  }, [toast]);

  const fillSample = () => {
    setName("Pankaj Mishra"); setMobile("9104245545"); setEmail("customer@example.com");
    setPurpose(purposes[0]); setConsent(true); setError("");
  };
  const clearForm = () => {
    if (status === "signing") return;
    setName(""); setMobile(""); setEmail(""); setPurpose(purposes[0]);
    setConsent(false); setOtp(""); setStatus("idle"); setResult(null);
    setStage(0); setSeconds(30); setAttempts(3); setError("");
  };
  const validate = () => {
    if (name.trim().length < 3 || !/^[a-zA-Z][a-zA-Z .'-]*$/.test(name.trim())) return "Enter a valid customer full name.";
    if (!/^[6-9]\d{9}$/.test(mobile)) return "Enter a valid 10-digit Indian mobile number.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
    if (!purpose) return "Select a purpose of verification.";
    if (!consent) return "Customer consent is required before sending the e-Sign OTP.";
    if (balance < PRICE) return "Insufficient demo wallet balance for this request.";
    return "";
  };
  const sendOtp = () => {
    const message = validate();
    if (message) { setError(message); return; }
    setOtp(""); setAttempts(3); setSeconds(30); setStatus("otp"); setError("");
    setToast("Demo OTP sent · use 123456");
  };
  const resendOtp = () => {
    if (seconds > 0) return;
    setSeconds(30); setOtp(""); setAttempts(3); setError(""); setToast("New demo OTP sent · use 123456");
  };
  const sign = () => {
    if (otp.length !== 6) { setError("Enter the complete 6-digit OTP."); return; }
    if (otp !== DEMO_OTP) {
      const remaining = attempts - 1;
      setAttempts(remaining); setError(remaining > 0 ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} left.` : "Too many incorrect attempts. Please resend OTP.");
      if (remaining === 0) setSeconds(0);
      return;
    }
    setError(""); setStage(0); setStatus("signing");
  };
  const copyId = async (id) => {
    try { await navigator.clipboard.writeText(id); setToast("Reference ID copied"); }
    catch { setToast(`Reference ID: ${id}`); }
  };
  const downloadText = (kind, data) => {
    if (!data) return;
    const lines = kind === "letter" ? ["CUSTOMER CONSENT LETTER", "", `Document: ${data.doc}`, `Date: ${formatDate(data.date || new Date())}`, `Customer: ${data.name}`, `Mobile: ${data.mobile || "Masked in demo"}`, `Purpose: ${data.purpose || purposes[0]}`, "", "I voluntarily consent to the stated identity and account verification for the stated purpose.", "", "DEMO E-SIGN ONLY — no legally valid digital signature or certificate was issued.", `Demo reference: ${data.id}`] : ["VERIFYHUB DEMO RECEIPT", "", `Reference: ${data.id}`, `Document: ${data.doc}`, `Customer: ${data.name}`, `Amount charged: INR ${data.amount}`, `Date: ${formatDate(data.date || new Date())}`, "Status: Demo Verified", "", "Synthetic test record. No payment or real signing service was used."];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${kind === "letter" ? "demo-consent-letter" : "demo-receipt"}-${data.id}.txt`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const letterContent = (data = {}) => (
    <div className="space-y-4 text-[13px] leading-7 text-[#26344e] dark:text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e6f0] pb-3"><strong className="tracking-wider text-[#17223d] dark:text-white">CUSTOMER CONSENT LETTER</strong><span className="text-[#8592ab]">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
      <p>To,<br />Shree Ganesh Mobile Point<br />Shop 48, Station Road, Bharuch, Gujarat</p>
      <p><strong>Subject:</strong> Consent for identity and bank account verification</p>
      <p>I, <strong>{data.name || name.trim() || "[Customer full name]"}</strong>, holder of mobile number <strong>{data.mobile || (mobile ? maskMobile(mobile) : "+91 XXXXXXXXXX")}</strong>, give my free and informed consent to Shree Ganesh Mobile Point, acting through the VerifyHub platform, to perform verification for <strong>{data.purpose || purpose}</strong>.</p>
      <p>I understand that this is a demonstration of an electronic consent flow. I confirm that the details provided are accurate and that I voluntarily approve this request.</p>
      <div className="rounded-lg border border-dashed border-[#cbd5e8] bg-white/70 p-3 dark:bg-slate-800"><strong>Signature:</strong> {data.id ? "Demo e-Sign completed" : "Pending customer OTP verification"}<br /><strong>Document ID:</strong> {data.doc || "Generated after signing"}</div>
      <p className="text-[11px] text-[#8190a8]">Demo document only. This is not a legally valid Aadhaar e-Sign certificate or signed PDF.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f6fc] px-4 py-6 font-poppins text-[#101b36] dark:bg-slate-950 dark:text-white sm:px-6 lg:px-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><div className="mb-1 text-[12px] text-[#8995ad]">Retailer <span className="mx-2">›</span> Consent e-Sign</div><h1 className="text-[24px] font-bold sm:text-[27px]">Consent e-Sign</h1><p className="mt-1 text-[13px] text-[#8794ac]">Generate a customer consent letter and simulate OTP-based signing.</p></div>
        <div className="rounded-xl border border-[#dce4f0] bg-white px-4 py-2.5 text-[13px] font-semibold dark:border-slate-700 dark:bg-slate-900"><Wallet className="mr-2 inline text-[#3156ec]" size={17} />₹{balance.toLocaleString("en-IN")} <span className="font-normal text-[#8995ad]">demo wallet</span></div>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className={card}>
          <div className="flex items-center gap-3 border-b border-[#e2e8f2] px-5 py-5 dark:border-slate-700 sm:px-6"><div className="rounded-xl bg-[#e3f7f1] p-3 text-[#0ba68b]"><FileSignature size={23} /></div><div><h2 className="text-[16px] font-bold">Consent Letter with e-Sign</h2><p className="mt-1 text-[12px] text-[#8a96ae]">Demo simulator · synthetic responses only</p></div></div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-3">{[["Charge per request", "₹30"], ["Wallet balance", `₹${balance.toLocaleString("en-IN")}`], ["Today", `${checks.length} checks`]].map(([key, val]) => <div key={key} className="rounded-xl border border-[#e1e6f0] bg-[#f6f8fc] p-3 dark:border-slate-700 dark:bg-slate-800"><p className="text-[11px] font-medium text-[#8a96aa]">{key}</p><p className="mt-1 text-[16px] font-bold">{val}</p></div>)}</div>
            <div><label className={label}>Customer full name <span className="float-right text-red-500">*</span></label><input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" disabled={status !== "idle"} maxLength={70} /></div>
            <div><label className={label}>Customer mobile <span className="float-right text-red-500">*</span></label><div className="flex overflow-hidden rounded-xl border border-[#cdd8e9] focus-within:border-[#3156ec] dark:border-slate-600"><span className="flex items-center border-r border-[#cdd8e9] bg-[#f6f8fc] px-4 text-[13px] font-semibold text-[#52617f] dark:border-slate-600 dark:bg-slate-800">+91</span><input className="min-w-0 flex-1 bg-white px-4 py-3 text-[14px] outline-none dark:bg-slate-800" inputMode="numeric" placeholder="10-digit mobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} disabled={status !== "idle"} /></div><p className="mt-1.5 text-[12px] text-[#8794ac]">The signing link and demo OTP go to this number (simulated).</p></div>
            <div><label className={label}>Customer email <span className="float-right font-normal text-[#8a96ae]">Optional · signed copy</span></label><input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" disabled={status !== "idle"} /></div>
            <div><label className={label}>Purpose of verification <span className="float-right text-red-500">*</span></label><select className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)} disabled={status !== "idle"}>{purposes.map((p) => <option key={p}>{p}</option>)}</select></div>
            <button type="button" onClick={() => setPreview(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#edf1ff] px-4 py-3 text-[13px] font-semibold text-[#3156ec] hover:bg-[#e1e8ff] dark:bg-slate-800"><FileText size={17} />Preview consent letter</button>
            <div className="flex flex-wrap items-center gap-3 text-[12px]"><span className="text-[#8b97af]">Try sample:</span><button type="button" onClick={fillSample} disabled={status !== "idle"} className="inline-flex items-center gap-2 rounded-full border border-[#b9c8fa] bg-[#edf1ff] px-3 py-1.5 font-semibold text-[#3156ec] disabled:opacity-50"><UserRound size={15} />Sample customer</button></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-[#d4deee] bg-[#f8faff] p-4 text-[12px] leading-6 text-[#52617f] dark:border-slate-700 dark:bg-slate-800"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={status !== "idle"} className="mt-1 h-4 w-4 accent-[#3156ec]"/><span>I confirm that the customer has given explicit consent to generate and electronically sign this letter for the stated purpose.</span></label>
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700"><AlertCircle size={17} className="shrink-0" />{error}</div>}
            <div className="flex flex-wrap items-center justify-end gap-3"><button type="button" onClick={clearForm} disabled={status === "signing"} className="px-3 py-2 text-[13px] font-semibold text-[#53627e] disabled:opacity-40">Clear</button><button type="button" onClick={sendOtp} disabled={status !== "idle"} className={primary}><Send size={17} />{status === "idle" ? "Send for e-Sign" : status === "otp" ? "Waiting for OTP" : status === "signing" ? "Signing..." : "Signed"}</button></div>
            <div className="flex items-start gap-3 rounded-xl border border-[#b8e0ed] bg-[#e9f7fd] p-4 text-[12px] leading-6 text-[#294459]"><LockKeyhole size={19} className="mt-0.5 shrink-0 text-[#1397bc]"/><span>Identifiers are masked in history and never stored in full. Use <strong>synthetic test values only</strong>. This demo does not contact UIDAI, a bank, or a government source.</span></div>
          </div>
        </section>
        <div className="space-y-5">
          <section className={card}>
            {status === "idle" && <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[340px]"><div className="mb-5 rounded-full border border-dashed border-[#d6e0f0] p-2"><div className="rounded-full bg-[#eef2f9] p-7 text-[#8b97ac]"><FileSignature size={35}/></div></div><h2 className="text-[18px] font-bold">Signature status</h2><p className="mt-2 max-w-[340px] text-[14px] leading-6 text-[#8995ae]">Submit the details and enter the OTP. The result will appear here.</p></div>}
            {status === "otp" && <div className="p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-[#eaf0ff] p-3 text-[#3156ec]"><Smartphone size={23}/></div><div><h2 className="text-[17px] font-bold">Customer e-Sign</h2><p className="text-[12px] text-[#8995ae]">OTP verification required</p></div></div><div className="max-h-[255px] overflow-y-auto rounded-xl border border-[#e0e7f1] bg-[#f8faff] p-4 dark:border-slate-700 dark:bg-slate-800">{letterContent()}</div><p className="mt-4 text-[13px] leading-6 text-[#596985]">The customer reviews the consent letter and signs with the OTP sent to <strong>{maskMobile(mobile)}</strong>.</p><div className="mt-5 flex flex-wrap items-center justify-between gap-2"><label className={label}>6-digit OTP</label><span className="text-[12px] text-[#8b97ae]">{seconds > 0 ? `Resend in 0:${String(seconds).padStart(2, "0")}` : "Ready to resend"}</span></div><input ref={otpInput} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} inputMode="numeric" autoComplete="one-time-code" placeholder="0 0 0 0 0 0" maxLength={6} className={`${field} text-center font-mono text-[22px] tracking-[0.5em] sm:text-[25px]`} /><p className="mt-2 text-[12px] text-[#8995ae]">Demo OTP: <strong>123456</strong> · {attempts} attempts left</p>{error && <p role="alert" className="mt-3 text-[12px] text-red-600">{error}</p>}<div className="mt-5 flex flex-wrap justify-end gap-2"><button className="px-3 py-2 text-[13px] font-semibold text-[#52617f]" onClick={() => { setStatus("idle"); setOtp(""); setError(""); }}>Cancel</button><button className={secondary} disabled={seconds > 0} onClick={resendOtp}>Resend OTP</button><button className={primary} disabled={otp.length !== 6 || attempts === 0} onClick={sign}><ShieldCheck size={17}/>Sign document</button></div></div>}
            {status === "signing" && <div className="flex min-h-[390px] flex-col items-center justify-center px-5 py-12"><div className="mb-4 rounded-full border-2 border-[#d6e0ff] p-2"><div className="rounded-full bg-[#edf1ff] p-6 text-[#3156ec]"><FileSignature size={36}/></div></div><h2 className="text-[19px] font-bold">Signing...</h2><p className="mt-2 text-[14px] text-[#8b97ae]">Please don't close this page</p><div className="mt-8 w-full max-w-[370px] space-y-5">{stages.map((s, i) => <div key={s} className="flex items-center gap-4"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold ${i < stage ? "border-[#109868] bg-[#109868] text-white" : i === stage ? "border-[#3156ec] text-[#3156ec]" : "border-[#d6deed] text-[#9aa5bb]"}`}>{i < stage ? <Check size={16}/> : i + 1}</span><span className={`text-[13px] ${i === stage ? "font-semibold text-[#17213a] dark:text-white" : i < stage ? "text-[#53627d] dark:text-slate-300" : "text-[#9ba7bc]"}`}>{s}</span></div>)}</div></div>}
            {status === "success" && result && <div className="p-5 sm:p-6"><div className="mb-5 flex items-start gap-3 rounded-xl bg-[#ecfaf2] p-4"><div className="rounded-full bg-[#d8f6e5] p-2 text-[#0d9960]"><CheckCircle2 size={25}/></div><div><h2 className="text-[17px] font-bold text-[#12663f]">Consent letter signed</h2><p className="mt-1 text-[12px] text-[#478466]">Document signed in demo mode · ₹30 charged</p></div></div><div className="max-h-[210px] overflow-y-auto rounded-xl border border-[#e0e7f1] bg-[#f8faff] p-4 dark:border-slate-700 dark:bg-slate-800">{letterContent(result)}</div><div className="mt-4 grid gap-3 rounded-xl border border-[#e1e7f0] p-4 text-[12px] sm:grid-cols-2"><div><p className="text-[#8a96ad]">DOCUMENT HASH</p><p className="mt-1 break-all font-mono font-semibold">{result.hash}</p></div><div><p className="text-[#8a96ad]">STATUS</p><span className="mt-1 inline-flex rounded-full bg-[#e5f8ee] px-2.5 py-1 font-semibold text-[#0c9758]">● Verified (demo)</span></div><div><p className="text-[#8a96ad]">REQUEST / REFERENCE ID</p><p className="mt-1 break-all font-mono font-semibold">{result.id}</p></div><div><p className="text-[#8a96ad]">DATE & TIME</p><p className="mt-1 font-semibold">{formatDate(result.date)}</p></div><div className="sm:col-span-2"><p className="text-[#8a96ad]">PROVIDER RESPONSE</p><p className="mt-1 font-mono">200 · DEMO_SIGNED · Simulated e-Sign</p></div></div><div className="mt-4 rounded-xl border border-[#e0e6f0] bg-[#f6f8fc] p-4 text-[13px] dark:border-slate-700 dark:bg-slate-800"><Wallet className="mr-2 inline text-[#3156ec]" size={17}/>₹30 deducted from demo wallet · new balance <strong>₹{balance.toLocaleString("en-IN")}</strong></div><div className="mt-4 flex flex-wrap justify-end gap-2"><button className={secondary} onClick={() => downloadText("letter", result)}><FileText size={16}/>Signed letter</button><button className={secondary} onClick={() => downloadText("receipt", result)}><Download size={16}/>Receipt</button><button className={secondary} onClick={() => copyId(result.id)}><Copy size={16}/>Copy ID</button><button className={primary} onClick={clearForm}><RotateCcw size={16}/>New verification</button></div></div>}
          </section>
          <section className={card}><div className="flex items-center gap-2 border-b border-[#e2e8f2] px-5 py-4 dark:border-slate-700"><Clock3 size={19} className="text-[#3156ec]"/><h2 className="text-[16px] font-bold">Recent e-Sign checks</h2></div><div className="px-4 py-3 sm:px-5"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a0b7]"/><input className={`${field} py-2.5 pl-10`} placeholder="Search reference or document" value={search} onChange={(e) => setSearch(e.target.value)}/></div></div><div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-[12px]"><thead className="bg-[#f6f8fc] text-[11px] uppercase tracking-wide text-[#8794aa] dark:bg-slate-800"><tr><th className="px-4 py-3 font-semibold">Request</th><th className="px-4 py-3 font-semibold">Document</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Charged</th></tr></thead><tbody>{checks.filter((c) => `${c.id} ${c.doc} ${c.name}`.toLowerCase().includes(search.toLowerCase())).map((c) => <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer border-t border-[#e5eaf2] hover:bg-[#f8faff] dark:border-slate-700 dark:hover:bg-slate-800"><td className="px-4 py-4"><p className="font-mono font-semibold">{c.id}</p><p className="mt-1 text-[#8c99b0]">{c.time}</p></td><td className="px-4 py-4 font-mono">{c.doc}</td><td className="px-4 py-4"><span className="rounded-full bg-[#e6f8ed] px-2.5 py-1 font-semibold text-[#0b985d]">● Verified</span></td><td className="px-4 py-4 text-right font-semibold">₹{c.amount}</td></tr>)}</tbody></table>{checks.filter((c) => `${c.id} ${c.doc} ${c.name}`.toLowerCase().includes(search.toLowerCase())).length === 0 && <p className="p-6 text-center text-[13px] text-[#8c98ae]">No matching records found.</p>}</div></section>
        </div>
      </div>
      <p className="mt-6 text-right text-[11px] text-[#8996ae]">All data is synthetic · INR amounts are illustrative</p>
      {preview && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b1530]/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setPreview(false); }}><div role="dialog" aria-modal="true" aria-label="Consent letter preview" className="w-full max-w-[680px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"><div className="flex items-center justify-between border-b border-[#e2e8f2] px-5 py-4 dark:border-slate-700"><h2 className="font-bold">Preview consent letter</h2><button onClick={() => setPreview(false)} aria-label="Close preview"><X size={20}/></button></div><div className="max-h-[65vh] overflow-y-auto p-5 sm:p-7">{letterContent()}</div><div className="flex justify-end border-t border-[#e2e8f2] p-4 dark:border-slate-700"><button className={primary} onClick={() => setPreview(false)}>Close preview</button></div></div></div>}
      {selected && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b1530]/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><div role="dialog" aria-modal="true" aria-label="e-Sign check details" className="w-full max-w-[460px] rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><h2 className="text-[17px] font-bold">e-Sign check details</h2><button onClick={() => setSelected(null)} aria-label="Close details"><X size={20}/></button></div><div className="space-y-3 text-[13px]"><p><strong>Reference:</strong> {selected.id}</p><p><strong>Document:</strong> {selected.doc}</p><p><strong>Customer:</strong> {selected.name}</p><p><strong>Status:</strong> <span className="text-green-600">Verified (demo)</span></p><p><strong>Charge:</strong> ₹{selected.amount}</p></div><div className="mt-6 flex flex-wrap justify-end gap-2"><button className={secondary} onClick={() => copyId(selected.id)}><Copy size={16}/>Copy ID</button><button className={primary} onClick={() => setSelected(null)}>Close</button></div></div></div>}
      {toast && <div role="status" className="fixed right-4 top-5 z-[10000] max-w-[calc(100vw-2rem)] rounded-xl border border-green-200 bg-white px-4 py-3 text-[13px] font-semibold text-[#147c4f] shadow-lg"><CheckCircle2 size={17} className="mr-2 inline"/>{toast}</div>}
    </div>
  );
}
