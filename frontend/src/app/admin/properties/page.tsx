'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaEdit, FaTrash, FaEye, FaSave,
    FaTimes, FaBed, FaBath, FaPlus
} from 'react-icons/fa';
import { MdApartment, MdHouse, MdHotel } from 'react-icons/md';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;

const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('vi-VN');

const TYPE_MAP: Record<string, string> = {
    ROOM: 'Phòng trọ', APARTMENT: 'Căn hộ', HOUSE: 'Nhà nguyên căn', HOTEL: 'Khách sạn',
};

// ─── Modal wrapper ────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <FaTimes size={14} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </motion.div>
        </motion.div>
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

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function Input({ value, onChange, type = 'text', placeholder = '' }: any) {
    return (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
    );
}

function Select({ value, onChange, children }: any) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all">
            {children}
        </select>
    );
}

// ─── View Modal ───────────────────────────────────────────────────────
function ViewModal({ item, onClose }: any) {
    const rows = [
        { label: 'Tiêu đề', value: item.title },
        { label: 'Loại phòng', value: TYPE_MAP[item.type] || item.type },
        { label: 'Địa chỉ', value: `${item.address}, ${item.ward}, ${item.district}, ${item.city}` },
        { label: 'Giá thuê', value: formatMoney(item.price) },
        { label: 'Đặt cọc', value: formatMoney(item.deposit) },
        ...(item.area ? [{ label: 'Diện tích', value: `${item.area} m²` }] : []),
        ...(item.bedrooms ? [{ label: 'Phòng ngủ', value: item.bedrooms }] : []),
        ...(item.bathrooms ? [{ label: 'Phòng tắm', value: item.bathrooms }] : []),
        { label: 'Tình trạng', value: item.available ? '✅ Còn trống' : '🔴 Đã thuê' },
        { label: 'Chủ sở hữu', value: `${item.owner?.fullName} (${item.owner?.email})` },
        { label: 'Hợp đồng', value: `${item._count?.contracts || 0} hợp đồng` },
        { label: 'Ngày đăng', value: formatDate(item.createdAt) },
        ...(item.description ? [{ label: 'Mô tả', value: item.description }] : []),
    ];
    return (
        <Modal title="Chi tiết phòng" onClose={onClose}>
            <div className="space-y-3">
                {rows.map(r => (
                    <div key={r.label} className="flex justify-between gap-4 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <span className="text-xs text-slate-500 font-medium shrink-0">{r.label}</span>
                        <span className="text-sm font-semibold text-right">{r.value}</span>
                    </div>
                ))}
            </div>
        </Modal>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────
function EditModal({ item, onClose, onSave }: any) {
    const [form, setForm] = useState({
        title: item.title || '',
        address: item.address || '',
        city: item.city || '',
        district: item.district || '',
        ward: item.ward || '',
        type: item.type || 'ROOM',
        price: item.price || 0,
        deposit: item.deposit || 0,
        area: item.area || '',
        bedrooms: item.bedrooms || '',
        bathrooms: item.bathrooms || '',
        available: item.available ?? true,
        description: item.description || '',
    });
    const set = (key: string) => (v: any) => setForm(f => ({ ...f, [key]: v }));

    return (
        <Modal title={item.id ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'} onClose={onClose}>
            <div className="space-y-4">
                <FormRow label="Tiêu đề *"><Input value={form.title} onChange={set('title')} placeholder="VD: Phòng trọ đầy đủ nội thất" /></FormRow>

                <div className="grid grid-cols-2 gap-3">
                    <FormRow label="Loại phòng *">
                        <Select value={form.type} onChange={set('type')}>
                            <option value="ROOM">Phòng trọ</option>
                            <option value="APARTMENT">Căn hộ</option>
                            <option value="HOUSE">Nhà nguyên căn</option>
                            <option value="HOTEL">Khách sạn</option>
                        </Select>
                    </FormRow>
                    <FormRow label="Tình trạng">
                        <Select value={String(form.available)} onChange={(v: string) => setForm(f => ({ ...f, available: v === 'true' }))}>
                            <option value="true">Còn trống</option>
                            <option value="false">Đã cho thuê</option>
                        </Select>
                    </FormRow>
                </div>

                <FormRow label="Địa chỉ *"><Input value={form.address} onChange={set('address')} placeholder="Số nhà, tên đường" /></FormRow>

                <div className="grid grid-cols-3 gap-3">
                    <FormRow label="Thành phố *"><Input value={form.city} onChange={set('city')} placeholder="Hà Nội" /></FormRow>
                    <FormRow label="Quận/Huyện *"><Input value={form.district} onChange={set('district')} placeholder="Cầu Giấy" /></FormRow>
                    <FormRow label="Phường/Xã *"><Input value={form.ward} onChange={set('ward')} placeholder="Dịch Vọng" /></FormRow>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <FormRow label="Giá thuê (VNĐ) *"><Input type="number" value={form.price} onChange={(v: string) => setForm(f => ({ ...f, price: Number(v) }))} /></FormRow>
                    <FormRow label="Đặt cọc (VNĐ) *"><Input type="number" value={form.deposit} onChange={(v: string) => setForm(f => ({ ...f, deposit: Number(v) }))} /></FormRow>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <FormRow label="Diện tích (m²)"><Input type="number" value={form.area} onChange={set('area')} /></FormRow>
                    <FormRow label="Phòng ngủ"><Input type="number" value={form.bedrooms} onChange={set('bedrooms')} /></FormRow>
                    <FormRow label="Phòng tắm"><Input type="number" value={form.bathrooms} onChange={set('bathrooms')} /></FormRow>
                </div>

                <FormRow label="Mô tả">
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none transition-all" />
                </FormRow>

                <button onClick={() => onSave(item.id, form)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-900/30 transition-all">
                    <FaSave size={14} /> Lưu thay đổi
                </button>
            </div>
        </Modal>
    );
}

// ─── Main component ───────────────────────────────────────────────────
export default function AdminPropertiesPage() {
    const [items, setItems]           = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [availFilter, setAvailFilter] = useState('');
    const [page, setPage]             = useState(1);
    const [modal, setModal]           = useState<{ mode: 'view' | 'edit' | 'delete' | 'create'; item?: any } | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    const load = useCallback(() => {
        if (!token) return;
        setLoading(true);
        const p = new URLSearchParams({ page: String(page), limit: '9' });
        if (search)      p.set('search', search);
        if (typeFilter)  p.set('type', typeFilter);
        if (availFilter) p.set('available', availFilter);

        fetch(`${API}/api/admin/properties?${p}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) { setItems(d.data.properties); setPagination(d.data.pagination); } })
            .finally(() => setLoading(false));
    }, [token, search, typeFilter, availFilter, page]);

    useEffect(() => { load(); }, [load]);

    const del = async (id: string) => {
        const r = await fetch(`${API}/api/admin/properties/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) { toast.success('Đã xóa phòng'); load(); setModal(null); }
        else toast.error(d.message);
    };

    const save = async (id: string | undefined, body: any) => {
        const url    = id ? `${API}/api/admin/properties/${id}` : `${API}/api/admin/properties`;
        const method = id ? 'PUT' : 'POST';
        const r = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
        const d = await r.json();
        if (d.success) { toast.success(id ? 'Cập nhật thành công' : 'Thêm phòng thành công'); load(); setModal(null); }
        else toast.error(d.message);
    };

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Danh sách phòng</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {pagination ? `${pagination.total} phòng tổng cộng` : '—'}
                    </p>
                </div>
                <button onClick={() => setModal({ mode: 'create', item: {} })}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-violet-900/20 transition-all">
                    <FaPlus size={12} /> Thêm phòng
                </button>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 min-w-52">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm theo tên, địa chỉ, thành phố..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                </div>
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="">Tất cả loại</option>
                    <option value="ROOM">Phòng trọ</option>
                    <option value="APARTMENT">Căn hộ</option>
                    <option value="HOUSE">Nhà nguyên căn</option>
                    <option value="HOTEL">Khách sạn</option>
                </select>
                <select value={availFilter} onChange={e => { setAvailFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="">Tất cả tình trạng</option>
                    <option value="true">Còn trống</option>
                    <option value="false">Đã cho thuê</option>
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {items.map((p, i) => (
                            <motion.div key={p.id}
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">

                                {/* Color header strip */}
                                <div className={`h-1.5 w-full ${p.available ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-slate-300 to-slate-400'}`} />

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.available ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                            {p.available ? '● Còn trống' : '● Đã thuê'}
                                        </span>
                                        <span className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                                            {TYPE_MAP[p.type] || p.type}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 line-clamp-1">{p.title}</h3>
                                    <p className="text-xs text-slate-400 mb-3 line-clamp-1">📍 {p.address}, {p.city}</p>

                                    <div className="flex gap-3 text-xs text-slate-500 mb-3">
                                        {p.bedrooms  && <span className="flex items-center gap-1"><FaBed size={10} /> {p.bedrooms} phòng ngủ</span>}
                                        {p.bathrooms && <span className="flex items-center gap-1">🚿 {p.bathrooms} WC</span>}
                                        {p.area      && <span>📐 {p.area}m²</span>}
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <p className="font-bold text-violet-600 dark:text-violet-400">{formatMoney(p.price)}<span className="text-xs font-normal text-slate-400">/tháng</span></p>
                                        <p className="text-xs text-slate-400">{p._count?.contracts || 0} hợp đồng</p>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                                        <button onClick={() => setModal({ mode: 'view', item: p })}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                            <FaEye size={11} /> Xem
                                        </button>
                                        <button onClick={() => setModal({ mode: 'edit', item: p })}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors">
                                            <FaEdit size={11} /> Sửa
                                        </button>
                                        <button onClick={() => setModal({ mode: 'delete', item: p })}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-colors">
                                            <FaTrash size={11} /> Xóa
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {items.length === 0 && (
                            <div className="col-span-3 text-center py-20 text-slate-400">
                                <p className="text-4xl mb-3">🏠</p>
                                <p className="font-semibold">Không tìm thấy phòng nào</p>
                                <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                ← Trước
                            </button>
                            <span className="text-sm text-slate-500 px-3">Trang {page}/{pagination.totalPages}</span>
                            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            <AnimatePresence>
                {modal?.mode === 'view'   && <ViewModal item={modal.item} onClose={() => setModal(null)} />}
                {(modal?.mode === 'edit' || modal?.mode === 'create') && (
                    <EditModal item={modal.item} onClose={() => setModal(null)} onSave={save} />
                )}
                {modal?.mode === 'delete' && (
                    <ConfirmModal
                        title="Xóa phòng"
                        desc={`Bạn có chắc chắn muốn xóa phòng "${modal.item?.title}"? Hành động không thể hoàn tác.`}
                        onConfirm={() => del(modal.item.id)}
                        onClose={() => setModal(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
