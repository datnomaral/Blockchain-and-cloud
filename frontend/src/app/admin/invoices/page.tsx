'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaPlus, FaCheckDouble, FaTrash, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;

const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (d: string | Date | null) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const INVOICE_STATUS: Record<string, { label: string; badgeCls: string; dotCls: string }> = {
    UNPAID:   { label: 'Chưa đóng',   badgeCls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', dotCls: 'bg-red-500' },
    PAID:     { label: 'Đã đóng',     badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dotCls: 'bg-emerald-500' },
    OVERDUE:  { label: 'Quá hạn nợ',  badgeCls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dotCls: 'bg-orange-500' },
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
    const [invoices, setInvoices]     = useState<any[]>([]);
    const [stats, setStats]           = useState<any>(null);
    const [loading, setLoading]       = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [month, setMonth]           = useState('');
    const [year, setYear]             = useState(String(new Date().getFullYear()));
    const [page, setPage]             = useState(1);
    const [modal, setModal]           = useState<{ mode: 'status' | 'delete'; item: any } | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    const loadData = useCallback(() => {
        if (!token) return;
        setLoading(true);
        const p = new URLSearchParams({ page: String(page), limit: '15' });
        if (statusFilter) p.set('status', statusFilter);
        if (month)        p.set('month', month);
        if (year)         p.set('year', year);

        fetch(`${API}/api/invoices?${p}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setInvoices(d.data.invoices); })
            .finally(() => setLoading(false));

        // Nếu người đăng nhập là chủ nhà, lấy thêm Report (Giả sử admin check theo 1 user demo)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
            fetch(`${API}/api/invoices/stats?landlordId=${user.id}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json())
                .then(d => { if (d.success) setStats(d.data); });
        }
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

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý Thu / Chi</h1>
                <p className="text-sm text-slate-400 mt-0.5">Kiểm soát tình trạng đóng tiền trọ của khách hàng</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center text-xl"><FaMoneyBillWave /></div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">DỰ KIẾN THU NĂM {year}</p>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatMoney(stats.totalExpected)}</h3>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/30 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xl"><FaCheckDouble /></div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-600/80 mb-1">ĐÃ THU ĐƯỢC</p>
                            <h3 className="text-xl font-bold text-emerald-600">{formatMoney(stats.totalCollected)}</h3>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-red-100 dark:border-red-800/30 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center text-xl"><FaTimes /></div>
                        <div>
                            <p className="text-xs font-semibold text-red-600/80 mb-1">CHƯA THU / NỢ</p>
                            <h3 className="text-xl font-bold text-red-600">{formatMoney(stats.totalUnpaid)}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex flex-wrap gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                <select value={month} onChange={e => setMonth(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm min-w-32">
                    <option value="">Tất cả Tháng</option>
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
                </select>
                <select value={year} onChange={e => setYear(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm min-w-32">
                    <option value="2024">Năm 2024</option>
                    <option value="2025">Năm 2025</option>
                    <option value="2026">Năm 2026</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm min-w-36">
                    <option value="">Trạng thái</option>
                    <option value="UNPAID">🔴 Chưa đóng</option>
                    <option value="PAID">🟢 Đã đóng</option>
                    <option value="OVERDUE">🟠 Quá hạn</option>
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                                    {['Kỳ thu', 'Người thuê', 'Phòng', 'Số tiền', 'Trạng thái', 'Ngày đóng', ''].map(h => (
                                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {invoices.map(inv => {
                                    const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.UNPAID;
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-sm">Tháng {inv.month}/{inv.year}</p>
                                                <p className="text-xs text-red-500">Hạn: {formatDate(inv.dueDate)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-sm">{inv.contract?.tenant?.fullName}</p>
                                                <p className="text-xs text-slate-400">{inv.contract?.tenant?.phone}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-sm line-clamp-1">{inv.contract?.property?.title}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-sm text-violet-600 dark:text-violet-400">{formatMoney(inv.amount)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.badgeCls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dotCls}`} />
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {inv.paidAt ? formatDate(inv.paidAt) : '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-1.5">
                                                    {inv.status !== 'PAID' && (
                                                        <button onClick={() => setModal({ mode: 'status', item: inv })} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5">
                                                            <FaCheckDouble /> Đã thu
                                                        </button>
                                                    )}
                                                    <button onClick={() => setModal({ mode: 'delete', item: inv })} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><FaTrash size={12} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16 text-slate-400">
                                            <p className="text-3xl mb-2">🧾</p>
                                            <p className="font-semibold">Chưa có hóa đơn nào</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {modal?.mode === 'status' && (
                     <Modal title="Xác nhận thu tiền" onClose={() => setModal(null)}>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">Xác nhận khách hàng đã thanh toán đầy đủ hóa đơn này?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 transition-colors">Chưa đóng</button>
                            <button onClick={() => updateStatus(modal.item.id, 'PAID')} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">Đã thu đủ</button>
                        </div>
                    </Modal>
                )}
                {modal?.mode === 'delete' && (
                    <Modal title="Xóa hóa đơn" onClose={() => setModal(null)}>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">Bạn có chắc chắn muốn xóa hóa đơn này khỏi quá trình theo dõi?</p>
                        <button onClick={() => delInvoice(modal.item.id)} className="w-full py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Xóa Hóa Đơn</button>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}
