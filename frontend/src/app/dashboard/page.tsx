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

    useEffect(() => {
        // Check auth
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
            // Fetch properties
            const propsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const propsData = await propsRes.json();

            // Fetch contracts
            const contractsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contracts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const contractsData = await contractsRes.json();

            if (propsData.success && contractsData.success) {
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
            <div className="glass-card p-6 rounded-2xl mb-8">
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
                                    <FaWallet className="text-green-600" />
                                    <span className="font-mono text-xs">{user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
                    className="glass-card p-6 rounded-2xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Tổng bất động sản</p>
                            <p className="text-3xl font-bold mt-2">{stats.properties}</p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <FaHome className="text-2xl text-blue-600" />
                        </div>
                    </div>
                    <Link href="/properties" className="text-blue-600 hover:underline text-sm font-semibold">
                        Xem tất cả →
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Tổng hợp đồng</p>
                            <p className="text-3xl font-bold mt-2">{stats.contracts}</p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <FaFileContract className="text-2xl text-purple-600" />
                        </div>
                    </div>
                    <Link href="/contracts" className="text-purple-600 hover:underline text-sm font-semibold">
                        Xem tất cả →
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Hợp đồng đang hoạt động</p>
                            <p className="text-3xl font-bold mt-2">{stats.activeContracts}</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <FaFileContract className="text-2xl text-green-600" />
                        </div>
                    </div>
                    <Link href="/contracts?status=ACTIVE" className="text-green-600 hover:underline text-sm font-semibold">
                        Xem chi tiết →
                    </Link>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-bold mb-4">Hành động nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.role === 'LANDLORD' && (
                        <>
                            <Link href="/properties/create" className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">🏠</div>
                                    <div>
                                        <p className="font-semibold">Đăng tin mới</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Thêm bất động sản</p>
                                    </div>
                                </div>
                            </Link>
                            <Link href="/contracts/create" className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">📝</div>
                                    <div>
                                        <p className="font-semibold">Tạo hợp đồng</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Hợp đồng mới</p>
                                    </div>
                                </div>
                            </Link>
                        </>
                    )}
                    <Link href="/properties" className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">🔍</div>
                            <div>
                                <p className="font-semibold">Tìm phòng</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Khám phá phòng trọ</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </main>


    );
}
