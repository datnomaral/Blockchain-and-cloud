'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEdit, FaTrash, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;

const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('vi-VN');

const STATUS_MAP: Record<string, { label: string; badgeCls: string; dotCls: string }> = {
    DRAFT:    { label: 'Bản nháp',      badgeCls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', dotCls: 'bg-slate-400' },
    PENDING:  { label: 'Chờ ký',        badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', dotCls: 'bg-amber-500' },
    SIGNED:   { label: 'Đã ký',         badgeCls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', dotCls: 'bg-blue-500' },
    ACTIVE:   { label: 'Đang hiệu lực', badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dotCls: 'bg-emerald-500' },
    EXPIRED:  { label: 'Hết hạn',       badgeCls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', dotCls: 'bg-red-500' },
    CANCELLED:{ label: 'Đã hủy',        badgeCls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', dotCls: 'bg-gray-400' },
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
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><FaTimes size={14} /></button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </motion.div>
        </motion.div>
    );
}

function ViewModal({ item, onClose }: any) {
    const st = STATUS_MAP[item.status] || STATUS_MAP.DRAFT;
    return (
        <Modal title="Chi tiết hợp đồng" onClose={onClose}>
            <div className="mb-5 flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className={`w-3 h-3 rounded-full shrink-0 ${st.dotCls}`} />
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.badgeCls}`}>{st.label}</span>
            </div>
            <div className="space-y-2">
                {[
                    { label: 'Phòng', value: `${item.property?.title} — ${item.property?.city}` },
                    { label: 'Chủ nhà', value: `${item.landlord?.fullName} (${item.landlord?.email})` },
                    { label: 'Người thuê', value: `${item.tenant?.fullName} (${item.tenant?.email})` },
                    { label: 'Giá thuê', value: formatMoney(item.monthlyRent) },
                    { label: 'Đặt cọc', value: formatMoney(item.deposit) },
                    { label: 'Thời hạn', value: `${formatDate(item.startDate)} → ${formatDate(item.endDate)}` },
                    { label: 'Ngày TT', value: `Ngày ${item.paymentDay} hàng tháng` },
                    { label: 'Ký chủ nhà', value: item.landlordSignature ? '✅ Đã ký' : '⏳ Chưa ký' },
                    { label: 'Ký người thuê', value: item.tenantSignature ? '✅ Đã ký' : '⏳ Chưa ký' },
                    ...(item.signedAt ? [{ label: 'Thời gian ký', value: formatDate(item.signedAt) }] : []),
                    ...(item.contractHash ? [{ label: 'Hash', value: item.contractHash.slice(0, 20) + '...' }] : []),
                    ...(item.blockchainTxHash ? [{ label: 'Blockchain Tx', value: item.blockchainTxHash.slice(0, 20) + '...' }] : []),
                    { label: 'Ngày tạo', value: formatDate(item.createdAt) },
                ].map(row => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <span className="text-xs text-slate-500 shrink-0">{row.label}</span>
                        <span className="text-sm font-semibold text-right ml-4">{row.value}</span>
                    </div>
                ))}
            </div>
        </Modal>
    );
}

function StatusModal({ item, onClose, onSave }: any) {
    const [status, setStatus] = useState(item.status);
    return (
        <Modal title="Cập nhật trạng thái" onClose={onClose}>
            <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="font-semibold text-sm">{item.property?.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.landlord?.fullName} → {item.tenant?.fullName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <button key={k} onClick={() => setStatus(k)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${status === k ? 'border-violet-500 ' + v.badgeCls : 'border-transparent ' + v.badgeCls + ' opacity-50 hover:opacity-80'}`}>
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${v.dotCls}`} />
                            {v.label}
                        </button>
                    ))}
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ Đây là thay đổi admin, sẽ ghi đè trạng thái hiện tại.
                </div>
                <button onClick={() => onSave(item.id, status)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                    <FaCheck size={13} /> Xác nhận
                </button>
            </div>
        </Modal>
    );
}

function ConfirmModal({ title, desc, onConfirm, onClose }: any) {
    return (
        <Modal title={title} onClose={onClose}>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{desc}</p>
            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Hủy</button>
                <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                    <FaTrash size={12} /> Xóa
                </button>
            </div>
        </Modal>
    );
}

export default function AdminContractsPage() {
    const [items, setItems]           = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]             = useState(1);
    const [modal, setModal]           = useState<{ mode: 'view' | 'status' | 'delete'; item: any } | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    const load = useCallback(() => {
        if (!token) return;
        setLoading(true);
        const p = new URLSearchParams({ page: String(page), limit: '10' });
        if (search)       p.set('search', search);
        if (statusFilter) p.set('status', statusFilter);

        fetch(`${API}/api/admin/contracts?${p}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) { setItems(d.data.contracts); setPagination(d.data.pagination); } })
            .finally(() => setLoading(false));
    }, [token, search, statusFilter, page]);

    useEffect(() => { load(); }, [load]);

    const del = async (id: string) => {
        const r = await fetch(`${API}/api/admin/contracts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) { toast.success('Đã xóa hợp đồng'); load(); setModal(null); }
        else toast.error(d.message);
    };

    const updateStatus = async (id: string, status: string) => {
        const r = await fetch(`${API}/api/admin/contracts/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status }),
        });
        const d = await r.json();
        if (d.success) { toast.success('Cập nhật trạng thái thành công'); load(); setModal(null); }
        else toast.error(d.message);
    };

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý hợp đồng</h1>
                <p className="text-sm text-slate-400 mt-0.5">{pagination ? `${pagination.total} hợp đồng` : '—'}</p>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 min-w-52">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm chủ nhà, người thuê, tên phòng..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                </div>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                                        {['Chủ nhà', 'Người thuê', 'Phòng', 'Giá / Tháng', 'Thời hạn', 'Trạng thái', ''].map(h => (
                                            <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {items.map(c => {
                                        const st = STATUS_MAP[c.status] || STATUS_MAP.DRAFT;
                                        return (
                                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-sm">{c.landlord?.fullName}</p>
                                                    <p className="text-xs text-slate-400">{c.landlord?.email}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-sm">{c.tenant?.fullName}</p>
                                                    <p className="text-xs text-slate-400">{c.tenant?.email}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-sm line-clamp-1">{c.property?.title}</p>
                                                    <p className="text-xs text-slate-400">{c.property?.city}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-sm text-violet-600 dark:text-violet-400 whitespace-nowrap">{formatMoney(c.monthlyRent)}</p>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                                                    <p>{formatDate(c.startDate)}</p>
                                                    <p>→ {formatDate(c.endDate)}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.badgeCls}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dotCls}`} />
                                                        {st.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex gap-1.5">
                                                        {[
                                                            { icon: <FaEye size={12} />, cls: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200', onClick: () => setModal({ mode: 'view', item: c }) },
                                                            { icon: <FaEdit size={12} />, cls: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100', onClick: () => setModal({ mode: 'status', item: c }) },
                                                            { icon: <FaTrash size={12} />, cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100', onClick: () => setModal({ mode: 'delete', item: c }) },
                                                        ].map((b, i) => (
                                                            <button key={i} onClick={b.onClick} className={`p-2 rounded-lg transition-colors ${b.cls}`}>{b.icon}</button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-16 text-slate-400">
                                                <p className="text-3xl mb-2">📋</p>
                                                <p className="font-semibold">Không tìm thấy hợp đồng</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

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
                {modal?.mode === 'view'   && <ViewModal   item={modal.item} onClose={() => setModal(null)} />}
                {modal?.mode === 'status' && <StatusModal item={modal.item} onClose={() => setModal(null)} onSave={updateStatus} />}
                {modal?.mode === 'delete' && (
                    <ConfirmModal title="Xóa hợp đồng"
                        desc="Bạn có chắc chắn muốn xóa hợp đồng này? Hành động không thể hoàn tác."
                        onConfirm={() => del(modal.item.id)} onClose={() => setModal(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
