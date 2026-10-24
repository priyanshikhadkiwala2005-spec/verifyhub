import { useEffect, useRef, useState } from "react";

import { Fingerprint, CreditCard, Landmark, FileSignature, Check, ShieldCheck, Wallet, ArrowRight, RotateCcw, Sparkles, Send, Copy, Download, CheckCircle2, X, Smartphone, AlertCircle } from "lucide-react";



// Frontend-only KYC demonstration. Never enter real Aadhaar, PAN, bank or OTP details.

const steps = [

  { name: "Aadhaar OTP", price: 20, icon: Fingerprint, title: "Aadhaar Verification (OTP)" },

  { name: "PAN", price: 10, icon: CreditCard, title: "PAN Card Verification" },

  { name: "Bank penny drop", price: 15, icon: Landmark, title: "Bank Account Verification (Penny Drop)" },

  { name: "Consent e-Sign", price: 30, icon: FileSignature, title: "Consent Letter with e-Sign" },

];

const initial = { aadhaar: "", mobile: "", consent: false, pan: "", account: "", ifsc: "", otp: "", signOtp: "", email: "", purpose: "KYC verification for account opening" };

const formatAadhaar = (value) => value.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})(?=\d)/g, "$1 ");

const fmt = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

const uid = () => `KYC${Date.now().toString(36).toUpperCase()}`;

const box = "rounded-2xl border border-app-border bg-app-surface shadow-[0_1px_3px_rgba(15,23,42,0.05)]";

const input = "mt-2 w-full rounded-lg border border-app-border bg-app-surface px-3.5 py-3 text-[13px] text-app-text outline-none transition placeholder:text-app-text-muted focus:border-[#3157ee] focus:ring-2 focus:ring-[#3157ee]/15";

const primary = "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2e52e9] px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#2044d7] disabled:cursor-not-allowed disabled:opacity-50";

const secondary = "inline-flex items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 py-2.5 text-[13px] font-semibold text-app-text transition hover:bg-app-surface-muted";

