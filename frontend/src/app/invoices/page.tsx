'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoneyBillWave, FaTimes, FaCheckCircle, FaQrcode, FaCopy, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;

const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (d: string | Date | null) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—';

// Danh sách ngân hàng phổ biến VietQR hỗ trợ
const BANK_LIST: Record<string, string> = {
    MB:    'MB Bank',
    VCB:   'Vietcombank',
    TCB:   'Techcombank',
    ACB:   'ACB',
    VPB:   'VPBank',
    BIDV:  'BIDV',
    VTB:   'Vietinbank',
    TPB:   'TPBank',
    STB:   'Sacombank',
    MSB:   'MSB',
    OCB:   'OCB',
    SHB:   'SHB',
    HDB:   'HDBank',
    VIB:   'VIB',
    SEAB:  'SeABank',
    NAB:   'Nam A Bank',
    CAKE:  'CAKE',
    UBANK: 'Ubank',
};

/**
 * Tạo URL QR VietQR (miễn phí, không cần API key)
 * Format: https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png?amount={amount}&addInfo={info}&accountName={name}
 */
function buildVietQRUrl(bankId: string, accountNo: string, amount: number, info: string, accountName: string) {
    const encoded = encodeURIComponent(info);
    const name    = encodeURIComponent(accountName);
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${Math.round(amount)}&addInfo=${encoded}&accountName=${name}`;
}

// ── Payment Modal ─────────────────────────────────────────────────────
function PaymentModal({ invoice, onClose, onPaid }: { invoice: any; onClose: () => void; onPaid: () => void }) {
    const [paying, setPaying] = useState(false);
    const [qrError, setQrError] = useState(false);

    const landlord   = invoice.contract?.landlord;
    const bankId     = landlord?.bankName?.toUpperCase() || '';
    const accountNo  = landlord?.bankAccount || '';
    const hasBank    = bankId && accountNo;
    const payInfo    = `Thanh toan tien nha T${invoice.month}/${invoice.year} ${invoice.contract?.property?.title || ''}`.slice(0, 50);
    const qrUrl      = hasBank ? buildVietQRUrl(bankId, accountNo, invoice.amount, payInfo, landlord?.fullName || '') : '';

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Đã sao chép ${label}`);
    };

    const handlePaid = async () => {
        setPaying(true);
        try {
            const token = localStorage.getItem('token');
            const r = await fetch(`${API}/api/invoices/${invoice.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: 'PAID' }),
            });
            const d = await r.json();
            if (d.success) {
                toast.success('Đã xác nhận thanh toán! ✅');
                onPaid();
                onClose();
            } else {
                toast.error(d.message || 'Lỗi khi cập nhật');
            }
        } catch {
            toast.error('Lỗi kết nối server');
        } finally {
            setPaying(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
                className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                        <FaTimes size={14} />
                    </button>
                    <FaQrcode className="mx-auto mb-2 opacity-80" size={28} />
                    <h3 className="font-bold text-lg">Thanh toán tiền phòng</h3>
                    <p className="text-violet-200 text-sm mt-0.5">
                        Tháng {invoice.month}/{invoice.year} · {invoice.contract?.property?.title}
                    </p>
                </div>

                <div className="p-5 space-y-4">
                    {/* Amount */}
                    <div className="text-center py-3 bg-violet-50 dark:bg-violet-900/20 rounded-2xl">
                        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-semibold">Số tiền cần thanh toán</p>
                        <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{fmt(invoice.amount)}</p>
                    </div>

                    {/* QR Code */}
                    {hasBank ? (
                        <div className="flex flex-col items-center">
                            {!qrError ? (
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 inline-block">
                                    <img
                                        src={qrUrl}
                                        alt="QR chuyển khoản"
                                        className="w-52 h-52 object-contain"
                                        onError={() => setQrError(true)}
                                    />
                                </div>
                            ) : (
                                <div className="w-52 h-52 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <FaQrcode size={40} />
                                    <p className="text-xs text-center px-4">Không tải được QR. Vui lòng chuyển khoản thủ công.</p>
                                </div>
                            )}
                            <p className="text-xs text-slate-400 mt-2">Quét mã QR bằng app ngân hàng</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-700">
                            <FaExclamationTriangle className="text-amber-500 shrink-0" />
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Chủ nhà chưa cập nhật thông tin ngân hàng. Vui lòng liên hệ trực tiếp để thanh toán.
                            </p>
                        </div>
                    )}

                    {/* Bank info */}
                    {hasBank && (
                        <div className="space-y-2 text-sm">
                            {[
                                { label: 'Ngân hàng',    value: BANK_LIST[bankId] || bankId },
                                { label: 'Số tài khoản', value: accountNo,                   copy: true },
                                { label: 'Chủ tài khoản',value: landlord?.fullName || '—' },
                                { label: 'Số tiền',      value: fmt(invoice.amount),          copy: true, copyVal: String(Math.round(invoice.amount)) },
                                { label: 'Nội dung CK',  value: payInfo,                      copy: true },
                            ].map((row, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    <span className="text-slate-400 text-xs shrink-0">{row.label}</span>
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className="font-semibold text-right text-xs">{row.value}</span>
                                        {row.copy && (
                                            <button onClick={() => copy(row.copyVal || row.value, row.label)}
                                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-violet-600 transition-colors">
                                                <FaCopy size={11} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Confirm button */}
                    <button onClick={handlePaid} disabled={paying}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {paying ? (
                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</>
                        ) : (
                            <><FaCheckCircle /> Tôi đã chuyển khoản xong</>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        Bấm xác nhận sau khi đã chuyển khoản thành công
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function TenantInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [modal, setModal]       = useState<any | null>(null);
    const [user, setUser]         = useState<any>(null);

    const loadData = useCallback(() => {
        const token    = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) { setLoading(false); return; }

        const u = JSON.parse(userData);
        setUser(u);

        fetch(`${API}/api/invoices?tenantId=${u.id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setInvoices(d.data.invoices); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const unpaid   = invoices.filter(i => i.status !== 'PAID');
    const paid     = invoices.filter(i => i.status === 'PAID');
    const totalOwed = unpaid.reduce((s, i) => s + i.amount, 0);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Thanh toán tiền phòng</h1>
                <p className="text-slate-500">Xem và thanh toán hóa đơn tiền phòng hàng tháng của bạn.</p>
            </div>

            {!user && !loading && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-sm">
                    <p className="text-slate-500">Bạn cần đăng nhập để xem danh sách hóa đơn.</p>
                </div>
            )}

            {user && (
                loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className="font-bold text-xl mb-2">Không có hóa đơn nào</h3>
                        <p className="text-slate-500">Hiện tại bạn chưa có hóa đơn nào!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary */}
                        {unpaid.length > 0 && (
                            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center justify-between">
                                <div>
                                    <p className="text-violet-200 text-sm font-medium">Tổng cần thanh toán</p>
                                    <p className="text-3xl font-black mt-1">{fmt(totalOwed)}</p>
                                    <p className="text-violet-200 text-xs mt-1">{unpaid.length} hóa đơn chưa đóng</p>
                                </div>
                                <FaMoneyBillWave size={48} className="opacity-20" />
                            </div>
                        )}

                        {/* Unpaid invoices */}
                        {unpaid.length > 0 && (
                            <div>
                                <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                                    Chưa thanh toán ({unpaid.length})
                                </h2>
                                <div className="space-y-3">
                                    {unpaid.map(inv => {
                                        const isOverdue = new Date(inv.dueDate) < new Date();
                                        return (
                                            <motion.div key={inv.id}
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md ${
                                                    isOverdue ? 'border-red-200 dark:border-red-800' : 'border-slate-100 dark:border-slate-800'
                                                }`}>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex gap-4 items-center">
                                                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                                                            isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                                                        }`}>
                                                            <span className="text-xs font-bold uppercase">T</span>
                                                            <span className="text-xl font-black leading-none">{inv.month}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold">{inv.contract?.property?.title}</h3>
                                                            <p className="text-sm text-slate-500">Chủ nhà: {inv.contract?.landlord?.fullName}</p>
                                                            <p className={`text-xs mt-0.5 font-semibold ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                                                {isOverdue ? '⚠️ Quá hạn: ' : 'Hạn: '}{formatDate(inv.dueDate)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-400">Số tiền</p>
                                                            <p className="font-black text-xl text-violet-600 dark:text-violet-400">{fmt(inv.amount)}</p>
                                                        </div>
                                                        <button onClick={() => setModal(inv)}
                                                            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
                                                            <FaQrcode size={14} /> Thanh toán
                                                        </button>
                                                    </div>
                                                </div>
                                                {inv.description && (
                                                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">{inv.description}</p>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Paid invoices */}
                        {paid.length > 0 && (
                            <div>
                                <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                    Đã thanh toán ({paid.length})
                                </h2>
                                <div className="space-y-2">
                                    {paid.map(inv => (
                                        <div key={inv.id}
                                            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between opacity-70">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-xs font-black leading-none">T{inv.month}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{inv.contract?.property?.title}</p>
                                                    <p className="text-xs text-slate-400">Đã đóng: {formatDate(inv.paidAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-bold text-sm text-slate-600 dark:text-slate-300">{fmt(inv.amount)}</p>
                                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl text-xs font-bold">
                                                    <FaCheckCircle size={11} /> Đã đóng
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            )}

            <AnimatePresence>
                {modal && (
                    <PaymentModal
                        invoice={modal}
                        onClose={() => setModal(null)}
                        onPaid={loadData}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
