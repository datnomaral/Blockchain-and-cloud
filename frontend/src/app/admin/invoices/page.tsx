'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaCheckDouble, FaTrash, FaTimes,
    FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaFilter
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (d: string | Date | null) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const INVOICE_STATUS: Record<string, { label: string; badgeCls: string; dotCls: string }> = {
    UNPAID:  { label: 'Chưa đóng',  badgeCls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',         dotCls: 'bg-red-500' },
    PAID:    { label: 'Đã đóng',    badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dotCls: 'bg-emerald-500' },
    OVERDUE: { label: 'Quá hạn nợ', badgeCls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dotCls: 'bg-orange-500' },
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><FaTimes size={14} /></button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </motion.div>
        </motion.div>
    );
}

export default function AdminInvoicesPage() {
    const [invoices, setInvoices]         = useState<any[]>([]);
    const [pagination, setPagination]     = useState<any>(null);
    const [summaryStats, setSummaryStats] = useState<any>(null);
    const [loading, setLoading]           = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [month, setMonth]               = useState('');
    const [year, setYear]                 = useState(String(new Date().getFullYear()));
    const [page, setPage]                 = useState(1);
    const [modal, setModal]               = useState<{ mode: 'status' | 'delete'; item: any } | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    const loadData = useCallback(() => {
        if (!token) return;
        setLoading(true);

        // Build query — admin không truyền landlordId để lấy TẤT CẢ hóa đơn
        const p = new URLSearchParams({ page: String(page), limit: '15' });
        if (statusFilter) p.set('status', statusFilter);
        if (month)        p.set('month', month);
        if (year)         p.set('year', year);

        fetch(`${API}/api/invoices?${p}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setInvoices(d.data.invoices);
                    setPagination(d.data.pagination);

                    // Tính summary từ danh sách hiện tại
                    const invs = d.data.invoices as any[];
                    const totalExpected  = invs.reduce((s: number, i: any) => s + i.amount, 0);
                    const totalCollected = invs.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + i.amount, 0);
                    const totalUnpaid    = invs.filter((i: any) => i.status !== 'PAID').reduce((s: number, i: any) => s + i.amount, 0);
                    const totalOverdue   = invs.filter((i: any) => i.status === 'OVERDUE').reduce((s: number, i: any) => s + i.amount, 0);
                    setSummaryStats({ totalExpected, totalCollected, totalUnpaid, totalOverdue });
                }
            })
            .finally(() => setLoading(false));
    }, [token, statusFilter, month, year, page]);

    useEffect(() => { loadData(); }, [loadData]);

    const updateStatus = async (id: string, newStatus: string) => {
        const r = await fetch(`${API}/api/invoices/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus }),
        });
        const d = await r.json();
        if (d.success) { toast.success('Đã cập nhật tình trạng'); loadData(); setModal(null); }
        else toast.error(d.message);
    };

    const delInvoice = async (id: string) => {
        const r = await fetch(`${API}/api/invoices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) { toast.success('Đã xóa hóa đơn'); loadData(); setModal(null); }
        else toast.error(d.message);
    };

    // Đánh dấu quá hạn tất cả hóa đơn UNPAID đã qua hạn
    const markOverdue = async () => {
        const overdueIds = invoices
            .filter(i => i.status === 'UNPAID' && new Date(i.dueDate) < new Date())
            .map(i => i.id);

        if (overdueIds.length === 0) { toast('Không có hóa đơn quá hạn nào'); return; }

        let count = 0;
        for (const id of overdueIds) {
            const r = await fetch(`${API}/api/invoices/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: 'OVERDUE' }),
            });
            const d = await r.json();
            if (d.success) count++;
        }
        toast.success(`Đã đánh dấu ${count} hóa đơn quá hạn`);
        loadData();
    };

    return (
        <div className="space-y-6 max-w-7xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý Thu / Chi</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {pagination ? `${pagination.total} hóa đơn` : '—'} · Kiểm soát tình trạng đóng tiền trọ
                    </p>
                </div>
                <button onClick={markOverdue}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-sm font-semibold hover:bg-orange-100 transition-colors border border-orange-200 dark:border-orange-800">
                    ⚠️ Đánh dấu quá hạn
                </button>
            </div>

            {/* Summary stats */}
            {summaryStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Tổng hóa đơn', value: fmt(summaryStats.totalExpected), icon: <FaMoneyBillWave />, cls: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                        { label: 'Đã thu được', value: fmt(summaryStats.totalCollected), icon: <FaCheckCircle />, cls: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Chưa thu / Nợ', value: fmt(summaryStats.totalUnpaid), icon: <FaTimesCircle />, cls: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
                        { label: 'Quá hạn', value: fmt(summaryStats.totalOverdue), icon: '⚠️', cls: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                    ].map((c, i) => (
                        <div key={i} className={`${c.bg} rounded-2xl p-4 flex items-center gap-3 border border-slate-100 dark:border-slate-800`}>
                            <span className={`text-xl ${c.cls}`}>{c.icon}</span>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">{c.label}</p>
                                <p className={`font-bold text-sm ${c.cls}`}>{c.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                <FaFilter className="text-slate-400 self-center" size={13} />
                <select value={month} onChange={e => { setMonth(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm min-w-32 focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="">Tất cả tháng</option>
                    {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
                </select>
                <select value={year} onChange={e => { setYear(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm min-w-32 focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="2024">Năm 2024</option>
                    <option value="2025">Năm 2025</option>
                    <option value="2026">Năm 2026</option>
                </select>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm min-w-36 focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="">Tất cả trạng thái</option>
                    <option value="UNPAID">🔴 Chưa đóng</option>
                    <option value="PAID">🟢 Đã đóng</option>
                    <option value="OVERDUE">🟠 Quá hạn</option>
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                                        {['Kỳ thu', 'Người thuê', 'Chủ nhà', 'Phòng', 'Số tiền', 'Trạng thái', 'Ngày đóng', ''].map(h => (
                                            <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {invoices.map(inv => {
                                        const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.UNPAID;
                                        const isOverdue = inv.status === 'UNPAID' && new Date(inv.dueDate) < new Date();
                                        return (
                                            <tr key={inv.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                                                <td className="px-4 py-4">
                                                    <p className="font-bold text-sm">Tháng {inv.month}/{inv.year}</p>
                                                    <p className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                                                        {isOverdue ? '⚠️ ' : ''}Hạn: {formatDate(inv.dueDate)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-sm">{inv.contract?.tenant?.fullName || '—'}</p>
                                                    <p className="text-xs text-slate-400">{inv.contract?.tenant?.phone}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">{inv.contract?.landlord?.fullName || '—'}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-sm line-clamp-1">{inv.contract?.property?.title || '—'}</p>
                                                    <p className="text-xs text-slate-400">{inv.contract?.property?.city}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-bold text-sm text-violet-600 dark:text-violet-400 whitespace-nowrap">{fmt(inv.amount)}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${st.badgeCls}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dotCls}`} />
                                                        {st.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                                                    {inv.paidAt ? formatDate(inv.paidAt) : '—'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex gap-1.5">
                                                        {inv.status !== 'PAID' && (
                                                            <button onClick={() => setModal({ mode: 'status', item: inv })}
                                                                className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1 whitespace-nowrap">
                                                                <FaCheckDouble size={10} /> Đã thu
                                                            </button>
                                                        )}
                                                        <button onClick={() => setModal({ mode: 'delete', item: inv })}
                                                            className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                                            <FaTrash size={11} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {invoices.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-16 text-slate-400">
                                                <p className="text-3xl mb-2">🧾</p>
                                                <p className="font-semibold">Chưa có hóa đơn nào</p>
                                                <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo hóa đơn mới</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">← Trước</button>
                            <span className="text-sm text-slate-500 px-3">Trang {page}/{pagination.totalPages}</span>
                            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Sau →</button>
                        </div>
                    )}
                </>
            )}

            <AnimatePresence>
                {modal?.mode === 'status' && (
                    <Modal title="Xác nhận thu tiền" onClose={() => setModal(null)}>
                        <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm space-y-1">
                            <p><span className="text-slate-400">Người thuê:</span> <strong>{modal.item.contract?.tenant?.fullName}</strong></p>
                            <p><span className="text-slate-400">Phòng:</span> <strong>{modal.item.contract?.property?.title}</strong></p>
                            <p><span className="text-slate-400">Kỳ:</span> <strong>Tháng {modal.item.month}/{modal.item.year}</strong></p>
                            <p><span className="text-slate-400">Số tiền:</span> <strong className="text-violet-600">{fmt(modal.item.amount)}</strong></p>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm">Xác nhận khách hàng đã thanh toán đầy đủ hóa đơn này?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm">Chưa đóng</button>
                            <button onClick={() => updateStatus(modal.item.id, 'PAID')}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2">
                                <FaCheckDouble size={12} /> Đã thu đủ
                            </button>
                        </div>
                    </Modal>
                )}
                {modal?.mode === 'delete' && (
                    <Modal title="Xóa hóa đơn" onClose={() => setModal(null)}>
                        <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm">
                            Xóa hóa đơn tháng {modal.item.month}/{modal.item.year} của <strong>{modal.item.contract?.tenant?.fullName}</strong>?
                            Hành động không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm">Hủy</button>
                            <button onClick={() => delInvoice(modal.item.id)}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2">
                                <FaTrash size={12} /> Xóa
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}