function Label({ children, required, hint }) { return <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-app-text-secondary"><span>{children}</span><span className={required ? "text-red-500" : "text-app-text-muted"}>{required ? "*" : hint}</span></div>; }

function Cell({ label, value }) { return <div className="min-w-0 border-b border-r border-app-border p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-app-text-muted">{label}</p><p className="mt-1 break-words text-[12px] font-semibold text-app-text">{value}</p></div>; }



export default function CompleteKYC() {

  const [step, setStep] = useState(0);

  const [form, setForm] = useState(initial);

  const [kycId, setKycId] = useState(uid);

  const [wallet, setWallet] = useState(() => Number(localStorage.getItem("verifyhub-retailer-wallet") ?? 3495));

  const [result, setResult] = useState(null);

  const [otpStage, setOtpStage] = useState(false);

  const [signStage, setSignStage] = useState(false);

  const [busy, setBusy] = useState(false);

  const [verificationPhase, setVerificationPhase] = useState(-1);

  const [verificationType, setVerificationType] = useState(null);

  const verificationTimers = useRef([]);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  const [completed, setCompleted] = useState([]);

  const [seconds, setSeconds] = useState(30);

  const [tries, setTries] = useState(3);

  const [signTries, setSignTries] = useState(3);

  const [confirmRestart, setConfirmRestart] = useState(false);

  const [consentExpanded, setConsentExpanded] = useState(false);
  const [showKycSummary, setShowKycSummary] = useState(false);

  const update = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setError(""); };

  useEffect(() => { if ((!otpStage && !signStage) || seconds <= 0) return; const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); return () => window.clearInterval(id); }, [otpStage, signStage, seconds]);

  useEffect(() => { if (!notice) return; const id = window.setTimeout(() => setNotice(""), 4500); return () => window.clearTimeout(id); }, [notice]);

  useEffect(() => () => verificationTimers.current.forEach(clearTimeout), []);

  const startVerification = (type, finish) => {

    verificationTimers.current.forEach(clearTimeout);

    verificationTimers.current = [];

    setBusy(true);

    setError("");

    setVerificationType(type);

    setVerificationPhase(0);

    const count = type === "bank" ? 4 : 3;

    for (let i = 1; i < count; i++) {

      verificationTimers.current.push(window.setTimeout(() => setVerificationPhase(i), i * 1150));

    }

    verificationTimers.current.push(window.setTimeout(() => {

      finish();

      setVerificationPhase(-1);

      setVerificationType(null);

      setBusy(false);

      verificationTimers.current = [];

    }, count * 1150 + 400));

  };

  const charge = (amount, label, reference) => {

    const next = wallet - amount;

    setWallet(next);

    localStorage.setItem("verifyhub-retailer-wallet", String(next));

    window.dispatchEvent(new CustomEvent("verifyhub-retailer-wallet-updated", { detail: { balance: next } }));

    const history = JSON.parse(localStorage.getItem("verifyhub-retailer-kyc-history") || "[]");

    localStorage.setItem("verifyhub-retailer-kyc-history", JSON.stringify([{ id: reference, kycId, service: label, amount, status: "Verified", date: new Date().toISOString() }, ...history].slice(0, 100)));

    setNotice(`${label} verified · ${fmt(amount)} deducted (demo)`);

  };

  const enough = (price) => { if (wallet < price) { setError(`Insufficient demo wallet balance. You need ${fmt(price)}.`); return false; } return true; };

  const verifyAadhaar = () => {

    if (!/^\d{12}$/.test(form.aadhaar)) return setError("Enter a 12-digit demo Aadhaar number.");

    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError("Enter a valid 10-digit demo mobile number.");

    if (!form.consent) return setError("Customer consent is required before verification.");

    if (!enough(20)) return;

    setOtpStage(true); setSeconds(30); setTries(3); setError("");

  };

  const verifyOtp = () => {

    if (busy) return;

    if (form.otp !== "123456") { setTries((v) => Math.max(0, v - 1)); setError("Incorrect demo OTP. Use 123456."); return; }

    setOtpStage(false);

    startVerification("aadhaar", () => {

      const reference = `VRF${Date.now().toString().slice(-10)}`;

      setResult({ reference, fields: [["Masked Aadhaar", `XXXX XXXX ${form.aadhaar.slice(-4)}`], ["Name as per Aadhaar", "ROHIT AGARWAL"], ["Gender", "Male"], ["Year of birth", "1982"], ["State", "Jammu and Kashmir"], ["Mobile linked", `Yes · XXXXXX${form.mobile.slice(-2)}`], ["Status", "Verified (demo)"], ["Request / Reference ID", reference], ["Date & time", new Date().toLocaleString("en-IN")], ["Provider response", "SIMULATED · OTP authenticated"]] });

      setCompleted((a) => [...new Set([...a, 0])]); charge(20, "Aadhaar OTP", reference);

      setForm((f) => ({ ...f, otp: "" }));

    });

  };

  const verifyPan = () => {

    if (busy) return;

    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(form.pan)) return setError("Enter a valid PAN format: ABCDE1234F.");

    if (!enough(10)) return;

    startVerification("pan", () => {

      const reference = `PAN${Date.now().toString().slice(-10)}`;

      setResult({ reference, fields: [["PAN", `${form.pan.slice(0, 2)}XXXX${form.pan.slice(-2)}`], ["Name on PAN", "ROHIT AGARWAL"], ["Name match", "Matched (demo)"], ["PAN status", "Active (demo)"], ["Aadhaar seeding", "Linked (demo)"], ["Request ID", reference], ["Status", "Verified (demo)"], ["Provider response", "SIMULATED · VERIFIED"]] });

      setCompleted((a) => [...new Set([...a, 1])]); charge(10, "PAN", reference);

    });

  };

  const verifyBank = () => {

    if (busy) return;

    if (!/^\d{9,18}$/.test(form.account)) return setError("Enter a bank account number of 9–18 digits.");

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc)) return setError("Enter a valid IFSC, e.g. HDFC0001234.");

    if (!enough(15)) return;

    startVerification("bank", () => {

      const reference = `BNK${Date.now().toString().slice(-10)}`;

      setResult({ reference, fields: [["Account number", `XXXXXX${form.account.slice(-4)}`], ["IFSC", form.ifsc], ["Beneficiary", "ROHIT AGARWAL"], ["Name match", "Matched (demo)"], ["Penny drop", "₹1 simulated transfer"], ["Status", "Verified (demo)"], ["Request ID", reference], ["Provider response", "SIMULATED · VERIFIED"]] });

      setCompleted((a) => [...new Set([...a, 2])]); charge(15, "Bank penny drop", reference);

    });

  };

  const sendSignOtp = () => {

    if (!form.purpose) return setError("Select a verification purpose.");

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Enter a valid email or leave it blank.");

    if (!enough(30)) return;

    setSignStage(true); setSignTries(3); setSeconds(30); setError("");

  };

  const verifySignOtp = () => {

    if (busy) return;

    if (form.signOtp !== "123456") { setSignTries((v) => Math.max(0, v - 1)); setError("Incorrect demo e-Sign OTP. Use 123456."); return; }

    setSignStage(false);

    startVerification("sign", () => {

      const reference = `ESG${Date.now().toString().slice(-10)}`;

      setResult({ reference, fields: [["Document", "Customer Consent Letter"], ["Signed by", "ROHIT AGARWAL"], ["Mobile", `XXXXXX${form.mobile.slice(-4)}`], ["Email", form.email || "Not provided"], ["Purpose", form.purpose], ["Signature method", "Aadhaar OTP e-Sign (demo sandbox)"], ["Certificate", "Demo ESP CA 2026 · SHA-256"], ["Document hash", `DEMO${reference.slice(-10)}`], ["Signed on", new Date().toLocaleString("en-IN")], ["Status", "Signed (demo)"], ["Request / Reference ID", reference], ["Provider response", "200 · SIGNED · Document e-signed (simulated)"]] });

      setCompleted((a) => [...new Set([...a, 3])]); charge(30, "Consent e-Sign", reference);

      setForm((f) => ({ ...f, signOtp: "" }));

    });

  };

  const next = () => { if (!completed.includes(step)) return; if (step < 3) { setStep((s) => s + 1); setResult(null); setError(""); setOtpStage(false); setSignStage(false); } };

  const restart = () => { setStep(0); setForm(initial); setKycId(uid()); setResult(null); setCompleted([]); setOtpStage(false); setSignStage(false); setTries(3); setSignTries(3); setError(""); setConfirmRestart(false); setConsentExpanded(false); setShowKycSummary(false); setVerificationPhase(-1); setVerificationType(null); verificationTimers.current.forEach(clearTimeout); verificationTimers.current = []; setBusy(false); };

  const receipt = () => {

    if (!result) return;

    const text = [`VERIFYHUB DEMO RECEIPT`, `KYC ID: ${kycId}`, `Service: ${steps[step].title}`, `Reference: ${result.reference}`, `Charge: ${fmt(steps[step].price)}`, `Status: Verified (simulated)`, ...result.fields.map(([k,v]) => `${k}: ${v}`), "No live KYC or payment service was contacted."].join("\n");

    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = `verifyhub-${result.reference}.txt`; a.click(); URL.revokeObjectURL(a.href);

  };

  const downloadSignedLetter = () => {
    if (!result || step !== 3) return;
    const lines = [
      "VERIFYHUB — DEMO CUSTOMER CONSENT LETTER", "", "To: Shree Ganesh Mobile Point",
      "Subject: Consent for identity and bank account verification", "",
      `Signer: ROHIT AGARWAL`, `Mobile: +91 XXXXXX${form.mobile.slice(-4)}`,
      `Purpose: ${form.purpose}`, `KYC ID: ${kycId}`,
      `e-Sign reference: ${result.reference}`, `Signed on: ${new Date().toLocaleString("en-IN")}`,
      "", "Status: Signed (demo only)",
      "This is a simulated consent letter. No legal electronic signature or live KYC check was performed."
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `verifyhub-signed-letter-${result.reference}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const completedSummaryFields = [
    ["Customer", "ROHIT AGARWAL"], ["Mobile", `91XXXXXX${form.mobile.slice(-4)}`],
    ["Aadhaar", `XXXX XXXX ${form.aadhaar.slice(-4)}`],
    ["PAN", `${form.pan.slice(0, 2)}XXXX${form.pan.slice(-2)}`],
    ["Bank account", `XXXXXX${form.account.slice(-4)}`], ["Bank / IFSC", form.ifsc],
    ["Signer", "ROHIT AGARWAL"], ["Signer mobile", `91XXXXXX${form.mobile.slice(-4)}`],
    ["Purpose", form.purpose], ["Sign method", "Aadhaar OTP e-Sign (demo sandbox)"],
    ["Certificate", "Demo ESP CA 2026 · SHA-256"],
    ["Request / Reference ID", result?.reference || "—"],
    ["Date & time", new Date().toLocaleString("en-IN")],
    ["Status", "KYC verified (demo)"],
  ];

  const copyId = () => { navigator.clipboard?.writeText(result?.reference || kycId).then(() => setNotice("Reference ID copied"), () => setNotice("Copy unavailable in this browser")); };

  const Icon = steps[step].icon;

  const verified = completed.includes(step);

  return <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-7">

    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-[23px] font-bold text-app-text">Complete KYC</h1><p className="mt-1 text-[13px] text-app-text-secondary">Verify one customer end to end: Aadhaar, PAN, bank account and a signed consent letter.</p></div><button className={secondary} onClick={() => setConfirmRestart(true)}><RotateCcw size={16}/> Start new KYC</button></div>

    <div className={`${box} mb-5 overflow-hidden`}><div className="grid grid-cols-2 gap-3 px-4 py-5 md:grid-cols-4 md:gap-5 md:px-6">{steps.map((s,i) => <div key={s.name} className="flex min-w-0 items-center gap-2.5"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-bold ${completed.includes(i) ? "border-emerald-500 bg-emerald-500 text-white" : i === step ? "border-[#3157ee] bg-app-surface text-[#3157ee] ring-4 ring-[#3157ee]/10" : "border-app-border text-app-text-muted"}`}>{completed.includes(i) ? <Check size={17}/> : i+1}</div><div className="min-w-0"><p className={`truncate text-[12px] font-semibold ${i===step ? "text-app-text" : "text-app-text-secondary"}`}>{s.name}</p><p className="text-[11px] text-app-text-muted">{fmt(s.price)}</p></div>{i<3 && <div className={`ml-2 hidden h-[2px] flex-1 lg:block ${completed.includes(i) ? "bg-emerald-500" : "bg-app-border"}`}/>}</div>)}</div><div className="flex flex-wrap items-center justify-between gap-2 border-t border-app-border px-4 py-3 text-[12px] text-app-text-secondary md:px-6"><span>KYC ID <strong className="text-app-text">{kycId}</strong></span><span>Total for 4 checks <strong className="text-app-text">₹75</strong> · Wallet <strong className="text-app-text">{fmt(wallet)}</strong></span></div></div>

    {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-medium text-emerald-800"><CheckCircle2 size={17}/>{notice}</div>}

    <div className="grid items-start gap-5 xl:grid-cols-2"><section className={`${box} overflow-hidden`}><div className="flex items-center gap-3 border-b border-app-border px-5 py-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef1ff] text-[#3157ee]"><Icon size={21}/></div><div className="flex-1"><p className="text-[11px] text-app-text-muted">Step {step+1} of 4</p><h2 className="text-[14px] font-bold text-app-text">{steps[step].title}</h2></div><strong className="text-[13px] text-app-text">{fmt(steps[step].price)}</strong></div>

        {showKycSummary && step === 3 ? (
          <div className="flex min-h-[310px] flex-col items-center justify-center px-5 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={30}/></div>
            <h3 className="mt-4 text-[16px] font-bold text-app-text">All four checks completed</h3>
            <p className="mt-2 max-w-[280px] text-[12px] leading-5 text-app-text-secondary">The KYC summary is on the right. Start a new KYC for the next customer.</p>
            <button className={`${primary} mt-5`} onClick={() => setConfirmRestart(true)}><RotateCcw size={16}/> Start new KYC</button>
          </div>
        ) : <div className="space-y-5 p-5">

        {step===0 && <><div><Label required>Aadhaar number</Label><input className={input} placeholder="0000 0000 0000" inputMode="numeric" maxLength={14} value={formatAadhaar(form.aadhaar)} disabled={otpStage || verified || verificationPhase >= 0} onChange={e=>update("aadhaar",e.target.value.replace(/\D/g,""))}/><p className="mt-1 text-[11px] text-app-text-muted">12 digits. Only the last 4 digits appear in results.</p></div><div><Label required>Customer mobile</Label><div className="flex items-center"><span className="mt-2 rounded-l-lg border border-r-0 border-app-border bg-app-surface-muted px-3 py-3 text-[13px] text-app-text-secondary">+91</span><input className={`${input} rounded-l-none`} placeholder="10-digit demo mobile" inputMode="numeric" maxLength={10} value={form.mobile} disabled={otpStage || verified || verificationPhase >= 0} onChange={e=>update("mobile",e.target.value.replace(/\D/g,""))}/></div><p className="mt-1 text-[11px] text-app-text-muted">Used for the consent letter in step 4.</p></div><div className="flex items-center gap-2"><span className="text-[11px] text-app-text-muted">Demo:</span><button className={`${secondary} !rounded-full !px-3 !py-1.5 !text-[11px]`} disabled={otpStage || verified || verificationPhase >= 0} onClick={()=>{setForm(f=>({...f,aadhaar:"234567890009",mobile:"9104245545",consent:true}));setError("");}}><Sparkles size={13}/> Fill sample data</button></div><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-dashed border-app-border bg-app-surface-muted p-3 text-[12px] leading-5 text-app-text-secondary"><input type="checkbox" className="mt-1 accent-[#3157ee]" checked={form.consent} disabled={otpStage || verified || verificationPhase >= 0} onChange={e=>update("consent",e.target.checked)}/><span>The customer has given explicit <strong>consent</strong> to verify their Aadhaar (OTP), PAN and bank account (₹1 penny drop), and will e-sign a consent letter recording it.</span></label></>}

        {step===1 && <><div><Label required>PAN number</Label><input className={`${input} uppercase`} placeholder="e.g. ABCDE1234F" maxLength={10} value={form.pan} disabled={verified || busy} onChange={e=>update("pan",e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}/><p className="mt-1 text-[11px] text-app-text-muted">10 characters: 5 letters, 4 digits, 1 letter</p></div><div><Label hint="From Aadhaar">Name for match</Label><input className={`${input} bg-app-surface-muted`} readOnly value="ROHIT AGARWAL"/></div><div className="flex items-center gap-2"><span className="text-[11px] text-app-text-muted">Demo:</span><button className={`${secondary} !rounded-full !px-3 !py-1.5 !text-[11px]`} disabled={verified || busy} onClick={()=>update("pan","ABCPR1234L")}><Sparkles size={13}/> Fill sample data</button></div><p className="text-[11px] text-app-text-muted"><ShieldCheck size={13} className="mr-1 inline"/> Covered by the consent captured in step 1.</p></>}

        {step===2 && <><div><Label required>Bank account number</Label><input className={input} placeholder="9–18 digits" inputMode="numeric" maxLength={18} value={form.account} disabled={verified || busy} onChange={e=>update("account",e.target.value.replace(/\D/g,""))}/></div><div><Label required>IFSC code</Label><input className={`${input} uppercase`} placeholder="e.g. HDFC0001234" maxLength={11} value={form.ifsc} disabled={verified || busy} onChange={e=>update("ifsc",e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}/><p className="mt-1 text-[11px] text-app-text-muted">11 characters: 4 letters, 0, 6 letters or digits</p></div><div><Label hint="From Aadhaar">Beneficiary name for match</Label><input className={`${input} bg-app-surface-muted`} readOnly value="ROHIT AGARWAL"/></div><div className="flex items-center gap-2"><span className="text-[11px] text-app-text-muted">Demo:</span><button className={`${secondary} !rounded-full !px-3 !py-1.5 !text-[11px]`} disabled={verified || busy} onClick={()=>{setForm(f=>({...f,account:"1234567890",ifsc:"HDFC0001234"}));setError("");}}><Sparkles size={13}/> Fill sample data</button></div><p className="text-[11px] text-app-text-muted"><ShieldCheck size={13} className="mr-1 inline"/> Covered by the consent captured in step 1.</p></>}

        {step===3 && <>

          <div><Label hint="From Aadhaar">Signer name</Label><input className={`${input} bg-app-surface-muted`} readOnly value="ROHIT AGARWAL" /></div>

          <div><Label hint="From step 1">Signer mobile</Label><div className="flex items-center"><span className="mt-2 rounded-l-lg border border-r-0 border-app-border bg-app-surface-muted px-3 py-3 text-[13px] text-app-text-secondary">+91</span><input className={`${input} rounded-l-none bg-app-surface-muted`} readOnly value={form.mobile}/></div></div>

          <div><Label hint="Optional · signed copy">Customer email</Label><input type="email" className={input} placeholder="customer@example.com" value={form.email} disabled={signStage || verified || busy} onChange={e=>update("email", e.target.value)} /></div>

          <div><Label required>Purpose of verification</Label><select className={input} value={form.purpose} disabled={signStage || verified || busy} onChange={e=>update("purpose", e.target.value)}><option>KYC verification for account opening</option><option>Customer identity verification</option><option>Bank account verification</option><option>Customer onboarding</option></select></div>

          <button type="button" className={`${secondary} w-full`} onClick={()=>setConsentExpanded(v=>!v)}><FileSignature size={16}/>{consentExpanded ? "Hide consent letter" : "Preview consent letter"}</button>

          {consentExpanded && <div className="rounded-xl border border-app-border bg-app-surface-muted p-4 text-[12px] leading-6 text-app-text-secondary"><strong className="text-app-text">CUSTOMER CONSENT LETTER</strong><p className="mt-2">To, Shree Ganesh Mobile Point</p><p><strong>Subject:</strong> Consent for identity and bank account verification</p><p className="mt-2">I, ROHIT AGARWAL, holder of mobile number +91 XXXXXX{form.mobile.slice(-4)}, consent to a demonstration of Aadhaar OTP, PAN and bank account verification for {form.purpose.toLowerCase()}.</p><p className="mt-2">This is a simulated document. No legal electronic signature is created.</p></div>}

          <div className="flex items-center gap-2"><span className="text-[11px] text-app-text-muted">Demo:</span><button className={`${secondary} !rounded-full !px-3 !py-1.5 !text-[11px]`} disabled={signStage || verified || busy} onClick={()=>{setForm(f=>({...f,email:"customer@example.com",purpose:"KYC verification for account opening"}));setError("");}}><Sparkles size={13}/> Fill sample data</button></div>

          <p className="text-[11px] text-app-text-muted"><ShieldCheck size={13} className="mr-1 inline"/> Covered by the consent captured in step 1.</p>

        </>}

        {error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-[12px] text-red-700"><AlertCircle size={16}/>{error}</p>}

        <div className="flex justify-end">{step===0 ? <button className={primary} disabled={otpStage || verified || busy} onClick={verifyAadhaar}><Send size={16}/> {otpStage ? "Waiting for OTP..." : "Send Aadhaar OTP"}</button> : step===1 ? <button className={primary} disabled={verified || busy} onClick={verifyPan}><ShieldCheck size={16}/>{busy ? "Verifying..." : "Verify PAN"}</button> : step===2 ? <button className={primary} disabled={verified || busy} onClick={verifyBank}><ShieldCheck size={16}/>{busy ? "Verifying..." : "Run ₹1 penny drop"}</button> : <button className={primary} disabled={verified || signStage || busy} onClick={sendSignOtp}><Send size={16}/>{signStage ? "Waiting for e-Sign OTP..." : "Send e-Sign OTP"}</button>}</div>

      </div>}</section>

      <section className={`${box} min-h-[310px] overflow-hidden`}>{showKycSummary && step === 3 && verified && result ? <div className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white"><CheckCircle2 size={24}/></div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[16px] font-bold text-app-text">KYC completed</h3><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">● KYC verified</span></div><p className="mt-1 text-[11px] text-app-text-secondary">ROHIT AGARWAL · {kycId} · {new Date().toLocaleString("en-IN")}</p></div>
          </div>
          <div className="p-5"><div className="grid grid-cols-2 overflow-hidden rounded-xl border border-app-border">{completedSummaryFields.map(([k,v]) => <Cell key={k} label={k} value={v}/>)}</div>
            <div className="mt-4 rounded-lg border border-app-border bg-app-surface-muted px-4 py-3 text-[12px] text-app-text-secondary">All four checks completed in this demo · Total charges <strong className="text-app-text">₹75</strong> · Wallet <strong className="text-app-text">{fmt(wallet)}</strong></div>
            <div className="mt-5 flex flex-wrap justify-end gap-2"><button className={secondary} onClick={downloadSignedLetter}><Download size={15}/> Signed letter</button><button className={secondary} onClick={receipt}><Download size={15}/> Receipt</button><button className={secondary} onClick={copyId}><Copy size={15}/> Copy ID</button><button className={primary} onClick={() => setConfirmRestart(true)}><RotateCcw size={16}/> Start new KYC</button></div>
          </div>
        </div> : verificationPhase >= 0 ? <div className="flex min-h-[505px] flex-col items-center justify-center px-5 py-10 sm:px-8"><div className="relative flex h-[136px] w-[136px] items-center justify-center"><div className="absolute inset-0 animate-pulse rounded-full border-[3px] border-[#dfe6ff]"/><div className="absolute inset-[10px] rounded-full border-2 border-[#dfe6ff]"/><div className="flex h-[96px] w-[96px] items-center justify-center rounded-full border-2 border-[#8ba5ff] bg-[#eef2ff] text-[#2e52e9] shadow-[0_0_0_5px_#f7f9ff]">{verificationType === "aadhaar" ? <Fingerprint size={42} strokeWidth={1.7} className="animate-pulse"/> : verificationType === "pan" ? <CreditCard size={42} strokeWidth={1.7} className="animate-pulse"/> : verificationType === "bank" ? <Landmark size={42} strokeWidth={1.7} className="animate-pulse"/> : <FileSignature size={42} strokeWidth={1.7} className="animate-pulse"/>}</div></div><h3 className="mt-3 text-[19px] font-bold text-app-text">{verificationType === "sign" ? "Signing..." : "Verifying..."}</h3><p className="mt-1 text-center text-[14px] text-app-text-muted">Please don't close this page</p><div className="mt-8 w-full max-w-[380px] space-y-6">{(verificationType === "aadhaar" ? ["Validating Aadhaar and consent", "Authenticating with UIDAI partner (sandbox)", "Fetching e-KYC details and masking"] : verificationType === "pan" ? ["Validating input and consent", "Querying income-tax source (sandbox)", "Matching and masking response"] : verificationType === "bank" ? ["Validating account and IFSC", "Sending ₹1 via IMPS (penny drop)", "Reading beneficiary name from bank", "Matching name and masking"] : ["Generating consent letter PDF", "Applying Aadhaar OTP e-Sign (sandbox ESP)", "Embedding certificate and timestamp"]).map((label,index)=><div key={label} className="flex items-center gap-4"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-semibold ${index < verificationPhase ? "border-emerald-500 bg-emerald-500 text-white" : index === verificationPhase ? "border-[#3157ee] text-[#3157ee]" : "border-app-border text-app-text-muted"}`}>{index < verificationPhase ? <Check size={17}/> : index + 1}</span><span className={`text-[13px] leading-5 sm:text-[14px] ${index === verificationPhase ? "font-semibold text-app-text" : "text-app-text-secondary"}`}>{label}</span></div>)}</div><p className="mt-8 text-center text-[11px] text-app-text-muted">Simulated {verificationType === "sign" ? "signing" : "verification"} · no live provider request is sent</p></div> : (otpStage || signStage) && !verified ? <div className="p-5">{signStage && <div className="mb-5 max-h-[280px] overflow-y-auto rounded-xl border border-app-border bg-app-surface-muted p-5 text-[12px] leading-6 text-app-text-secondary"><div className="flex flex-wrap justify-between gap-2 border-b border-app-border pb-3 font-bold tracking-wide text-app-text"><span>CUSTOMER CONSENT LETTER</span><span className="font-normal text-app-text-muted">{new Date().toLocaleDateString("en-GB")}</span></div><p className="mt-3">To,<br/>Shree Ganesh Mobile Point<br/>Bharuch, Gujarat</p><p className="mt-3"><strong className="text-app-text">Subject:</strong> Consent for identity and bank account verification</p><p className="mt-3">I, <strong className="text-app-text">ROHIT AGARWAL</strong>, holder of mobile number +91 XXXXXX{form.mobile.slice(-4)}, give my free and informed consent to verify my Aadhaar, PAN and bank account for <strong className="text-app-text">{form.purpose}</strong>.</p><p className="mt-3">This is a demo letter; no live verification or legally binding e-Sign occurs.</p></div>}<div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef1ff] text-[#3157ee]"><Smartphone size={19}/></div><div><h3 className="text-[14px] font-bold text-app-text">{signStage ? "Enter e-Sign OTP" : "Enter Aadhaar OTP"}</h3><p className="mt-1 text-[12px] leading-5 text-app-text-secondary">A 6-digit demo OTP was sent to the mobile ending in {form.mobile.slice(-4)}. Ask the customer for consent before continuing.</p></div></div><div className="mt-5 flex items-center justify-between"><Label required>6-digit OTP</Label><span className="text-[11px] text-app-text-muted">{seconds ? `Resend in 0:${String(seconds).padStart(2,"0")}` : "Resend available"}</span></div><input className={`${input} max-w-[270px] text-center font-mono text-[21px] tracking-[0.35em]`} placeholder="000000" inputMode="numeric" maxLength={6} value={signStage ? form.signOtp : form.otp} onChange={e=>update(signStage ? "signOtp" : "otp",e.target.value.replace(/\D/g,""))}/><p className="mt-2 text-[11px] text-app-text-muted">Demo OTP: <strong>123456</strong> · {signStage ? signTries : tries} attempts left</p>{error && <p className="mt-3 text-[12px] text-red-600">{error}</p>}<div className="mt-6 flex flex-wrap justify-end gap-2"><button className={secondary} onClick={()=>{setOtpStage(false);setSignStage(false);setError("");}}>Cancel</button><button className={secondary} disabled={seconds>0} onClick={()=>{setSeconds(30);setError("");setForm(f=>({...f,otp:"",signOtp:""}));}}>Resend OTP</button><button className={primary} disabled={busy || (signStage ? signTries : tries)<=0 || (signStage ? form.signOtp : form.otp).length!==6} onClick={signStage ? verifySignOtp : verifyOtp}><ShieldCheck size={16}/>{busy ? "Verifying..." : "Verify OTP"}</button></div></div> : verified && result ? <div className="p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle2 size={21}/></div><div><h3 className="text-[15px] font-bold text-app-text">{step===3 ? "Consent letter signed" : `${steps[step].name} verified`}</h3><p className="text-[12px] text-app-text-secondary">Successful demo verification</p></div></div><div className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg border border-app-border">{result.fields.map(([k,v])=><Cell key={k} label={k} value={v}/>)}</div><div className="mt-4 flex items-center gap-2 rounded-lg border border-app-border bg-app-surface-muted px-3 py-3 text-[12px] text-app-text-secondary"><Wallet size={17} className="text-[#3157ee]"/>{fmt(steps[step].price)} deducted from demo wallet · new balance <strong className="text-app-text">{fmt(wallet)}</strong></div><div className="mt-4 flex flex-wrap justify-end gap-2">{step === 3 && <button className={secondary} onClick={downloadSignedLetter}><FileSignature size={15}/> Signed letter</button>}<button className={secondary} onClick={receipt}><Download size={15}/> Receipt</button><button className={secondary} onClick={copyId}><Copy size={15}/> Copy ID</button></div><div className="mt-4 flex justify-end">{step<3 ? <button className={primary} onClick={next}>Continue to step {step+2}: {steps[step+1].name} <ArrowRight size={16}/></button> : <button className={primary} onClick={() => setShowKycSummary(true)}><CheckCircle2 size={16}/> View KYC summary</button>}</div></div> : <div className="flex min-h-[310px] flex-col items-center justify-center px-6 py-10 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-app-surface-muted text-app-text-muted"><Icon size={31}/></div><h3 className="mt-4 text-[14px] font-bold text-app-text">Verification result</h3><p className="mt-2 max-w-[260px] text-[12px] leading-5 text-app-text-muted">Submit the details. The simulated response will appear here.</p></div>}</section></div>

    <p className="mt-5 text-[11px] leading-5 text-app-text-muted">Demo prototype: no live UIDAI, PAN, bank, OTP or e-Sign APIs are connected. Sample data and verification results are synthetic. Charges affect only the local demo wallet.</p>

    {confirmRestart && <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#101827]/60 px-4" onMouseDown={e=>{if(e.target===e.currentTarget)setConfirmRestart(false);}}><div role="dialog" aria-modal="true" className="w-full max-w-[430px] rounded-2xl bg-app-surface p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-[17px] font-bold text-app-text">Start a new KYC?</h3><button onClick={()=>setConfirmRestart(false)} aria-label="Close"><X size={19}/></button></div><p className="mt-3 text-[13px] leading-6 text-app-text-secondary">This clears the current form and starts a new demo KYC. Completed demo charges will not be refunded.</p><div className="mt-6 flex justify-end gap-2"><button className={secondary} onClick={()=>setConfirmRestart(false)}>Cancel</button><button className={primary} onClick={restart}>Start new KYC</button></div></div></div>}

  </div>;

}
