'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEdit, FaTrash, FaEye, FaSave, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('vi-VN');

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
    return (
        <Modal title="Chi tiết khách hàng" onClose={onClose}>
            <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black mb-3">
                    {item.fullName?.[0]?.toUpperCase()}
                </div>
                <h3 className="font-bold text-lg">{item.fullName}</h3>
                <span className={`mt-1.5 px-3 py-1 rounded-full text-xs font-semibold ${item.role === 'LANDLORD' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {item.role === 'LANDLORD' ? '🏢 Chủ nhà' : '🏠 Người thuê'}
                </span>
            </div>
            <div className="space-y-2.5">
                {[
                    { label: 'Email', value: item.email },
                    { label: 'Số điện thoại', value: item.phone || '—' },
                    { label: 'Tham gia', value: formatDate(item.createdAt) },
                    { label: 'Ví blockchain', value: item.walletAddress ? `${item.walletAddress.slice(0, 10)}...${item.walletAddress.slice(-8)}` : '—' },
                ].map(row => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <span className="text-xs text-slate-500">{row.label}</span>
                        <span className="text-sm font-semibold">{row.value}</span>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                    { label: 'Phòng sở hữu', value: item._count?.ownedProperties || 0, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                    { label: 'HĐ chủ nhà', value: item._count?.landlordContracts || 0, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
                    { label: 'HĐ người thuê', value: item._count?.tenantContracts || 0, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
                ].map(s => (
                    <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                        <p className="text-2xl font-black">{s.value}</p>
                        <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
                    </div>
                ))}
            </div>
        </Modal>
    );
}

function EditModal({ item, onClose, onSave }: any) {
    const [form, setForm] = useState({
        fullName: item.fullName || '',
        phone: item.phone || '',
        role: item.role || 'TENANT',
    });
    return (
        <Modal title="Chỉnh sửa khách hàng" onClose={onClose}>
            <div className="space-y-4">
                {[
                    { label: 'Họ tên', key: 'fullName', placeholder: 'Nguyễn Văn A' },
                    { label: 'Số điện thoại', key: 'phone', placeholder: '0912345678' },
                ].map(f => (
                    <div key={f.key}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">{f.label}</label>
                        <input value={(form as any)[f.key]} placeholder={f.placeholder}
                            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                    </div>
                ))}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Vai trò</label>
                    <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none">
                        <option value="TENANT">🏠 Người thuê</option>
                        <option value="LANDLORD">🏢 Chủ nhà</option>
                    </select>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ Email không thể thay đổi. Chỉ admin mới có quyền đổi vai trò.
                </div>
                <button onClick={() => onSave(item.id, form)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-900/30 transition-all">
                    <FaSave size={14} /> Lưu thay đổi
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

export default function AdminCustomersPage() {
    const [items, setItems]           = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage]             = useState(1);
    const [modal, setModal]           = useState<{ mode: 'view' | 'edit' | 'delete'; item: any } | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    const load = useCallback(() => {
        if (!token) return;
        setLoading(true);
        const p = new URLSearchParams({ page: String(page), limit: '10' });
        if (search)     p.set('search', search);
        if (roleFilter) p.set('role', roleFilter);

        fetch(`${API}/api/admin/users?${p}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) { setItems(d.data.users); setPagination(d.data.pagination); } })
            .finally(() => setLoading(false));
    }, [token, search, roleFilter, page]);

    useEffect(() => { load(); }, [load]);

    const del = async (id: string) => {
        const r = await fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) { toast.success('Đã xóa người dùng'); load(); setModal(null); }
        else toast.error(d.message);
    };

    const save = async (id: string, body: any) => {
        const r = await fetch(`${API}/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
        const d = await r.json();
        if (d.success) { toast.success('Cập nhật thành công'); load(); setModal(null); }
        else toast.error(d.message);
    };

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý khách hàng</h1>
                <p className="text-sm text-slate-400 mt-0.5">{pagination ? `${pagination.total} người dùng` : '—'}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 min-w-52">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm tên, email, số điện thoại..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                </div>
                <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="">Tất cả vai trò</option>
                    <option value="LANDLORD">Chủ nhà</option>
                    <option value="TENANT">Người thuê</option>
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
                                        {['Người dùng', 'Vai trò', 'SĐT', 'Phòng', 'Hợp đồng', 'Tham gia', ''].map(h => (
                                            <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {items.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                        {u.fullName?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{u.fullName}</p>
                                                        <p className="text-xs text-slate-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'LANDLORD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                                                    {u.role === 'LANDLORD' ? '🏢 Chủ nhà' : '🏠 Người thuê'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{u.phone || '—'}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                                    {u._count?.ownedProperties || 0}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold">
                                                    {(u._count?.landlordContracts || 0) + (u._count?.tenantContracts || 0)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-400">{formatDate(u.createdAt)}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-1.5">
                                                    {[
                                                        { icon: <FaEye size={12} />, cls: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200', onClick: () => setModal({ mode: 'view', item: u }) },
                                                        { icon: <FaEdit size={12} />, cls: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100', onClick: () => setModal({ mode: 'edit', item: u }) },
                                                        { icon: <FaTrash size={12} />, cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100', onClick: () => setModal({ mode: 'delete', item: u }) },
                                                    ].map((b, i) => (
                                                        <button key={i} onClick={b.onClick} className={`p-2 rounded-lg transition-colors ${b.cls}`}>{b.icon}</button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-16 text-slate-400">
                                                <p className="text-3xl mb-2">👥</p>
                                                <p className="font-semibold">Không tìm thấy người dùng</p>
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
                {modal?.mode === 'edit'   && <EditModal   item={modal.item} onClose={() => setModal(null)} onSave={save} />}
                {modal?.mode === 'delete' && (
                    <ConfirmModal title="Xóa người dùng"
                        desc={`Xóa tài khoản "${modal.item.fullName}"? Hành động không thể hoàn tác.`}
                        onConfirm={() => del(modal.item.id)} onClose={() => setModal(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
