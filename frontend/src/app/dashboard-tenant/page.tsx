'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaFileContract, FaMoneyBillWave, FaHome, FaBell,
    FaCheckCircle, FaClock, FaExclamationTriangle,
    FaSignOutAlt, FaRedo, FaTimes, FaEye,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtDate = (d: any) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—';

function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

const CONTRACT_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
    DRAFT:      { label: 'Bản nháp',      cls: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
    PENDING:    { label: 'Chờ ký',        cls: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
    SIGNED:     { label: 'Đã ký',         cls: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
    ACTIVE:     { label: 'Đang hiệu lực', cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    EXPIRED:    { label: 'Hết hạn',       cls: 'bg-red-100 text-red-600',        dot: 'bg-red-500' },
    TERMINATED: { label: 'Đã hủy',        cls: 'bg-gray-100 text-gray-500',      dot: 'bg-gray-400' },
};

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
    UNPAID:  { label: 'Chưa thanh toán', cls: 'bg-amber-100 text-amber-700' },
    PAID:    { label: 'Đã thanh toán',   cls: 'bg-emerald-100 text-emerald-700' },
    OVERDUE: { label: 'Quá hạn',         cls: 'bg-red-100 text-red-700' },
};

// ── Modal gia hạn ─────────────────────────────────────────────────────
function RenewModal({ contract, onClose, onSuccess }: { contract: any; onClose: () => void; onSuccess: () => void }) {
    const defaultEnd = new Date(contract.endDate);
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
    const [newEndDate, setNewEndDate] = useState(defaultEnd.toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    const minDate = new Date(contract.endDate);
    minDate.setDate(minDate.getDate() + 2);

    const handleRenew = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`${API}/api/contracts/${contract.id}/renew`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ newEndDate }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Yêu cầu gia hạn đã được gửi! Chờ chủ nhà xác nhận.', { duration: 4000 });
                onSuccess();
                onClose();
            } else {
                toast.error(data.message || 'Lỗi khi gửi yêu cầu');
            }
        } catch {
            toast.error('Lỗi kết nối');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-2 text-white">
                        <FaRedo size={14} />
                        <h3 className="font-bold">Gia hạn hợp đồng</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <FaTimes size={13} />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="font-semibold text-sm text-blue-800 dark:text-blue-200">{contract.property?.title}</p>
                        <p className="text-xs text-blue-500 mt-1">Hợp đồng hiện tại đến: {fmtDate(contract.endDate)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ngày kết thúc mới</label>
                        <input type="date" value={newEndDate} min={minDate.toISOString().split('T')[0]}
                            onChange={e => setNewEndDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <p className="text-xs text-slate-400 mt-1.5">
                            Gia hạn thêm: ~{newEndDate ? Math.ceil((new Date(newEndDate).getTime() - new Date(contract.endDate).getTime()) / 86400000 / 30) : 0} tháng
                        </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                        ℹ️ Yêu cầu sẽ tạo hợp đồng mới ở trạng thái <strong>Bản nháp</strong> — chủ nhà cần ký xác nhận.
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            Hủy bỏ
                        </button>
                        <button onClick={handleRenew} disabled={submitting}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {submitting
                                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <FaRedo size={11} />}
                            {submitting ? 'Đang gửi...' : 'Xác nhận gia hạn'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function TenantDashboard() {
    const router = useRouter();
    const [user, setUser]         = useState<any>(null);
    const [contracts, setContracts] = useState<any[]>([]);
    const [invoices, setInvoices]   = useState<any[]>([]);
    const [loading, setLoading]     = useState(true);
    const [renewTarget, setRenewTarget]   = useState<any>(null);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    const loadAll = useCallback(async () => {
        const token    = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) { router.push('/auth/login'); return; }
        const u = JSON.parse(userData);
        // Nếu là chủ nhà/admin → redirect về dashboard chủ nhà
        if (u.role === 'LANDLORD' || u.role === 'ADMIN') {
            router.push('/dashboard'); return;
        }
        setUser(u);
        setLoading(true);
        try {
            const [cRes, iRes] = await Promise.all([
                fetch(`${API}/api/contracts`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/api/invoices?tenantId=${u.id}&limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const [cData, iData] = await Promise.all([cRes.json(), iRes.json()]);
            if (cData.success) setContracts(cData.data.contracts.filter((c: any) => c.tenantId === u.id));
            if (iData.success) setInvoices(iData.data.invoices.filter((i: any) => i.contract?.tenantId === u.id));
        } catch { toast.error('Lỗi khi tải dữ liệu'); }
        finally  { setLoading(false); }
    }, [router]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading || !user) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-400 text-sm">Đang tải...</p>
            </div>
        </div>
    );

    const activeContracts  = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'SIGNED');
    const unpaidInvoices   = invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE');
    const totalUnpaid      = unpaidInvoices.reduce((s, i) => s + i.amount, 0);

    // Hợp đồng cần hiện banner: còn ≤30 ngày hoặc đã EXPIRED
    const warningContracts = contracts.filter(c => {
        if (dismissedIds.has(c.id)) return false;
        if (c.status === 'EXPIRED') return true;
        if (c.status === 'ACTIVE') return daysUntil(c.endDate) <= 30;
        return false;
    });

    const STATS = [
        {
            label: 'Đang thuê',
            value: `${activeContracts.length} hợp đồng`,
            icon: FaFileContract,
            gradient: 'from-blue-500 to-indigo-500',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600',
        },
        {
            label: 'Phòng đang ở',
            value: activeContracts[0]?.property?.title || '—',
            sub: activeContracts[0]?.property?.address,
            icon: FaHome,
            gradient: 'from-emerald-500 to-teal-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-600',
        },
        {
            label: 'Cần thanh toán',
            value: fmt(totalUnpaid),
            sub: `${unpaidInvoices.length} hóa đơn`,
            icon: FaMoneyBillWave,
            gradient: unpaidInvoices.length > 0 ? 'from-red-500 to-rose-500' : 'from-slate-400 to-slate-300',
            bg: unpaidInvoices.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-800',
            text: unpaidInvoices.length > 0 ? 'text-red-600' : 'text-slate-500',
        },
        {
            label: 'Hết hạn hợp đồng',
            value: activeContracts[0] ? fmtDate(activeContracts[0].endDate) : '—',
            sub: activeContracts[0] ? `Còn ${daysUntil(activeContracts[0].endDate)} ngày` : '',
            icon: FaClock,
            gradient: 'from-violet-500 to-purple-500',
            bg: 'bg-violet-50 dark:bg-violet-900/20',
            text: 'text-violet-600',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                            {`Xin chào, ${user.fullName || user.name || 'bạn'} 👋`}
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Dashboard người thuê</p>
                    </div>
                    <button onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                        <FaSignOutAlt size={13} /> Đăng xuất
                    </button>
                </div>

                {/* ── Banners cảnh báo hết hạn ─────────────────────── */}
                <AnimatePresence>
                    {warningContracts.map(c => {
                        const days = daysUntil(c.endDate);
                        const isExpired = days < 0;
                        const isUrgent  = days <= 7;
                        return (
                            <motion.div key={c.id}
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className={`relative rounded-2xl p-5 border-2 shadow-md overflow-hidden ${isExpired
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                    : isUrgent
                                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                                        : 'bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-700'
                                }`}>
                                <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-20 ${isExpired ? 'bg-red-400' : isUrgent ? 'bg-orange-400' : 'bg-amber-400'}`} />
                                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${isExpired ? 'bg-red-100 text-red-600' : isUrgent ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'}`}>
                                            <FaBell size={16} />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${isExpired ? 'text-red-700 dark:text-red-300' : isUrgent ? 'text-orange-700 dark:text-orange-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                                {isExpired ? '⚠️ Hợp đồng đã hết hạn!' : isUrgent ? `🔔 Hợp đồng hết hạn sau ${days} ngày!` : `📅 Hợp đồng sắp hết hạn (còn ${days} ngày)`}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                                <strong>{c.property?.title}</strong> — Hết hạn: <strong>{fmtDate(c.endDate)}</strong>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {isExpired ? 'Hợp đồng đã hết hạn. Bạn có muốn tiếp tục thuê phòng không?' : 'Bạn có muốn gia hạn hợp đồng để tiếp tục thuê phòng không?'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => setRenewTarget(c)}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all ${isExpired ? 'bg-red-600 hover:bg-red-700' : isUrgent ? 'bg-orange-600 hover:bg-orange-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                                            <FaRedo size={11} /> Gia hạn
                                        </button>
                                        <button onClick={() => setDismissedIds(prev => new Set([...prev, c.id]))}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                            <FaTimes size={11} /> Không
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {STATS.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                                <s.icon className={`${s.text} text-sm`} />
                            </div>
                            <p className="text-xs text-slate-400 font-semibold mb-1">{s.label}</p>
                            <p className={`text-base font-black ${s.text} leading-tight`}>{s.value}</p>
                            {s.sub && <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>}
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-5">
                    {/* Hợp đồng */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <FaFileContract className="text-blue-500" />
                                <h2 className="font-bold text-sm">Hợp đồng của tôi</h2>
                            </div>
                            <Link href="/contracts" className="text-xs text-blue-600 font-semibold hover:underline">Xem tất cả →</Link>
                        </div>
                        {contracts.length === 0 ? (
                            <div className="py-12 text-center text-slate-300">
                                <FaFileContract className="mx-auto text-3xl mb-2" />
                                <p className="text-sm">Chưa có hợp đồng nào</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {contracts.slice(0, 5).map(c => {
                                    const st = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.DRAFT;
                                    const days = daysUntil(c.endDate);
                                    const expiringSoon = c.status === 'ACTIVE' && days <= 30;
                                    return (
                                        <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{c.property?.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                                                    {expiringSoon && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">⏰ Còn {days} ngày</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {(c.status === 'ACTIVE' || c.status === 'EXPIRED') && days <= 30 && (
                                                    <button onClick={() => setRenewTarget(c)}
                                                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Gia hạn">
                                                        <FaRedo size={11} />
                                                    </button>
                                                )}
                                                <Link href={`/contracts/${c.id}`}
                                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors">
                                                    <FaEye size={11} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Hóa đơn */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <FaMoneyBillWave className={unpaidInvoices.length > 0 ? 'text-red-500' : 'text-emerald-500'} />
                                <h2 className="font-bold text-sm">Hóa đơn cần thanh toán</h2>
                            </div>
                            <Link href="/invoices" className="text-xs text-blue-600 font-semibold hover:underline">Xem tất cả →</Link>
                        </div>
                        {unpaidInvoices.length === 0 ? (
                            <div className="py-12 text-center">
                                <FaCheckCircle className="mx-auto text-3xl text-emerald-400 mb-2 opacity-60" />
                                <p className="text-sm text-emerald-600 font-semibold">Không có hóa đơn chưa thanh toán 🎉</p>
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {unpaidInvoices.slice(0, 5).map(inv => {
                                        const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.UNPAID;
                                        const isOverdue = inv.status === 'OVERDUE';
                                        return (
                                            <div key={inv.id} className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isOverdue ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">
                                                        {inv.contract?.property?.title}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        Tháng {inv.month}/{inv.year} · Hạn: {fmtDate(inv.dueDate)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-right">
                                                        <p className={`font-bold text-sm ${isOverdue ? 'text-red-600' : ''}`}>{fmt(inv.amount)}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                                                    </div>
                                                    <Link href="/invoices"
                                                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors">
                                                        <FaEye size={11} />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {totalUnpaid > 0 && (
                                    <div className="flex items-center justify-between px-5 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800">
                                        <span className="text-xs font-semibold text-red-600">Tổng cần thanh toán</span>
                                        <span className="font-black text-red-600">{fmt(totalUnpaid)}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Quick links */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { href: '/contracts',        emoji: '📋', label: 'Hợp đồng',    sub: `${contracts.length} hợp đồng` },
                        { href: '/invoices',         emoji: '💸', label: 'Thanh toán',   sub: `${unpaidInvoices.length} chờ TT` },
                        { href: '/properties',       emoji: '🏠', label: 'Tìm phòng',    sub: 'Xem phòng mới' },
                        { href: '/about',            emoji: '📞', label: 'Hỗ trợ',       sub: 'Liên hệ' },
                    ].map(item => (
                        <Link key={item.href} href={item.href}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                            <div className="text-2xl mb-2">{item.emoji}</div>
                            <p className="font-bold text-sm">{item.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Modal gia hạn */}
            <AnimatePresence>
                {renewTarget && (
                    <RenewModal contract={renewTarget} onClose={() => setRenewTarget(null)} onSuccess={loadAll} />
                )}
            </AnimatePresence>
        </div>
    );
}
