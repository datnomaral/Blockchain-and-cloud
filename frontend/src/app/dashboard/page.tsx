'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaHome, FaFileContract, FaUsers, FaMoneyBillWave, FaPlus,
    FaChartLine, FaExclamationTriangle, FaCheckCircle,
    FaSearch, FaEye, FaBell, FaArrowUp, FaArrowDown,
    FaSignOutAlt, FaChevronRight,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtDate = (d: any) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—';

type Tab = 'overview' | 'customers' | 'properties' | 'contracts';

const CONTRACT_STATUS: Record<string, { label: string; cls: string }> = {
    DRAFT:      { label: 'Nháp',          cls: 'bg-slate-100 text-slate-600' },
    PENDING:    { label: 'Chờ ký',        cls: 'bg-amber-100 text-amber-700' },
    ACTIVE:     { label: 'Hiệu lực',      cls: 'bg-emerald-100 text-emerald-700' },
    SIGNED:     { label: 'Đã ký',         cls: 'bg-blue-100 text-blue-700' },
    EXPIRED:    { label: 'Hết hạn',       cls: 'bg-red-100 text-red-700' },
    TERMINATED: { label: 'Đã hủy',        cls: 'bg-gray-100 text-gray-600' },
};
const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
    UNPAID:  { label: 'Chưa thu', cls: 'bg-amber-100 text-amber-700' },
    PAID:    { label: 'Đã thu',   cls: 'bg-emerald-100 text-emerald-700' },
    OVERDUE: { label: 'Quá hạn', cls: 'bg-red-100 text-red-700' },
};
const APPROVAL_STATUS: Record<string, { label: string; cls: string }> = {
    PENDING:  { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
    APPROVED: { label: 'Đã duyệt',  cls: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { label: 'Từ chối',   cls: 'bg-red-100 text-red-700' },
};

const monthsLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24 * 30)));
};

