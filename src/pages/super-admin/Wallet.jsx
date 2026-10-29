import { useCallback, useEffect, useMemo, useState } from 'react';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, HandCoins, Info, Search, Download, Plus, X, Check, ChevronLeft, ChevronRight, RefreshCw, ShieldCheck, BookOpen, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import api, { getErrorMessage } from '../../api';

// Data: GET /admin/wallet/overview (KPIs, pending requests, balances) · GET /admin/wallet/transactions (paginated ledger)
// Actions: POST /admin/wallet/adjust · PUT /admin/wallet/fund-requests/{id}/approve|reject
const LEDGER_PAGE_SIZE = 10;
const AVATAR_COLORS = ['#b45309', '#be185d', '#7048e8', '#0f766e', '#0284c7', '#059669', '#2954e9', '#4338ca', '#c2410c'];
const colorFor = (id) => AVATAR_COLORS[[...String(id)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const dateLabel = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
const initials = (name) => String(name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const uid = (prefix) => `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const timeAgo = (iso) => { const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000); if (!Number.isFinite(minutes)) return ''; if (minutes < 1) return 'just now'; if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`; };
const toLedgerRow = (t) => ({ id: t.id, retailerId: t.retailer_id, retailerName: t.retailer?.shop || t.retailer_id, type: t.type === 'credit' ? 'Credit' : 'Debit', amount: Number(t.amount) || 0, balance: Number(t.balance_after) || 0, reference: t.ref || '—', remarks: t.note || t.mode || '', date: t.created_at });
const csvCell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
function downloadCSV(rows) { const header = ['Transaction', 'Date', 'Retailer', 'Type', 'Amount (INR)', 'Running balance (INR)', 'Reference', 'Remarks']; const csv = [header, ...rows.map(t => [t.id, dateLabel(t.date), t.retailerName, t.type, t.amount, t.balance, t.reference, t.remarks])].map(r => r.map(csvCell).join(',')).join('\r\n'); const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'verifyhub-wallet-ledger.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
const field = 'w-full rounded-xl border border-app-border bg-app-surface px-3.5 py-3 text-[14px] text-app-text outline-none transition focus:border-[#2954e9] focus:ring-2 focus:ring-blue-500/20';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-[14px] font-semibold text-app-text shadow-sm transition hover:bg-app-surface-muted';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#2954e9] px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d43c5] disabled:opacity-50';

function Panel({ children, className = '' }) { return <section className={`overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-[0_2px_4px_rgba(25,43,79,.06)] ${className}`}>{children}</section>; }

function Modal({ children, onClose, wide = false }) { useEffect(() => { const fn = e => { if (e.key === 'Escape')
    onClose(); }; window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn); }, [onClose]); return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1535]/60 p-3 backdrop-blur-[2px] sm:p-5" onMouseDown={e => { if (e.target === e.currentTarget)
    onClose(); }}><div role="dialog" aria-modal="true" className={`flex max-h-[94vh] w-full flex-col overflow-hidden rounded-[22px] bg-app-surface shadow-2xl ${wide ? 'max-w-[680px]' : 'max-w-[510px]'}`}>{children}</div></div>; }

