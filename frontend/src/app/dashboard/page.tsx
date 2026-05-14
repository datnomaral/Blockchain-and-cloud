'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaHome, FaFileContract, FaWallet, FaSignOutAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        properties: 0,
        contracts: 0,
        activeContracts: 0,
    });
    const [myProperties, setMyProperties] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/auth/login');
            return;
        }

        setUser(JSON.parse(userData));
        fetchStats(token);

        const syncUser = () => {
            const updatedUser = localStorage.getItem('user');
            if (updatedUser) {
                setUser(JSON.parse(updatedUser));
            }
        };

        window.addEventListener('storage', syncUser);
        return () => window.removeEventListener('storage', syncUser);
    }, [router]);

    const fetchStats = async (token: string) => {
        try {
            // Dùng /my để lấy tất cả phòng của chủ nhà (kể cả PENDING/REJECTED)
            const propsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const propsData = await propsRes.json();

            const contractsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contracts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const contractsData = await contractsRes.json();

            if (propsData.success && contractsData.success) {
                setMyProperties(propsData.data.properties);
                setStats({
                    properties: propsData.data.properties.length,
                    contracts: contractsData.data.contracts.length,
                    activeContracts: contractsData.data.contracts.filter((c: any) =>
                        c.status === 'ACTIVE' || c.status === 'SIGNED'
                    ).length,
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Đã đăng xuất');
        router.push('/');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <main className="flex-1 container mx-auto px-4 py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    Xin chào, {user.fullName}! 👋
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Quản lý phòng trọ và hợp đồng của bạn
                </p>
            </div>

            {/* User Info Card */}
            <div className="glass-card p-6 rounded-2xl mb-8 border border-white/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold mb-4">Thông tin tài khoản</h2>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-semibold">Email:</span> {user.email}</p>
                            <p><span className="font-semibold">Vai trò:</span> {
                                user.role === 'LANDLORD' ? '🏢 Chủ nhà' : '🏠 Người thuê'
                            }</p>
                            {user.phone && <p><span className="font-semibold">SĐT:</span> {user.phone}</p>}
                            {user.walletAddress && (
                                <p className="flex items-center gap-2">
                                    <FaWallet className="text-emerald-600" />
                                    <span className="font-mono text-xs text-slate-500">{user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-semibold transition-colors"
                    >
                        <FaSignOutAlt />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 p-6 rounded-3xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Tổng bất động sản</p>
                            <p className="text-3xl font-black mt-2">{stats.properties}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl">
                            <FaHome className="text-xl" />
                        </div>
                    </div>
                    <Link href="/properties" className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
                        Xem tất cả →
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 p-6 rounded-3xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Tổng hợp đồng</p>
                            <p className="text-3xl font-black mt-2">{stats.contracts}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center bg-purple-50 text-purple-600 rounded-xl">
                            <FaFileContract className="text-xl" />
                        </div>
                    </div>
                    <Link href="/contracts" className="text-purple-600 hover:text-purple-700 text-sm font-semibold transition-colors">
                        Xem tất cả →
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 p-6 rounded-3xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Hợp đồng H.động</p>
                            <p className="text-3xl font-black mt-2 text-emerald-600">{stats.activeContracts}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl">
                            <FaFileContract className="text-xl" />
                        </div>
                    </div>
                    <Link href="/contracts?status=ACTIVE" className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold transition-colors">
                        Xem chi tiết →
                    </Link>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-8 rounded-3xl border border-white/20">
                <h2 className="text-xl font-bold mb-6">Hành động nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {user.role === 'LANDLORD' && (
                        <>
                            <Link href="/properties/create" className="p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl hover:-translate-y-1 transition-transform cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">🏠</div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">Đăng tin mới</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Thêm bất động sản</p>
                                    </div>
                                </div>
                            </Link>
                            <Link href="/contracts/create" className="p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl hover:-translate-y-1 transition-transform cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">📝</div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">Tạo hợp đồng</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Lập HĐ ký trên chuỗi</p>
                                    </div>
                                </div>
                            </Link>
                        </>
                    )}
                    <Link href="/properties" className="p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl hover:-translate-y-1 transition-transform cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">🔍</div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-100">Tìm phòng</p>
                                <p className="text-xs text-slate-500 mt-0.5">Duyệt phòng trọ mới</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/invoices" className="p-5 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20 border border-violet-400 rounded-2xl hover:-translate-y-1 transition-transform cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl drop-shadow-sm">💸</div>
                            <div>
                                <p className="font-bold">Thanh toán</p>
                                <p className="text-xs text-white/80 mt-0.5">Đóng tiền, xem hóa đơn</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Danh sách phòng của chủ nhà */}
            {user.role === 'LANDLORD' && myProperties.length > 0 && (
                <div className="mt-8 glass-card p-8 rounded-3xl border border-white/20">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">Phòng của tôi</h2>
                        <Link href="/properties/create" className="text-sm text-blue-600 hover:underline font-semibold">
                            + Đăng tin mới
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {myProperties.map((p: any) => {
                            const statusMap: Record<string, { label: string; cls: string }> = {
                                PENDING:  { label: '⏳ Chờ duyệt', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
                                APPROVED: { label: '✅ Đã duyệt',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
                                REJECTED: { label: '✗ Từ chối',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
                            };
                            const status = statusMap[p.approvalStatus] || statusMap['PENDING'];
                            return (
                                <div key={p.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{p.title}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">📍 {p.district}, {p.city}</p>
                                        {p.approvalStatus === 'REJECTED' && p.rejectionReason && (
                                            <p className="text-xs text-red-500 mt-1">Lý do: {p.rejectionReason}</p>
                                        )}
                                    </div>
                                    <span className={`ml-4 shrink-0 px-3 py-1 rounded-full text-xs font-bold ${status.cls}`}>
                                        {status.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </main>
    );
}
