'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    FaHome, FaUsers, FaFileContract, FaChartBar,
    FaArrowRight, FaArrowUp
} from 'react-icons/fa';
import { MdApartment, MdHouse, MdHotel } from 'react-icons/md';
import { FaBed } from 'react-icons/fa';

const API = process.env.NEXT_PUBLIC_API_URL;

function formatMoney(n: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    ROOM: 'Phòng trọ', APARTMENT: 'Căn hộ', HOUSE: 'Nhà nguyên căn', HOTEL: 'Khách sạn',
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setStats(d.data); })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8 max-w-7xl">
            {/* Page title */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tổng quan hệ thống</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Xem tóm tắt hoạt động và thống kê toàn bộ nền tảng RentalContract
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : stats ? (
                <>
                    {/* KPI cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                        {[
                            {
                                label: 'Tổng phòng',
                                value: stats.properties.total,
                                sub: `${stats.properties.available} trống · ${stats.properties.rented} đang thuê`,
                                icon: <FaHome size={22} />,
                                from: 'from-blue-500', to: 'to-cyan-500',
                                href: '/admin/properties',
                            },
                            {
                                label: 'Người dùng',
                                value: stats.users.total,
                                sub: `${stats.users.landlords} chủ nhà · ${stats.users.tenants} khách thuê`,
                                icon: <FaUsers size={22} />,
                                from: 'from-violet-500', to: 'to-purple-600',
                                href: '/admin/customers',
                            },
                            {
                                label: 'Hợp đồng',
                                value: stats.contracts.total,
                                sub: `${stats.contracts.active} hiệu lực · ${stats.contracts.draft} nháp`,
                                icon: <FaFileContract size={22} />,
                                from: 'from-emerald-500', to: 'to-teal-500',
                                href: '/admin/contracts',
                            },
                            {
                                label: 'Doanh thu/tháng',
                                value: formatMoney(stats.revenue.monthlyTotal),
                                sub: `≈ ${formatMoney(stats.revenue.annualEstimate)}/năm`,
                                icon: <FaChartBar size={22} />,
                                from: 'from-amber-400', to: 'to-orange-500',
                                href: '#',
                            },
                        ].map((c, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <Link href={c.href} className="block h-full">
                                    <div className="h-full bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                                            {c.icon}
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{c.label}</p>
                                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 leading-tight">{c.value}</p>
                                        <p className="text-xs text-slate-400 mt-1.5">{c.sub}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Bar chart */}
                        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="font-bold text-slate-800 dark:text-slate-100">Hợp đồng theo tháng</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">6 tháng gần nhất</p>
                                </div>
                                <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                                    <FaArrowUp size={9} /> {stats.contracts.newThisMonth} tháng này
                                </div>
                            </div>
                            <div className="space-y-3">
                                {stats.charts.contractsByMonth.map((m: any, i: number) => {
                                    const max = Math.max(...stats.charts.contractsByMonth.map((x: any) => x.count), 1);
                                    const pct = (m.count / max) * 100;
                                    return (
                                        <div key={i} className="flex items-center gap-4">
                                            <span className="text-xs text-slate-400 w-14 shrink-0 text-right">{m.month}</span>
                                            <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: 'easeOut' }}
                                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-5 text-right">{m.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right column */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Property types */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Loại phòng</h2>
                                <div className="space-y-3">
                                    {stats.charts.propertyTypes.map((pt: any, i: number) => {
                                        const total = stats.properties.total || 1;
                                        const pct = Math.round((pt.count / total) * 100);
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                                        {PROPERTY_TYPE_LABELS[pt.type] || pt.type}
                                                    </span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{pt.count} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                                                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Activity bubbles */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Người dùng mới', value: stats.users.newThisMonth, color: 'from-violet-500 to-purple-600' },
                                    { label: 'Hợp đồng mới', value: stats.contracts.newThisMonth, color: 'from-emerald-400 to-teal-500' },
                                ].map((b, i) => (
                                    <div key={i} className={`rounded-2xl bg-gradient-to-br ${b.color} p-4 text-white`}>
                                        <p className="text-3xl font-black">{b.value}</p>
                                        <p className="text-xs mt-1 opacity-85">{b.label}<br />trong tháng này</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick nav */}
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Truy cập nhanh</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { href: '/admin/properties', label: 'Quản lý phòng', desc: 'Xem, sửa, xóa danh sách phòng', icon: '🏠', count: stats.properties.total },
                                { href: '/admin/customers', label: 'Khách hàng', desc: 'Quản lý tài khoản người dùng', icon: '👥', count: stats.users.total },
                                { href: '/admin/contracts', label: 'Hợp đồng', desc: 'Theo dõi tình trạng hợp đồng', icon: '📋', count: stats.contracts.total },
                            ].map((q, i) => (
                                <Link key={i} href={q.href}
                                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{q.icon}</span>
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{q.label}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{q.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-slate-300 dark:text-slate-600">{q.count}</span>
                                        <FaArrowRight className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" size={14} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-slate-400">
                    <p className="text-4xl mb-3">⚠️</p>
                    <p>Không thể tải dữ liệu thống kê</p>
                </div>
            )}
        </div>
    );
}
