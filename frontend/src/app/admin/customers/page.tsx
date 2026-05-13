'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEdit, FaTrash, FaEye, FaSave, FaTimes, FaBan, FaUnlock, FaChevronDown, FaChevronRight, FaHome, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('vi-VN');
const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ── Modal wrapper ─────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
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
                className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] flex flex-col overflow-hidden`}>
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><FaTimes size={14} /></button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </motion.div>
        </motion.div>
    );
}

// ── Ban modal ─────────────────────────────────────────────────────────
function BanModal({ item, onClose, onConfirm }: any) {
    const [reason, setReason] = useState('');
    return (
        <Modal title={`Khóa tài khoản: ${item.fullName}`} onClose={onClose}>
            <p className="text-sm text-slate-500 mb-4">Nhập lý do khóa tài khoản này. Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                placeholder="VD: Vi phạm điều khoản sử dụng, đăng tin sai sự thật..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none mb-4" />
            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Hủy</button>
                <button onClick={() => onConfirm(item.id, reason)}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                    <FaBan size={12} /> Khóa tài khoản
                </button>
            </div>
        </Modal>
    );
}

// ── User badge ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    return status === 'BANNED'
        ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">🔒 Bị khóa</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">✓ Hoạt động</span>;
}

// ── Landlord tree row ─────────────────────────────────────────────────
function LandlordRow({ landlord, onBan, onUnban }: any) {
    const [expanded, setExpanded] = useState(false);
    const isBanned = landlord.status === 'BANNED';

    return (
        <>
            <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isBanned ? 'opacity-60' : ''}`}>
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setExpanded(v => !v)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400">
                            {expanded ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                        </button>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {landlord.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{landlord.fullName}</p>
                            <p className="text-xs text-slate-400">{landlord.email}</p>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-4"><StatusBadge status={landlord.status} /></td>
                <td className="px-5 py-4 text-sm text-slate-500">{landlord.phone || '—'}</td>
                <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 text-xs font-bold">
                        {landlord._count?.ownedProperties || 0}
                    </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-400">{formatDate(landlord.createdAt)}</td>
                <td className="px-5 py-4">
                    {isBanned
                        ? <button onClick={() => onUnban(landlord.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold hover:bg-green-100 transition-colors">
                            <FaUnlock size={11} /> Mở khóa
                          </button>
                        : <button onClick={() => onBan(landlord)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                            <FaBan size={11} /> Khóa
                          </button>
                    }
                </td>
            </tr>
            {/* Ban reason row */}
            {isBanned && landlord.banReason && (
                <tr className="bg-red-50/50 dark:bg-red-900/10">
                    <td colSpan={6} className="px-5 py-2 text-xs text-red-600 dark:text-red-400">
                        ⚠️ Lý do khóa: {landlord.banReason}
                    </td>
                </tr>
            )}
            {/* Expanded properties */}
            {expanded && landlord.ownedProperties?.map((prop: any) => (
                <tr key={prop.id} className="bg-slate-50/80 dark:bg-slate-800/30">
                    <td colSpan={6} className="pl-16 pr-5 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FaHome className="text-slate-400 shrink-0" size={13} />
                                <div>
                                    <p className="text-sm font-semibold">{prop.title}</p>
                                    <p className="text-xs text-slate-400">{prop.address}, {prop.city}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                    prop.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    prop.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'}`}>
                                    {prop.approvalStatus === 'APPROVED' ? '✓ Đã duyệt' :
                                     prop.approvalStatus === 'REJECTED' ? '✗ Từ chối' : '⏳ Chờ duyệt'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${prop.available ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {prop.available ? 'Còn trống' : 'Đã cho thuê'}
                                </span>
                                {prop.contracts?.[0] && (
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <FaUser size={10} />
                                        <span>{prop.contracts[0].tenant?.fullName}</span>
                                        <span className="text-slate-300">·</span>
                                        <span>{formatMoney(prop.contracts[0].monthlyRent)}/tháng</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
}

// ── Tenant row ────────────────────────────────────────────────────────
function TenantRow({ tenant, onBan, onUnban }: any) {
    const isBanned = tenant.status === 'BANNED';
    const activeContract = tenant.tenantContracts?.[0];

    return (
        <>
            <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isBanned ? 'opacity-60' : ''}`}>
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {tenant.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{tenant.fullName}</p>
                            <p className="text-xs text-slate-400">{tenant.email}</p>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-4"><StatusBadge status={tenant.status} /></td>
                <td className="px-5 py-4 text-sm text-slate-500">{tenant.phone || '—'}</td>
                <td className="px-5 py-4">
                    {activeContract ? (
                        <div className="text-xs">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{activeContract.property?.title}</p>
                            <p className="text-slate-400">{activeContract.property?.city} · {formatMoney(activeContract.monthlyRent)}/tháng</p>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400">Chưa thuê phòng</span>
                    )}
                </td>
                <td className="px-5 py-4 text-xs text-slate-400">{formatDate(tenant.createdAt)}</td>
                <td className="px-5 py-4">
                    {isBanned
                        ? <button onClick={() => onUnban(tenant.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold hover:bg-green-100 transition-colors">
                            <FaUnlock size={11} /> Mở khóa
                          </button>
                        : <button onClick={() => onBan(tenant)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                            <FaBan size={11} /> Khóa
                          </button>
                    }
                </td>
            </tr>
            {isBanned && tenant.banReason && (
                <tr className="bg-red-50/50 dark:bg-red-900/10">
                    <td colSpan={6} className="px-5 py-2 text-xs text-red-600 dark:text-red-400">
                        ⚠️ Lý do khóa: {tenant.banReason}
                    </td>
                </tr>
            )}
        </>
    );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function AdminCustomersPage() {
    const [tab, setTab] = useState<'landlords' | 'tenants'>('landlords');
    const [items, setItems] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [banModal, setBanModal] = useState<any>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    const load = useCallback(() => {
        if (!token) return;
        setLoading(true);
        const p = new URLSearchParams({ page: String(page), limit: '10' });
        if (search) p.set('search', search);
        if (statusFilter) p.set('status', statusFilter);

        const endpoint = tab === 'landlords' ? 'landlords' : 'tenants';
        fetch(`${API}/api/admin/${endpoint}?${p}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setItems(d.data[tab === 'landlords' ? 'landlords' : 'tenants'] || []);
                    setPagination(d.data.pagination);
                }
            })
            .finally(() => setLoading(false));
    }, [token, tab, search, statusFilter, page]);

    useEffect(() => { setPage(1); setItems([]); }, [tab]);
    useEffect(() => { load(); }, [load]);

    const handleBan = async (id: string, reason: string) => {
        const r = await fetch(`${API}/api/admin/users/${id}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ reason }),
        });
        const d = await r.json();
        if (d.success) { toast.success(d.message); load(); setBanModal(null); }
        else toast.error(d.message);
    };

    const handleUnban = async (id: string) => {
        const r = await fetch(`${API}/api/admin/users/${id}/unban`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (d.success) { toast.success(d.message); load(); }
        else toast.error(d.message);
    };

    const landlordHeaders = ['Chủ nhà', 'Trạng thái', 'SĐT', 'Số phòng', 'Tham gia', 'Hành động'];
    const tenantHeaders   = ['Người thuê', 'Trạng thái', 'SĐT', 'Đang thuê', 'Tham gia', 'Hành động'];

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý tài khoản</h1>
                <p className="text-sm text-slate-400 mt-0.5">{pagination ? `${pagination.total} người dùng` : '—'}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-800 w-fit">
                {([['landlords', '🏢 Chủ nhà'], ['tenants', '🏠 Người thuê']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === key
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 min-w-52">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder={tab === 'landlords' ? 'Tìm chủ nhà...' : 'Tìm người thuê...'}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                </div>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="BANNED">Bị khóa</option>
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}</div>
            ) : (
                <>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                                        {(tab === 'landlords' ? landlordHeaders : tenantHeaders).map(h => (
                                            <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {items.map(item =>
                                        tab === 'landlords'
                                            ? <LandlordRow key={item.id} landlord={item} onBan={setBanModal} onUnban={handleUnban} />
                                            : <TenantRow   key={item.id} tenant={item}   onBan={setBanModal} onUnban={handleUnban} />
                                    )}
                                    {items.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                                            <p className="text-3xl mb-2">{tab === 'landlords' ? '🏢' : '🏠'}</p>
                                            <p className="font-semibold">Không tìm thấy người dùng</p>
                                        </td></tr>
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
                {banModal && <BanModal item={banModal} onClose={() => setBanModal(null)} onConfirm={handleBan} />}
            </AnimatePresence>
        </div>
    );
}