export default function LandlordDashboard() {
    const router = useRouter();
    const [user, setUser]       = useState<any>(null);
    const [tab, setTab]         = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [invoiceView, setInvoiceView] = useState<'month' | 'overdue'>('month');

    const [properties, setProperties] = useState<any[]>([]);
    const [contracts, setContracts]   = useState<any[]>([]);
    const [invoices, setInvoices]     = useState<any[]>([]);

    const [propSearch, setPropSearch]         = useState('');
    const [contractSearch, setContractSearch] = useState('');
    const [contractFilter, setContractFilter] = useState('ALL');
    const [customerSearch, setCustomerSearch] = useState('');

    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();

    const activeContracts   = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'SIGNED');
    const expiringContracts = contracts.filter(c =>
        (c.status === 'ACTIVE' || c.status === 'SIGNED') && monthsLeft(c.endDate) <= 1
    );

    const monthlyInvoices = invoices.filter(i => i.month === currentMonth && i.year === currentYear);
    const totalExpected   = monthlyInvoices.reduce((s, i) => s + i.amount, 0);
    const totalCollected  = monthlyInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
    const totalDebt       = monthlyInvoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0);
    const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');
    const totalOverdue    = overdueInvoices.reduce((s, i) => s + i.amount, 0);

    const tenants = Object.values(
        activeContracts.reduce((acc: any, c) => {
            if (c.tenant?.id && !acc[c.tenant.id]) {
                acc[c.tenant.id] = {
                    ...c.tenant,
                    propertyTitle: c.property?.title,
                    contractId:    c.id,
                    contractEnd:   c.endDate,
                    monthlyRent:   c.monthlyRent,
                    hasDebt: invoices.some(
                        i => i.contract?.tenantId === c.tenant?.id && i.status !== 'PAID'
                    ),
                };
            }
            return acc;
        }, {} as Record<string, any>)
    );

    const loadAll = useCallback(async () => {
        const token    = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) { router.push('/auth/login'); return; }
        const u = JSON.parse(userData);
        if (u.role !== 'LANDLORD' && u.role !== 'ADMIN') {
            router.push('/dashboard-tenant'); return;
        }
        setUser(u);
        setLoading(true);
        try {
            const [pR, cR, iR] = await Promise.all([
                fetch(`${API}/api/properties/my`,  { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/api/contracts`,        { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/api/invoices?landlordId=${u.id}&limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const [pD, cD, iD] = await Promise.all([pR.json(), cR.json(), iR.json()]);
            if (pD.success) setProperties(pD.data.properties);
            if (cD.success) setContracts(cD.data.contracts.filter((c: any) => c.landlordId === u.id));
            if (iD.success) setInvoices(iD.data.invoices);
        } catch { toast.error('Lỗi khi tải dữ liệu'); }
        finally    { setLoading(false); }
    }, [router]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!user || loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-400 text-sm">Đang tải...</p>
            </div>
        </div>
    );

    /* ── derived filtered lists ─────────────────────── */
    const filteredProps = properties.filter(p =>
        `${p.title} ${p.district} ${p.city}`.toLowerCase().includes(propSearch.toLowerCase())
    );
    const filteredContracts = contracts
        .filter(c => contractFilter === 'ALL' || c.status === contractFilter)
        .filter(c =>
            `${c.property?.title} ${c.tenant?.fullName}`.toLowerCase().includes(contractSearch.toLowerCase())
        );
    const filteredTenants = (tenants as any[]).filter(t =>
        `${t.fullName} ${t.phone || ''} ${t.email || ''}`.toLowerCase().includes(customerSearch.toLowerCase())
    );

    /* ── sidebar nav items ──────────────────────────── */
    const NAV: { id: Tab; label: string; icon: any; count?: number; danger?: boolean }[] = [
        { id: 'overview',   label: 'Tổng quan',   icon: FaChartLine  },
        { id: 'customers',  label: 'Khách hàng',  icon: FaUsers,        count: tenants.length },
        { id: 'properties', label: 'Bài đăng',    icon: FaHome,         count: properties.length },
        { id: 'contracts',  label: 'Hợp đồng',    icon: FaFileContract, count: activeContracts.length },
    ];

    /* ── stat cards data ────────────────────────────── */
    const STATS = [
        {
            label: 'Phòng đang thuê',
            value: `${activeContracts.length}`,
            sub: `/ ${properties.length} phòng`,
            icon: FaHome,
            gradient: 'from-blue-500 to-cyan-400',
            textColor: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: 'Khách đang thuê',
            value: `${tenants.length}`,
            sub: 'người',
            icon: FaUsers,
            gradient: 'from-violet-500 to-purple-400',
            textColor: 'text-violet-600',
            bg: 'bg-violet-50',
        },
        {
            label: `Thu tháng ${currentMonth}`,
            value: fmt(totalCollected),
            sub: totalExpected > 0 ? `${Math.round(totalCollected / totalExpected * 100)}% kế hoạch` : '—',
            icon: FaArrowUp,
            gradient: 'from-emerald-500 to-teal-400',
            textColor: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            label: 'Dư nợ tháng này',
            value: fmt(totalDebt),
            sub: `${monthlyInvoices.filter(i => i.status !== 'PAID').length} hóa đơn`,
            icon: FaArrowDown,
            gradient: totalDebt > 0 ? 'from-red-500 to-rose-400' : 'from-slate-400 to-slate-300',
            textColor: totalDebt > 0 ? 'text-red-600' : 'text-slate-500',
            bg: totalDebt > 0 ? 'bg-red-50' : 'bg-slate-50',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex gap-6">

                    {/* ══════════════════════════════════════
                        SIDEBAR
                    ══════════════════════════════════════ */}
                    <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-3">

                        {/* Profile card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl mb-3 shadow-lg shadow-violet-200">
                                    {user.fullName?.[0]?.toUpperCase()}
                                </div>
                                <p className="font-bold text-sm leading-tight">{user.fullName}</p>
                                <span className="mt-1.5 px-2.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                    Chủ nhà
                                </span>
                            </div>
                        </div>

                        {/* Nav items */}
                        <nav className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            {NAV.map((item, i) => {
                                const active = tab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setTab(item.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all ${
                                            i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''
                                        } ${
                                            active
                                                ? 'bg-violet-600 text-white'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={active ? 'text-white/80' : 'text-slate-400'} />
                                            {item.label}
                                        </div>
                                        {item.count !== undefined && item.count > 0 && (
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                                                active ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                            }`}>
                                                {item.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Quick links */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            {[
                                { href: '/properties/create', icon: '🏠', label: 'Đăng tin mới' },
                                { href: '/contracts/create',  icon: '📝', label: 'Tạo hợp đồng' },
                                { href: '/invoices',          icon: '💸', label: 'Thu chi' },
                            ].map((item, i) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                        i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span>{item.icon}</span>
                                        {item.label}
                                    </div>
                                    <FaChevronRight className="text-slate-300 text-xs" />
                                </Link>
                            ))}
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm"
                        >
                            <FaSignOutAlt /> Đăng xuất
                        </button>
                    </aside>

                    {/* ══════════════════════════════════════
                        MAIN CONTENT
                    ══════════════════════════════════════ */}
                    <main className="flex-1 min-w-0">

                        {/* Mobile tab bar */}
                        <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                            {NAV.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setTab(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                                        tab === item.id
                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                                            : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    <item.icon className="text-xs" />
                                    {item.label}
                                    {item.count !== undefined && item.count > 0 && (
                                        <span className={`text-[10px] font-black px-1.5 rounded-full ${
                                            tab === item.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>{item.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">

                            {/* ======================================
                                TỔNG QUAN
                            ====================================== */}
                            {tab === 'overview' && (
                                <motion.div key="overview"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                    className="space-y-5"
                                >
                                    {/* Page title */}
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Tổng quan</h1>
                                        <p className="text-sm text-slate-400 mt-0.5">Tháng {currentMonth}/{currentYear}</p>
                                    </div>

                                    {/* Alerts */}
                                    {(expiringContracts.length > 0 || overdueInvoices.length > 0) && (
                                        <div className="space-y-2">
                                            {expiringContracts.length > 0 && (
                                                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                    <FaExclamationTriangle className="text-amber-500 shrink-0 text-sm" />
                                                    <p className="text-sm text-amber-700 flex-1">
                                                        <span className="font-bold">{expiringContracts.length} hợp đồng</span> sắp hết hạn trong 30 ngày.
                                                    </p>
                                                    <button onClick={() => { setTab('contracts'); setContractFilter('ACTIVE'); }}
                                                        className="text-xs text-amber-600 font-bold hover:underline shrink-0">Xem →</button>
                                                </div>
                                            )}
                                            {overdueInvoices.length > 0 && (
                                                <button
                                                    onClick={() => setInvoiceView('overdue')}
                                                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors group"
                                                >
                                                    <FaBell className="text-red-500 shrink-0 text-sm" />
                                                    <p className="text-sm text-red-700 flex-1 text-left">
                                                        <span className="font-bold">{overdueInvoices.length} hóa đơn quá hạn</span> — tổng{' '}
                                                        <span className="font-bold">{fmt(totalOverdue)}</span>
                                                    </p>
                                                    <span className="text-xs text-red-600 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">Xem →</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                                        {STATS.map((s, i) => (
                                            <motion.div key={i}
                                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.07 }}
                                                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm"
                                            >
                                                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
                                                    <s.icon className={`${s.textColor} text-base`} />
                                                </div>
                                                <p className="text-xs text-slate-400 font-semibold mb-1">{s.label}</p>
                                                <p className={`text-xl font-black ${s.textColor} leading-tight`}>{s.value}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Invoice panel */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                        {/* Panel header */}
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <FaMoneyBillWave className={invoiceView === 'overdue' ? 'text-red-500' : 'text-emerald-500'} />
                                                <h2 className="font-bold text-sm">
                                                    {invoiceView === 'month'
                                                        ? `Hóa đơn tháng ${currentMonth}/${currentYear}`
                                                        : `Hóa đơn quá hạn (${overdueInvoices.length})`}
                                                </h2>
                                            </div>
                                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
                                                {(['month', 'overdue'] as const).map(v => (
                                                    <button key={v} onClick={() => setInvoiceView(v)}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                                            invoiceView === v
                                                                ? v === 'overdue'
                                                                    ? 'bg-red-500 text-white shadow-sm'
                                                                    : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                                                                : 'text-slate-500 hover:text-slate-700'
                                                        }`}
                                                    >
                                                        {v === 'month' ? 'Tháng này' : 'Quá hạn'}
                                                        {v === 'overdue' && overdueInvoices.length > 0 && (
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                                                invoiceView === 'overdue' ? 'bg-white/30 text-white' : 'bg-red-100 text-red-600'
                                                            }`}>{overdueInvoices.length}</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Panel body — Tháng này */}
                                        {invoiceView === 'month' && (
                                            monthlyInvoices.length === 0 ? (
                                                <div className="py-12 text-center text-slate-300">
                                                    <FaMoneyBillWave className="mx-auto text-3xl mb-2" />
                                                    <p className="text-sm">Chưa có hóa đơn tháng {currentMonth}</p>
                                                </div>
                                            ) : (<>
                                                <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                                                    {monthlyInvoices.map(inv => {
                                                        const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.UNPAID;
                                                        return (
                                                            <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-semibold text-sm truncate">{inv.contract?.property?.title}</p>
                                                                    <p className="text-xs text-slate-400 mt-0.5">{inv.contract?.tenant?.fullName} · Hạn: {fmtDate(inv.dueDate)}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3 shrink-0">
                                                                    <span className="font-bold text-sm">{fmt(inv.amount)}</span>
                                                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {/* Progress */}
                                                {totalExpected > 0 && (
                                                    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                                                            <span className="font-semibold">Tỷ lệ thu tiền</span>
                                                            <span className="font-black text-emerald-600">{Math.round(totalCollected / totalExpected * 100)}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                                                style={{ width: `${Math.min(100, Math.round(totalCollected / totalExpected * 100))}%` }} />
                                                        </div>
                                                        <div className="flex justify-between text-xs mt-2 text-slate-400">
                                                            <span>Đã thu: <strong className="text-emerald-600">{fmt(totalCollected)}</strong></span>
                                                            <span>Kế hoạch: {fmt(totalExpected)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </>)
                                        )}

                                        {/* Panel body — Quá hạn */}
                                        {invoiceView === 'overdue' && (
                                            overdueInvoices.length === 0 ? (
                                                <div className="py-12 text-center">
                                                    <FaCheckCircle className="mx-auto text-3xl text-emerald-400 mb-2 opacity-60" />
                                                    <p className="text-sm text-emerald-600 font-semibold">Không có hóa đơn quá hạn 🎉</p>
                                                </div>
                                            ) : (<>
                                                <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                                                    {overdueInvoices.map(inv => {
                                                        const days = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000);
                                                        return (
                                                            <div key={inv.id} className="px-5 py-4 hover:bg-red-50/40 transition-colors">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex flex-col items-center justify-center shrink-0 text-center leading-none">
                                                                            <span className="text-[8px] font-bold uppercase">T</span>
                                                                            <span className="text-sm font-black">{inv.month}</span>
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="font-bold text-sm truncate">{inv.contract?.property?.title}</p>
                                                                            <p className="text-xs text-slate-500">👤 {inv.contract?.tenant?.fullName}</p>
                                                                            {inv.contract?.tenant?.phone && (
                                                                                <p className="text-xs text-slate-400">📞 {inv.contract.tenant.phone}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right shrink-0">
                                                                        <p className="font-black text-red-600">{fmt(inv.amount)}</p>
                                                                        <p className="text-[10px] text-slate-400 mt-0.5">Hạn: {fmtDate(inv.dueDate)}</p>
                                                                        <p className="text-[10px] text-red-500 font-bold">Trễ {days} ngày</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex items-center justify-between px-5 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800">
                                                    <span className="text-xs font-semibold text-red-600">Tổng nợ quá hạn</span>
                                                    <span className="font-black text-red-600">{fmt(totalOverdue)}</span>
                                                </div>
                                            </>)
                                        )}
                                    </div>

                                    {/* Quick actions */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { href: '/properties/create', emoji: '🏠', label: 'Đăng tin mới', sub: 'Thêm phòng mới' },
                                            { href: '/contracts/create',  emoji: '📝', label: 'Tạo hợp đồng', sub: 'Ký HĐ blockchain' },
                                            { href: '/invoices',          emoji: '💸', label: 'Thu chi',       sub: 'Xem hóa đơn' },
                                            { onClick: () => setTab('customers'), emoji: '👥', label: 'Khách hàng', sub: `${tenants.length} đang thuê` },
                                        ].map((item, i) => (
                                            item.href ? (
                                                <Link key={i} href={item.href}
                                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                                    <div className="text-2xl mb-2">{item.emoji}</div>
                                                    <p className="font-bold text-sm">{item.label}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                                                </Link>
                                            ) : (
                                                <button key={i} onClick={item.onClick}
                                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
                                                    <div className="text-2xl mb-2">{item.emoji}</div>
                                                    <p className="font-bold text-sm">{item.label}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                                                </button>
                                            )
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* ======================================
                                KHÁCH HÀNG
                            ====================================== */}
                            {tab === 'customers' && (
                                <motion.div key="customers"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Khách hàng</h1>
                                            <p className="text-sm text-slate-400 mt-0.5">{filteredTenants.length} người đang thuê</p>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                                        <input type="text" placeholder="Tìm theo tên, SĐT, email..."
                                            value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                    </div>

                                    {filteredTenants.length === 0 ? (
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-800">
                                            <FaUsers className="mx-auto text-4xl text-slate-200 mb-3" />
                                            <p className="text-slate-400 text-sm">Chưa có khách hàng nào.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredTenants.map((t: any) => {
                                                const ml = monthsLeft(t.contractEnd);
                                                return (
                                                    <motion.div key={t.id}
                                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                                                                    {t.fullName?.[0]?.toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <p className="font-bold text-sm">{t.fullName}</p>
                                                                        {t.hasDebt && (
                                                                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">Còn nợ</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 truncate">{t.email}</p>
                                                                    {t.phone && <p className="text-xs text-slate-400">📞 {t.phone}</p>}
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="font-bold text-sm text-violet-600">{fmt(t.monthlyRent)}</p>
                                                                <p className="text-[11px] text-slate-400">/tháng</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-xs text-slate-500">🏠 <span className="font-medium">{t.propertyTitle}</span></p>
                                                                <p className={`text-xs font-semibold mt-0.5 ${ml <= 0 ? 'text-red-500' : ml <= 1 ? 'text-red-400' : ml <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                                    {ml <= 0 ? '⚠ Hết hạn' : ml === 1 ? '⚠ Còn 1 tháng' : `Còn ${ml} tháng`}
                                                                    {ml > 0 && <span className="text-slate-400 font-normal"> · đến {fmtDate(t.contractEnd)}</span>}
                                                                </p>
                                                            </div>
                                                            <Link href={`/contracts/${t.contractId}`}
                                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 transition-colors shrink-0">
                                                                <FaEye size={10} /> Hợp đồng
                                                            </Link>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ======================================
                                BÀI ĐĂNG
                            ====================================== */}
                            {tab === 'properties' && (
                                <motion.div key="properties"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Bài đăng</h1>
                                            <p className="text-sm text-slate-400 mt-0.5">{properties.length} phòng · {properties.filter(p => !p.available).length} đang cho thuê</p>
                                        </div>
                                        <Link href="/properties/create"
                                            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-violet-200 transition-colors">
                                            <FaPlus className="text-xs" /> Đăng tin
                                        </Link>
                                    </div>

                                    <div className="relative">
                                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                                        <input type="text" placeholder="Tìm phòng theo tên, quận..."
                                            value={propSearch} onChange={e => setPropSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                    </div>

                                    {filteredProps.length === 0 ? (
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-800">
                                            <FaHome className="mx-auto text-4xl text-slate-200 mb-3" />
                                            <p className="text-slate-400 text-sm mb-4">Chưa có bài đăng nào.</p>
                                            <Link href="/properties/create"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold">
                                                <FaPlus /> Đăng tin ngay
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {filteredProps.map((p, i) => {
                                                const ap = APPROVAL_STATUS[p.approvalStatus] || APPROVAL_STATUS.PENDING;
                                                return (
                                                    <motion.div key={p.id}
                                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all"
                                                    >
                                                        <div className="relative h-36 bg-slate-100 dark:bg-slate-800">
                                                            {p.images?.[0]
                                                                ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                                                : <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">🏠</div>
                                                            }
                                                            <div className="absolute top-2 right-2 flex gap-1.5">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${ap.cls}`}>{ap.label}</span>
                                                                {!p.available && (
                                                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-700">🔑 Đang thuê</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <p className="font-bold text-sm truncate">{p.title}</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">📍 {p.district}, {p.city}</p>
                                                            {p.approvalStatus === 'REJECTED' && p.rejectionReason && (
                                                                <p className="text-xs text-red-500 mt-2 bg-red-50 px-2 py-1.5 rounded-lg">✗ {p.rejectionReason}</p>
                                                            )}
                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                                <p className="font-bold text-sm text-violet-600">{fmt(p.price)}<span className="text-xs text-slate-400 font-normal">/th</span></p>
                                                                <Link href={`/properties/${p.id}`}
                                                                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:underline">
                                                                    <FaEye size={10} /> Xem
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ======================================
                                HỢP ĐỒNG
                            ====================================== */}
                            {tab === 'contracts' && (
                                <motion.div key="contracts"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Hợp đồng</h1>
                                            <p className="text-sm text-slate-400 mt-0.5">{activeContracts.length} đang hiệu lực · {contracts.length} tổng</p>
                                        </div>
                                        <Link href="/contracts/create"
                                            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-violet-200 transition-colors">
                                            <FaPlus className="text-xs" /> Tạo HĐ
                                        </Link>
                                    </div>

                                    {/* Filter pills + search */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                                            <input type="text" placeholder="Tìm phòng, người thuê..."
                                                value={contractSearch} onChange={e => setContractSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {['ALL', 'ACTIVE', 'PENDING', 'DRAFT', 'EXPIRED'].map(s => (
                                                <button key={s} onClick={() => setContractFilter(s)}
                                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                                                        contractFilter === s
                                                            ? 'bg-violet-600 text-white'
                                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                                                    }`}>
                                                    {s === 'ALL' ? 'Tất cả' : CONTRACT_STATUS[s]?.label || s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {filteredContracts.length === 0 ? (
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-800">
                                            <FaFileContract className="mx-auto text-4xl text-slate-200 mb-3" />
                                            <p className="text-slate-400 text-sm">Không tìm thấy hợp đồng.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredContracts.map((c, i) => {
                                                const st  = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.DRAFT;
                                                const ml  = monthsLeft(c.endDate);
                                                const exp = (c.status === 'ACTIVE' || c.status === 'SIGNED') && ml <= 1;
                                                return (
                                                    <motion.div key={c.id}
                                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 hover:shadow-md transition-all ${
                                                            exp ? 'border-amber-300' : 'border-slate-200 dark:border-slate-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    <p className="font-bold text-sm">{c.property?.title}</p>
                                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                                                                    {exp && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700">⚠ Sắp hết hạn</span>}
                                                                </div>
                                                                <p className="text-xs text-slate-500">👤 {c.tenant?.fullName}</p>
                                                                <p className="text-xs text-slate-400 mt-0.5">
                                                                    {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                                                                    {ml > 0 && (
                                                                        <span className={`ml-1.5 font-semibold ${ml <= 1 ? 'text-red-500' : ml <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                                            ({ml}th còn lại)
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <div className="text-right hidden sm:block">
                                                                    <p className="font-bold text-sm text-violet-600">{fmt(c.monthlyRent)}</p>
                                                                    <p className="text-[10px] text-slate-400">/tháng</p>
                                                                </div>
                                                                <Link href={`/contracts/${c.id}`}
                                                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 transition-colors">
                                                                    <FaEye size={10} /> Chi tiết
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
}