function Pagination({ page, setPage, total, size = 10 }) { const max = Math.max(1, Math.ceil(total / size)); const pages = max <= 5 ? Array.from({ length: max }, (_, i) => i + 1) : [1, ...(page > 3 ? ['…'] : []), ...(page > 1 && page < max ? [page] : []), ...(page < max - 2 ? ['…'] : []), max].filter((v, i, a) => a.indexOf(v) === i); return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-4 py-3.5 text-[13px] text-app-text-secondary sm:px-5"><span>Showing <b>{total ? ((page - 1) * size + 1) : 0}–{Math.min(page * size, total)}</b> of <b>{total}</b></span><div className="flex items-center gap-1"><button aria-label="Previous page" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className={`${button} !px-2.5 disabled:opacity-40`}><ChevronLeft size={17}/></button>{pages.map((p, i) => typeof p === 'number' ? <button key={i} onClick={() => setPage(p)} className={`min-w-9 rounded-lg px-2.5 py-2 font-semibold ${p === page ? 'bg-[#2954e9] text-white' : 'border border-app-border bg-app-surface text-app-text-secondary'}`}>{p}</button> : <span key={i} className="px-1">…</span>)}<button aria-label="Next page" disabled={page === max} onClick={() => setPage(p => Math.min(max, p + 1))} className={`${button} !px-2.5 disabled:opacity-40`}><ChevronRight size={17}/></button></div></div>; }

export default function Wallet() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [ledger, setLedger] = useState({ rows: [], total: 0 });
    const [ledgerLoading, setLedgerLoading] = useState(true);
    const [ledgerError, setLedgerError] = useState('');
    const [ledgerVersion, setLedgerVersion] = useState(0);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [balanceSearch, setBalanceSearch] = useState('');
    const [ledgerSearch, setLedgerSearch] = useState('');
    const [ledgerQuery, setLedgerQuery] = useState('');
    const [ledgerRetailer, setLedgerRetailer] = useState('all');
    const [ledgerType, setLedgerType] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [balancePage, setBalancePage] = useState(1);
    const [ledgerPage, setLedgerPage] = useState(1);
    const [modal, setModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [adjust, setAdjust] = useState({ retailerId: '', type: 'Credit', amount: '', mode: 'NEFT', reference: uid('VHCR'), remarks: '' });
    const [adjustError, setAdjustError] = useState('');

    const loadOverview = useCallback(() => api.get('/admin/wallet/overview')
        .then(({ data }) => { setOverview(data?.data ?? null); setLoadError(''); })
        .catch(err => setLoadError(getErrorMessage(err, 'Unable to load wallet data.')))
        .finally(() => setLoading(false)), []);
    useEffect(() => { loadOverview(); }, [loadOverview]);

    // Debounce the ledger search so the API is not called on every keystroke.
    useEffect(() => { const t = setTimeout(() => { setLedgerQuery(ledgerSearch.trim()); setLedgerPage(1); }, 400); return () => clearTimeout(t); }, [ledgerSearch]);

    const ledgerParams = useMemo(() => ({ retailer_id: ledgerRetailer, type: ledgerType === 'all' ? 'all' : ledgerType.toLowerCase(), search: ledgerQuery || undefined, start_date: startDate || undefined, end_date: endDate || undefined }), [ledgerRetailer, ledgerType, ledgerQuery, startDate, endDate]);
    useEffect(() => {
        let active = true;
        api.get('/admin/wallet/transactions', { params: { ...ledgerParams, page: ledgerPage, per_page: LEDGER_PAGE_SIZE } })
            .then(({ data }) => { if (!active) return; setLedger({ rows: (data?.data?.data ?? []).map(toLedgerRow), total: Number(data?.data?.total) || 0 }); setLedgerError(''); })
            .catch(err => { if (active) setLedgerError(getErrorMessage(err, 'Unable to load the wallet ledger.')); })
            .finally(() => { if (active) setLedgerLoading(false); });
        return () => { active = false; };
    }, [ledgerParams, ledgerPage, ledgerVersion]);

    const refreshAll = () => { loadOverview(); setLedgerVersion(v => v + 1); };
    const retry = () => { setLoading(true); setLoadError(''); refreshAll(); };
    const notify = (message, error = false) => { setToast({ message, error }); window.setTimeout(() => setToast(null), 4000); };
    const setLedgerFilter = (setter) => (value) => { setter(value); setLedgerPage(1); };

    const kpis = overview?.kpis;
    const retailers = useMemo(() => (overview?.retailers ?? []).map(r => ({ id: r.id, name: r.shop, balance: Number(r.balance) || 0, active: r.status === 'active', color: colorFor(r.id) })), [overview]);
    const pending = useMemo(() => (overview?.pending_requests ?? []).map(r => ({ id: r.id, retailerId: r.retailer_id, retailerName: r.retailer?.shop || r.retailer_id, amount: Number(r.amount) || 0, mode: r.mode, utr: r.utr, remarks: r.remarks || '—', age: timeAgo(r.created_at) })), [overview]);
    const getRetailer = id => retailers.find(r => r.id === id);
    const filteredBalances = useMemo(() => retailers.filter(r => (r.name + ' ' + r.id).toLowerCase().includes(balanceSearch.toLowerCase())).sort((a, b) => a.balance - b.balance), [retailers, balanceSearch]);

    const openAdjust = (type = 'Credit', retailerId = retailers[0]?.id ?? '') => { setAdjust({ retailerId, type, amount: '', mode: 'NEFT', reference: uid(type === 'Credit' ? 'VHCR' : 'VHDB'), remarks: '' }); setAdjustError(''); setModal({ kind: 'adjust' }); };
    const saveAdjustment = () => { const amount = Number(adjust.amount); const r = getRetailer(adjust.retailerId); if (!r) {
        setAdjustError('Select a retailer.');
        return;
    } if (!Number.isFinite(amount) || amount < 1) {
        setAdjustError('Enter an amount of at least ₹1.');
        return;
    } if (adjust.type === 'Debit' && amount > r.balance) {
        setAdjustError('Debit amount cannot exceed available balance.');
        return;
    } if (!adjust.reference.trim()) {
        setAdjustError('Transaction reference is required.');
        return;
    } setAdjustError(''); setModal({ kind: 'adjustReview' }); };
    const confirmAdjustment = async () => {
        if (saving) return;
        const amount = Number(adjust.amount);
        setSaving(true);
        try {
            const { data } = await api.post('/admin/wallet/adjust', { retailer_id: adjust.retailerId, type: adjust.type.toLowerCase(), amount, mode: adjust.mode, ref: adjust.reference.trim(), note: adjust.remarks.trim() || undefined });
            setModal(null); setBalancePage(1); setLedgerPage(1);
            notify(`${adjust.type} of ${money(amount)} applied. New balance: ${money(data?.data?.wallet?.balance)}.`);
            refreshAll();
        } catch (err) {
            setAdjustError(getErrorMessage(err, 'Wallet adjustment failed. Please try again.'));
            setModal({ kind: 'adjust' });
        } finally {
            setSaving(false);
        }
    };
    const requestAction = (request, action) => setModal({ kind: 'request', request, action });
    const confirmRequest = async () => {
        if (saving) return;
        const { request, action } = modal;
        setSaving(true);
        try {
            const { data } = await api.put(`/admin/wallet/fund-requests/${request.id}/${action === 'Approve' ? 'approve' : 'reject'}`);
            notify(data?.message || `Fund request ${action.toLowerCase()}d.`);
        } catch (err) {
            notify(getErrorMessage(err, `Unable to ${action.toLowerCase()} the fund request.`), true);
        } finally {
            setSaving(false); setModal(null);
            // Refresh even on failure: the request may already have been handled elsewhere.
            refreshAll();
        }
    };
    const exportLedger = async () => {
        if (exporting) return;
        if (!ledger.total) return notify('No transactions to export for these filters.', true);
        setExporting(true);
        try {
            const { data } = await api.get('/admin/wallet/transactions', { params: { ...ledgerParams, page: 1, per_page: Math.min(ledger.total, 5000) } });
            downloadCSV((data?.data?.data ?? []).map(toLedgerRow));
        } catch (err) {
            notify(getErrorMessage(err, 'Unable to export the ledger.'), true);
        } finally {
            setExporting(false);
        }
    };
    const cardData = [{ label: 'Total wallet float', value: kpis ? money(kpis.total_float) : '—', sub: kpis ? `across ${kpis.retailer_count} ${kpis.retailer_count === 1 ? 'retailer' : 'retailers'}` : '', icon: WalletIcon, iconColor: '#2954e9', bg: '#eef2ff' }, { label: 'Credits this month', value: kpis ? money(kpis.monthly_credits) : '—', sub: kpis ? `${kpis.monthly_credit_count} top-ups & credits` : '', icon: ArrowDownLeft, iconColor: '#07935b', bg: '#e6f7ee' }, { label: 'Debits this month', value: kpis ? money(kpis.monthly_debits) : '—', sub: kpis ? `${kpis.monthly_debit_count} verification charges & adjustments` : '', icon: ArrowUpRight, iconColor: '#ef3b45', bg: '#ffedf0' }, { label: 'Pending fund requests', value: kpis ? String(kpis.pending_requests_count) : '—', sub: kpis ? `${money(kpis.pending_requests_amount)} awaiting approval` : '', icon: HandCoins, iconColor: '#d88900', bg: '#fff3df' }];
    return <div className="min-w-0 bg-app-background text-app-text">
    <main className="mx-auto w-full max-w-[1900px] space-y-5 px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-[24px] font-bold tracking-tight sm:text-[28px]">Wallet management</h1><p className="mt-1 text-[14px] text-app-text-secondary sm:text-[16px]">Prepaid balances, top-up requests and the complete credit/debit ledger.</p></div><div className="flex flex-wrap gap-2"><button className={button} disabled={!retailers.length} onClick={() => openAdjust('Debit')}><ArrowUpRight size={18}/>Deduct balance</button><button className={primary} disabled={!retailers.length} onClick={() => openAdjust('Credit')}><Plus size={18}/>Add balance</button></div></div>
      {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700"><span>{loadError}</span><button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-100"><RefreshCw size={15}/>Retry</button></div>}
      <div className="flex items-start gap-3 rounded-xl border border-app-border bg-app-surface-muted px-4 py-4 text-[13px] sm:text-[14px]"><Info size={20} className="shrink-0 text-[#0284c7]"/><p><b>Manual top-ups.</b> Credits and debits update retailer wallets immediately and are recorded in the ledger. No payment gateway is connected — verify each fund request against your bank/UPI statement before approving.</p></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cardData.map(c => <Panel key={c.label} className="p-5"><div className="flex items-start justify-between gap-3"><span className="text-[14px] text-app-text-secondary">{c.label}</span><span className="rounded-xl p-3" style={{ background: c.bg, color: c.iconColor }}><c.icon size={21}/></span></div><div className="mt-3 text-[27px] font-bold tracking-tight sm:text-[31px]">{c.value}</div><p className="mt-2 text-[13px] text-app-text-muted">{c.sub}</p></Panel>)}</div>
      <Panel><div className="border-b border-app-border px-5 py-5"><h2 className="flex items-center gap-2 text-[17px] font-bold"><HandCoins size={21} className="text-[#2954e9]"/>Fund requests awaiting approval</h2><p className="mt-1 text-[13px] text-app-text-muted">Raised by retailers from their dashboard</p></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-[13px]"><thead className="bg-app-surface-muted text-[12px] font-bold uppercase text-app-text-muted"><tr>{['Request', 'Retailer', 'Amount', 'Mode / UTR', 'Remarks', ''].map((h, i) => <th key={i} className="px-4 py-4">{h}</th>)}</tr></thead><tbody>{pending.length ? pending.map(r => <tr key={r.id} className="border-t border-app-border"><td className="px-4 py-4"><div className="font-mono font-semibold">{r.id}</div><div className="mt-1 text-app-text-muted">{r.age}</div></td><td className="px-4 py-4 font-semibold">{r.retailerName}</td><td className="px-4 py-4 font-bold">{money(r.amount)}</td><td className="px-4 py-4">{r.mode}<div className="mt-1 font-mono text-app-text-muted">{r.utr}</div></td><td className="px-4 py-4 text-app-text-secondary">{r.remarks}</td><td className="px-4 py-4"><div className="flex justify-end gap-2"><button onClick={() => requestAction(r, 'Reject')} className={`${button} !px-3 !py-2`}>Reject</button><button onClick={() => requestAction(r, 'Approve')} className="inline-flex items-center gap-2 rounded-lg bg-[#10935c] px-3 py-2 font-semibold text-white hover:bg-[#08774a]"><Check size={16}/>Approve</button></div></td></tr>) : <tr><td colSpan={6} className="px-5 py-10 text-center text-app-text-muted">{loading ? 'Loading fund requests...' : 'No pending fund requests.'}</td></tr>}</tbody></table></div></Panel>
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Panel className="min-w-0"><div className="border-b border-app-border px-5 py-5"><h2 className="flex items-center gap-2 text-[17px] font-bold"><Users size={20} className="text-[#2954e9]"/>Retailer balances</h2><p className="mt-1 text-[13px] text-app-text-muted">Lowest balance first</p></div><div className="border-b border-app-border p-4 sm:p-5"><div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted"/><input className={`${field} pl-10`} value={balanceSearch} onChange={e => { setBalanceSearch(e.target.value); setBalancePage(1); }} placeholder="Search retailer"/></div></div><div className="overflow-x-auto"><table className="w-full min-w-[390px] text-left text-[13px]"><thead className="bg-app-surface-muted text-[12px] uppercase text-app-text-muted"><tr><th className="px-4 py-3">Retailer</th><th className="px-4 py-3 text-right">Balance</th><th className="w-12"/></tr></thead><tbody>{filteredBalances.slice((balancePage - 1) * 8, balancePage * 8).map(r => <tr key={r.id} className="border-t border-app-border"><td className="px-4 py-3.5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold text-white" style={{ background: r.color }}>{initials(r.name)}</span><div className="min-w-0"><p className="font-semibold">{r.name}</p><p className="mt-0.5 text-app-text-muted">{r.id} · {r.active ? 'Active' : 'Inactive'}</p></div></div></td><td className="px-4 py-3.5 text-right font-bold">{money(r.balance)}</td><td className="px-2"><button aria-label={`Adjust wallet for ${r.name}`} title="Adjust wallet" onClick={() => openAdjust('Credit', r.id)} className="rounded-lg p-2 text-app-text-secondary hover:bg-brand-primary-light"><Plus size={18} className="rounded-full border border-current"/></button></td></tr>)}{filteredBalances.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-app-text-muted">{loading ? 'Loading balances...' : 'No retailers found.'}</td></tr>}</tbody></table></div><Pagination page={balancePage} setPage={setBalancePage} total={filteredBalances.length} size={8}/></Panel>
        <Panel className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-5 py-5"><div><h2 className="flex items-center gap-2 text-[17px] font-bold"><BookOpen size={20} className="text-[#2954e9]"/>Wallet ledger</h2><p className="mt-1 text-[13px] text-app-text-muted">Every credit and debit with running balance</p></div><button className={button} disabled={exporting} onClick={exportLedger}><Download size={17}/>{exporting ? 'Exporting...' : 'Export'}</button></div><div className="grid grid-cols-1 gap-3 border-b border-app-border p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3"><div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted"/><input className={`${field} pl-10`} placeholder="Reference, Txn ID or remark" value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)}/></div><select className={field} value={ledgerRetailer} onChange={e => setLedgerFilter(setLedgerRetailer)(e.target.value)}><option value="all">All retailers</option>{retailers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><select className={field} value={ledgerType} onChange={e => setLedgerFilter(setLedgerType)(e.target.value)}><option value="all">Credit & debit</option><option value="Credit">Credit only</option><option value="Debit">Debit only</option></select><div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3"><input aria-label="From date" type="date" className={`${field} min-w-0 flex-1`} value={startDate} onChange={e => setLedgerFilter(setStartDate)(e.target.value)}/><span className="text-app-text-muted">–</span><input aria-label="To date" type="date" className={`${field} min-w-0 flex-1`} value={endDate} onChange={e => setLedgerFilter(setEndDate)(e.target.value)}/>{(startDate || endDate) && <button title="Clear dates" onClick={() => { setStartDate(''); setEndDate(''); setLedgerPage(1); }} className="p-2 text-app-text-secondary"><X size={17}/></button>}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-[13px]"><thead className="bg-app-surface-muted text-[12px] uppercase text-app-text-muted"><tr>{['Transaction', 'Retailer', 'Type', 'Amount', 'Balance', 'Reference'].map(h => <th key={h} className="px-4 py-4">{h}</th>)}</tr></thead><tbody>{ledger.rows.map(t => <tr key={t.id} className="border-t border-app-border"><td className="px-4 py-4"><p className="font-mono font-semibold">{t.id}</p><p className="mt-1 text-[12px] text-app-text-muted">{dateLabel(t.date)}</p></td><td className="px-4 py-4">{t.retailerName}</td><td className="whitespace-nowrap px-4 py-4"><span className={`inline-flex w-max shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-semibold leading-5 ${t.type === 'Credit' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'}`}><span className="shrink-0 text-[10px]">●</span><span>{t.type}</span></span></td><td className={`px-4 py-4 font-semibold ${t.type === 'Credit' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{t.type === 'Credit' ? '+' : '−'}{money(t.amount)}</td><td className="px-4 py-4">{money(t.balance)}</td><td className="px-4 py-4"><p className="font-mono font-semibold">{t.reference}</p><p className="mt-1 max-w-[220px] truncate text-[12px] text-app-text-muted" title={t.remarks}>Wallet · {t.remarks}</p></td></tr>)}{ledger.rows.length === 0 && <tr><td colSpan={6} className={`p-10 text-center ${ledgerError ? 'text-red-600 dark:text-red-400' : 'text-app-text-muted'}`}>{ledgerError || (ledgerLoading ? 'Loading ledger...' : 'No transactions match your filters.')}</td></tr>}</tbody></table></div><Pagination page={ledgerPage} setPage={setLedgerPage} total={ledger.total} size={LEDGER_PAGE_SIZE}/></Panel>
      </div>
    </main>
    {modal?.kind === 'adjust' && <Modal onClose={() => setModal(null)} wide><div className="flex items-start justify-between gap-4 border-b border-app-border p-5 sm:p-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#edf2ff] p-3 text-[#2954e9]"><WalletIcon size={23}/></span><div><h2 className="text-[20px] font-bold">Wallet adjustment</h2><p className="mt-1 text-[13px] text-app-text-secondary">Credit or debit a retailer wallet. The balance updates immediately.</p></div></div><button aria-label="Close" onClick={() => setModal(null)}><X size={20}/></button></div><div className="space-y-4 overflow-y-auto p-5 sm:p-6"><label className="block text-[13px] font-semibold">Retailer <span className="text-red-500">*</span><select className={`${field} mt-2`} value={adjust.retailerId} onChange={e => setAdjust(a => ({ ...a, retailerId: e.target.value }))}>{retailers.map(r => <option key={r.id} value={r.id}>{r.name} · {r.id}</option>)}</select>{getRetailer(adjust.retailerId) && <span className="mt-1 block text-[12px] font-normal text-app-text-muted">Current balance: {money(getRetailer(adjust.retailerId).balance)}</span>}</label><div className="grid grid-cols-2 rounded-xl bg-app-surface-muted p-1"><button onClick={() => setAdjust(a => ({ ...a, type: 'Credit', reference: uid('VHCR') }))} className={`rounded-lg px-2 py-3 text-[13px] font-semibold ${adjust.type === 'Credit' ? 'bg-app-surface text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-app-text-secondary'}`}>↙ Add balance (Credit)</button><button onClick={() => setAdjust(a => ({ ...a, type: 'Debit', reference: uid('VHDB') }))} className={`rounded-lg px-2 py-3 text-[13px] font-semibold ${adjust.type === 'Debit' ? 'bg-app-surface text-rose-700 dark:text-rose-400 shadow-sm' : 'text-app-text-secondary'}`}>↗ Deduct (Debit)</button></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="text-[13px] font-semibold">Amount <span className="text-red-500">*</span><div className="mt-2 flex items-center rounded-xl border border-app-border"><span className="border-r border-app-border px-4 py-3">₹</span><input type="number" min="1" step="0.01" placeholder="0" value={adjust.amount} onChange={e => setAdjust(a => ({ ...a, amount: e.target.value }))} className="w-full min-w-0 bg-transparent px-3 py-3 outline-none"/></div></label><label className="text-[13px] font-semibold">Payment mode<select className={`${field} mt-2`} value={adjust.mode} onChange={e => setAdjust(a => ({ ...a, mode: e.target.value }))}>{['NEFT', 'UPI', 'IMPS', 'RTGS', 'Cash', 'Other'].map(v => <option key={v}>{v}</option>)}</select></label></div><div className="flex flex-wrap gap-2">{[500, 1000, 2000, 5000, 10000].map(v => <button key={v} onClick={() => setAdjust(a => ({ ...a, amount: String(v) }))} className="rounded-full border border-app-border px-3 py-1.5 text-[13px] font-semibold text-app-text-secondary hover:bg-app-surface-muted">{money(v)}</button>)}</div><label className="block text-[13px] font-semibold">Transaction reference number <span className="text-red-500">*</span><div className="mt-2 flex gap-2"><input className={field} value={adjust.reference} onChange={e => setAdjust(a => ({ ...a, reference: e.target.value }))}/><button title="Generate reference" onClick={() => setAdjust(a => ({ ...a, reference: uid(a.type === 'Credit' ? 'VHCR' : 'VHDB') }))} className={button}><RefreshCw size={18}/></button></div></label><label className="block text-[13px] font-semibold">Remarks <span className="font-normal text-app-text-muted">Optional</span><textarea rows={3} className={`${field} mt-2 resize-y`} placeholder="e.g. Top-up against bank transfer" value={adjust.remarks} onChange={e => setAdjust(a => ({ ...a, remarks: e.target.value }))}/></label>{adjustError && <p className="rounded-lg bg-red-500/10 p-3 text-[13px] text-red-600 dark:text-red-400">{adjustError}</p>}</div><div className="flex justify-end gap-2 border-t border-app-border bg-app-surface-muted p-4 sm:px-6"><button className={button} onClick={() => setModal(null)}>Cancel</button><button className={primary} onClick={saveAdjustment}><ShieldCheck size={17}/>Review & confirm</button></div></Modal>}
    {modal?.kind === 'adjustReview' && <Modal onClose={() => !saving && setModal({ kind: 'adjust' })}><div className="flex justify-between border-b border-app-border p-5"><h2 className="text-[19px] font-bold">Confirm wallet {adjust.type.toLowerCase()}?</h2><button disabled={saving} onClick={() => setModal({ kind: 'adjust' })}><X size={19}/></button></div><div className="space-y-3 p-5 text-[14px]"><p>Review this wallet adjustment. The retailer's balance will update immediately.</p><div className="space-y-2 rounded-xl bg-app-surface-muted p-4"><p><b>Retailer:</b> {getRetailer(adjust.retailerId)?.name}</p><p><b>Type:</b> {adjust.type}</p><p><b>Amount:</b> {money(adjust.amount)}</p><p><b>Current balance:</b> {money(getRetailer(adjust.retailerId)?.balance)}</p><p><b>New balance:</b> {money(getRetailer(adjust.retailerId)?.balance + (adjust.type === 'Credit' ? 1 : -1) * Number(adjust.amount))}</p><p><b>Reference:</b> {adjust.reference}</p></div></div><div className="flex justify-end gap-2 border-t border-app-border bg-app-surface-muted p-4"><button className={button} disabled={saving} onClick={() => setModal({ kind: 'adjust' })}>Back</button><button className={primary} disabled={saving} onClick={confirmAdjustment}><Check size={17}/>{saving ? 'Saving...' : 'Confirm & save'}</button></div></Modal>}
    {modal?.kind === 'request' && <Modal onClose={() => !saving && setModal(null)}><div className="flex justify-between border-b border-app-border p-5"><h2 className="text-[19px] font-bold">{modal.action} fund request?</h2><button disabled={saving} onClick={() => setModal(null)}><X size={19}/></button></div><div className="space-y-3 p-5 text-[14px]"><p>{modal.action === 'Approve' ? "This will credit the requested amount to the retailer's wallet. Make sure the payment has reached your account." : 'This request will be marked as rejected without changing the wallet balance.'}</p><div className="rounded-xl bg-app-surface-muted p-4"><p className="font-semibold">{modal.request.retailerName}</p><p className="mt-2 text-[22px] font-bold">{money(modal.request.amount)}</p><p className="mt-2 font-mono text-[12px] text-app-text-secondary">{modal.request.id} · UTR {modal.request.utr}</p></div></div><div className="flex justify-end gap-2 border-t border-app-border bg-app-surface-muted p-4"><button className={button} disabled={saving} onClick={() => setModal(null)}>Cancel</button><button disabled={saving} onClick={confirmRequest} className={`${modal.action === 'Approve' ? 'rounded-xl bg-[#10935c] px-4 py-2.5 font-semibold text-white' : 'rounded-xl bg-[#e43a45] px-4 py-2.5 font-semibold text-white'} disabled:opacity-60`}>{saving ? 'Saving...' : `Confirm ${modal.action.toLowerCase()}`}</button></div></Modal>}
    {toast && <div role="status" className={`fixed bottom-5 right-5 z-[110] flex max-w-[calc(100vw-40px)] items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-xl ${toast.error ? 'bg-[#8f1d2a]' : 'bg-[#132a53]'}`}>{toast.error ? <AlertCircle size={18} className="text-red-200"/> : <CheckCircle2 size={18} className="text-emerald-300"/>}{toast.message}</div>}
  </div>;
}
