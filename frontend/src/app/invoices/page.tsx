'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoneyBillWave, FaTimes, FaCheckCircle, FaQrcode } from 'react-icons/fa';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;

const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (d: string | Date | null) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

export default function TenantInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<any | null>(null);
    const [user, setUser] = useState<any>(null);

    const loadData = useCallback(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            setLoading(false);
            return;
        }

        const u = JSON.parse(userData);
        setUser(u);

        // Lấy hóa đơn của người dùng hiện tại (với tư cách là người thuê)
        fetch(`${API}/api/invoices?tenantId=${u.id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setInvoices(d.data.invoices); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleConfirmPayment = () => {
        toast.success('Đã gửi thông báo thanh toán thành công! Dang chờ chủ nhà xác nhận.');
        setModal(null);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Thanh toán tiền phòng</h1>
                <p className="text-slate-500">Xem và thanh toán các Hóa đơn tiền phòng / tiền điện nước hàng tháng của bạn.</p>
            </div>

            {!user && !loading && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-sm">
                    <p className="text-slate-500">Bạn cần đăng nhập để xem danh sách hóa đơn.</p>
                </div>
            )}

            {user && (
                loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />)}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {invoices.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="text-6xl mb-4">🎉</div>
                                <h3 className="font-bold text-xl mb-2">Không có hóa đơn nào</h3>
                                <p className="text-slate-500">Hiện tại bạn chưa có hóa đơn nào hoặc đã thanh toán đầy đủ!</p>
                            </div>
                        ) : (
                            invoices.map(inv => (
                                <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                                    
                                    <div className="flex-1 flex gap-5 items-center w-full">
                                        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-xs font-bold uppercase">Tháng</span>
                                            <span className="text-xl font-black leading-none">{inv.month}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{inv.contract?.property?.title}</h3>
                                            <p className="text-sm text-slate-500">Chủ nhà: {inv.contract?.landlord?.fullName}</p>
                                            {inv.description && <p className="text-xs text-slate-400 mt-1">{inv.description}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 mb-0.5">Số tiền cần thanh toán</p>
                                            <p className="font-bold text-2xl text-violet-600 dark:text-violet-400">{formatMoney(inv.amount)}</p>
                                            <p className={`text-xs mt-1 font-semibold ${inv.status === 'PAID' ? 'text-emerald-500' : inv.status === 'OVERDUE' ? 'text-orange-500' : 'text-slate-400'}`}>
                                                Hạn chót: {formatDate(inv.dueDate)}
                                            </p>
                                        </div>
                                        
                                        <div>
                                            {inv.status === 'PAID' ? (
                                                <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl flex items-center gap-2 font-semibold">
                                                    <FaCheckCircle size={18} />
                                                    Đã đóng
                                                </div>
                                            ) : (
                                                <button onClick={() => setModal(inv)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                                    <FaMoneyBillWave />
                                                    Thanh toán
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )
            )}

            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
                            <button onClick={() => setModal(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><FaTimes /></button>
                            
                            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl mb-4">
                                <FaQrcode />
                            </div>
                            
                            <h3 className="text-xl font-bold mb-1">Chuyển khoản thanh toán</h3>
                            <p className="text-sm text-slate-500 mb-6">Bạn đang thanh toán hóa đơn Tháng {modal.month}/{modal.year}</p>

                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl w-full mb-6">
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Số tiền</p>
                                <p className="text-3xl font-black text-violet-600 dark:text-violet-400 mb-4">{formatMoney(modal.amount)}</p>
                                
                                <div className="space-y-2 text-sm text-left">
                                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <span className="text-slate-500">Người nhận:</span>
                                        <span className="font-semibold">{modal.contract?.landlord?.fullName}</span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="text-slate-500">Nội dung:</span>
                                        <span className="font-semibold">Thanh toan tien nha T{modal.month}</span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleConfirmPayment} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold hover:shadow-lg transition-all">
                                Tôi đã chuyển khoản
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
