'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFileContract, FaCheckCircle, FaClock, FaTimesCircle, FaBell, FaRedo, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Contract {
    id: string;
    property: { title: string; address: string };
    landlord: { fullName: string };
    tenant: { fullName: string };
    startDate: string;
    endDate: string;
    monthlyRent: number;
    deposit: number;
    status: string;
    signedAt: string | null;
}

// ── Tính số ngày còn lại đến endDate ──────────────────────────────────
function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

// ── Modal gia hạn hợp đồng ────────────────────────────────────────────
function RenewModal({
    contract,
    onClose,
    onSuccess,
}: {
    contract: Contract;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const minDate = new Date(contract.endDate);
    minDate.setDate(minDate.getDate() + 2);
    const minDateStr = minDate.toISOString().split('T')[0];

    // Default: gia hạn thêm 12 tháng
    const defaultEnd = new Date(contract.endDate);
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
    const defaultEndStr = defaultEnd.toISOString().split('T')[0];

    const [newEndDate, setNewEndDate] = useState(defaultEndStr);
    const [submitting, setSubmitting] = useState(false);

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
                toast.error(data.message || 'Lỗi khi gửi yêu cầu gia hạn');
            }
        } catch {
            toast.error('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-2 text-white">
                        <FaRedo size={16} />
                        <h3 className="font-bold text-lg">Gia hạn hợp đồng</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <FaTimes size={14} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Info */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="font-semibold text-sm text-blue-800 dark:text-blue-200">{contract.property.title}</p>
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            Hợp đồng hiện tại đến: {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                        </p>
                    </div>

                    {/* Chọn ngày gia hạn */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Ngày kết thúc mới
                        </label>
                        <input
                            type="date"
                            value={newEndDate}
                            min={minDateStr}
                            onChange={e => setNewEndDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-400 mt-1.5">
                            Thời gian gia hạn: {newEndDate ? Math.ceil((new Date(newEndDate).getTime() - new Date(contract.endDate).getTime()) / 86400000 / 30) : 0} tháng
                        </p>
                    </div>

                    {/* Thông báo */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                        ℹ️ Yêu cầu gia hạn sẽ tạo một hợp đồng mới ở trạng thái <strong>Bản nháp</strong>. Chủ nhà sẽ cần xem xét và ký tên.
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            Hủy bỏ
                        </button>
                        <button onClick={handleRenew} disabled={submitting}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {submitting ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <FaRedo size={12} />
                            )}
                            {submitting ? 'Đang gửi...' : 'Xác nhận gia hạn'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Banner cảnh báo sắp hết hạn ───────────────────────────────────────
function ExpiryWarningBanner({
    contract,
    daysLeft,
    onRenew,
    onDismiss,
}: {
    contract: Contract;
    daysLeft: number;
    onRenew: () => void;
    onDismiss: () => void;
}) {
    const isExpired = daysLeft < 0;
    const isUrgent = daysLeft <= 7;

    return (
        <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className={`relative rounded-2xl p-5 border-2 shadow-lg overflow-hidden ${isExpired
                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                : isUrgent
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                    : 'bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-700'
                }`}
        >
            {/* Decorative background */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${isExpired ? 'bg-red-400' : isUrgent ? 'bg-orange-400' : 'bg-amber-400'}`} />

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icon + text */}
                <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2.5 rounded-xl shrink-0 ${isExpired ? 'bg-red-100 dark:bg-red-800/50 text-red-600' : isUrgent ? 'bg-orange-100 dark:bg-orange-800/50 text-orange-600' : 'bg-amber-100 dark:bg-amber-800/50 text-amber-600'}`}>
                        <FaBell size={18} />
                    </div>
                    <div>
                        <p className={`font-bold text-sm ${isExpired ? 'text-red-700 dark:text-red-300' : isUrgent ? 'text-orange-700 dark:text-orange-300' : 'text-amber-700 dark:text-amber-300'}`}>
                            {isExpired
                                ? '⚠️ Hợp đồng đã hết hạn!'
                                : isUrgent
                                    ? `🔔 Hợp đồng hết hạn sau ${daysLeft} ngày!`
                                    : `📅 Hợp đồng sắp hết hạn (còn ${daysLeft} ngày)`}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            <strong>{contract.property.title}</strong> — Ngày hết hạn: {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            {isExpired
                                ? 'Hợp đồng này đã hết hạn. Bạn có muốn gia hạn để tiếp tục thuê phòng không?'
                                : 'Bạn có muốn gia hạn hợp đồng để tiếp tục thuê phòng không?'}
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={onRenew}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all ${isExpired ? 'bg-red-600 hover:bg-red-700' : isUrgent ? 'bg-orange-600 hover:bg-orange-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                    >
                        <FaRedo size={11} /> Gia hạn
                    </button>
                    <button
                        onClick={onDismiss}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <FaTimes size={11} /> Không
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function ContractsPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [renewTarget, setRenewTarget] = useState<Contract | null>(null);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập');
            router.push('/auth/login');
            return;
        }
        fetchContracts(token);
    }, [router]);

    const fetchContracts = async (token: string) => {
        try {
            const res = await fetch(`${API}/api/contracts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setContracts(data.data.contracts);
        } catch {
            toast.error('Lỗi khi tải hợp đồng');
        } finally {
            setLoading(false);
        }
    };

    const reload = () => {
        const token = localStorage.getItem('token') || '';
        if (token) fetchContracts(token);
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string; icon: any }> = {
            DRAFT:      { label: 'Nháp',             className: 'badge badge-info',    icon: FaClock },
            PENDING:    { label: 'Chờ ký',           className: 'badge badge-warning', icon: FaClock },
            SIGNED:     { label: 'Đã ký',            className: 'badge badge-success', icon: FaCheckCircle },
            ACTIVE:     { label: 'Đang hoạt động',  className: 'badge badge-success', icon: FaCheckCircle },
            EXPIRED:    { label: 'Hết hạn',          className: 'badge badge-error',   icon: FaTimesCircle },
            TERMINATED: { label: 'Đã hủy',           className: 'badge badge-error',   icon: FaTimesCircle },
        };
        return badges[status] || badges.DRAFT;
    };

    // Hợp đồng cần hiện banner cảnh báo: ACTIVE còn ≤30 ngày HOẶC EXPIRED chưa dismiss
    const warningContracts = contracts.filter(c => {
        if (dismissedIds.has(c.id)) return false;
        if (c.status === 'EXPIRED') return true;
        if (c.status === 'ACTIVE') return daysUntil(c.endDate) <= 30;
        return false;
    });

    const filteredContracts = filter === 'ALL' ? contracts : contracts.filter(c => c.status === filter);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <main className="flex-1 container mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-4">Quản Lý Hợp Đồng</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Theo dõi và quản lý các hợp đồng thuê phòng của bạn
                </p>
            </div>

            {/* ── Banners cảnh báo hết hạn ──────────────────────────── */}
            <AnimatePresence>
                {warningContracts.length > 0 && (
                    <div className="space-y-3 mb-8">
                        {warningContracts.map(c => (
                            <ExpiryWarningBanner
                                key={c.id}
                                contract={c}
                                daysLeft={daysUntil(c.endDate)}
                                onRenew={() => setRenewTarget(c)}
                                onDismiss={() => setDismissedIds(prev => new Set([...prev, c.id]))}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-8 justify-center">
                {['ALL', 'DRAFT', 'PENDING', 'SIGNED', 'ACTIVE', 'EXPIRED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${filter === status
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        {status === 'ALL' ? 'Tất cả' :
                            status === 'DRAFT' ? 'Nháp' :
                                status === 'PENDING' ? 'Chờ ký' :
                                    status === 'SIGNED' ? 'Đã ký' :
                                        status === 'ACTIVE' ? 'Đang hoạt động' :
                                            status === 'EXPIRED' ? 'Hết hạn' : 'Đã hủy'}
                    </button>
                ))}
            </div>

            {/* Contracts List */}
            {filteredContracts.length === 0 ? (
                <div className="text-center py-12">
                    <FaFileContract className="text-6xl text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Chưa có hợp đồng nào</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredContracts.map((contract, index) => {
                        const statusInfo = getStatusBadge(contract.status);
                        const StatusIcon = statusInfo.icon;
                        const days = daysUntil(contract.endDate);
                        const showExpirySoon = contract.status === 'ACTIVE' && days <= 30 && days >= 0;

                        return (
                            <Link href={`/contracts/${contract.id}`} key={contract.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.07 }}
                                    className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                                >
                                    {/* Sắp hết hạn: viền cảnh báo */}
                                    {showExpirySoon && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                                    )}

                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        {/* Left */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold">{contract.property.title}</h3>
                                                <span className={statusInfo.className}>
                                                    <StatusIcon className="inline mr-1" />
                                                    {statusInfo.label}
                                                </span>
                                                {showExpirySoon && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-0.5 rounded-full font-semibold">
                                                        ⏰ Còn {days} ngày
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                📍 {contract.property.address}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                <div><span className="font-semibold">Chủ nhà:</span> {contract.landlord.fullName}</div>
                                                <div><span className="font-semibold">Người thuê:</span> {contract.tenant.fullName}</div>
                                            </div>
                                        </div>

                                        {/* Right */}
                                        <div className="text-right">
                                            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                                                {formatPrice(contract.monthlyRent)}
                                            </p>
                                            <p className="text-xs text-slate-500 mb-2">/ tháng</p>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                                <p>Từ: {formatDate(contract.startDate)}</p>
                                                <p>Đến: {formatDate(contract.endDate)}</p>
                                            </div>
                                            {contract.signedAt && (
                                                <p className="text-xs text-green-600 mt-2">
                                                    Ký: {formatDate(contract.signedAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Modal gia hạn */}
            <AnimatePresence>
                {renewTarget && (
                    <RenewModal
                        contract={renewTarget}
                        onClose={() => setRenewTarget(null)}
                        onSuccess={reload}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
