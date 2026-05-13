'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    FaHome, FaUsers, FaFileContract, FaChartBar,
    FaArrowRight, FaArrowUp, FaMoneyBillWave,
    FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';

const API = process.env.NEXT_PUBLIC_API_URL;

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtShort = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' tỷ';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' tr';
    return new Intl.NumberFormat('vi-VN').format(n);
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    ROOM: 'Phòng trọ', APARTMENT: 'Căn hộ', HOUSE: 'Nhà nguyên căn', HOTEL: 'Khách sạn',
};

// ── KPI Card ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, from, to, href, delay }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
            <Link href={href} className="block h-full">
                <div className="h-full bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                        {icon}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{label}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 leading-tight">{value}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{sub}</p>
                </div>
            </Link>
        </motion.div>
    );
}

// ── Overview tab ──────────────────────────────────────────────────────
function OverviewTab({ stats, revenue, year }: any) {
    if (!stats) return null;
    const ov = revenue?.overall;

    return (
        <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <KpiCard label="Tổng phòng" value={stats.properties.total}
                    sub={`${stats.properties.available} trống · ${stats.properties.rented} đang thuê`}
                    icon={<FaHome size={22} />} from="from-blue-500" to="to-cyan-500" href="/admin/properties" delay={0} />
                <KpiCard label="Người dùng" value={stats.users.total}
                    sub={`${stats.users.landlords} chủ nhà · ${stats.users.tenants} người thuê`}
                    icon={<FaUsers size={22} />} from="from-violet-500" to="to-purple-600" href="/admin/customers" delay={0.08} />
                <KpiCard label="Hợp đồng" value={stats.contracts.total}
                    sub={`${stats.contracts.active} hiệu lực · ${stats.contracts.draft} nháp`}
                    icon={<FaFileContract size={22} />} from="from-emerald-500" to="to-teal-500" href="/admin/contracts" delay={0.16} />
                <KpiCard label="Doanh thu/tháng" value={fmt(stats.revenue.monthlyTotal)}
                    sub={`≈ ${fmt(stats.revenue.annualEstimate)}/năm`}
                    icon={<FaChartBar size={22} />} from="from-amber-400" to="to-orange-500" href="#" delay={0.24} />
            </div>

            {/* Revenue summary */}
            {ov && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: `Dự kiến thu năm ${year}`, value: fmt(ov.totalExpected), color: 'border-violet-200 dark:border-violet-800', icon: <FaMoneyBillWave className="text-violet-500" />, bg: 'bg-violet-50 dark:bg-violet-900/20' },
                        { label: 'Đã thu được', value: fmt(ov.totalCollected), color: 'border-emerald-200 dark:border-emerald-800', icon: <FaCheckCircle className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Chưa thu / Nợ', value: fmt(ov.totalUnpaid), color: 'border-red-200 dark:border-red-800', icon: <FaTimesCircle className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-900/20' },
                    ].map((c, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                            className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border ${c.color} shadow-sm flex items-center gap-4`}>
                            <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center text-xl shrink-0`}>{c.icon}</div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{c.label}</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{c.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Monthly bar chart */}
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
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                            transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: 'easeOut' }}
                                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-5 text-right">{m.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Loại phòng</h2>
                        <div className="space-y-3">
                            {stats.charts.propertyTypes.map((pt: any, i: number) => {
                                const total = stats.properties.total || 1;
                                const pct = Math.round((pt.count / total) * 100);
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">{PROPERTY_TYPE_LABELS[pt.type] || pt.type}</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{pt.count} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                                                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
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

            {/* Monthly revenue chart */}
            {ov && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Thu chi theo tháng — Năm {year}</h2>
                    <div className="space-y-2">
                        {ov.monthlyData.filter((m: any) => m.expected > 0).map((m: any, i: number) => {
                            const maxVal = Math.max(...ov.monthlyData.map((x: any) => x.expected), 1);
                            const collectedPct = (m.collected / maxVal) * 100;
                            const unpaidPct = (m.unpaid / maxVal) * 100;
                            return (
                                <div key={i} className="flex items-center gap-4">
                                    <span className="text-xs text-slate-400 w-14 shrink-0 text-right">Tháng {m.month}</span>
                                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${collectedPct}%` }}
                                            transition={{ delay: 0.1 * i, duration: 0.5 }}
                                            className="h-full bg-emerald-500 rounded-l-full" title={`Đã thu: ${fmt(m.collected)}`} />
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${unpaidPct}%` }}
                                            transition={{ delay: 0.1 * i + 0.2, duration: 0.5 }}
                                            className="h-full bg-red-400" title={`Chưa thu: ${fmt(m.unpaid)}`} />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-20 text-right">{fmtShort(m.expected)}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Đã thu</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Chưa thu</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Per-landlord tab ──────────────────────────────────────────────────
function LandlordStatsTab({ revenue, year }: any) {
    const [selected, setSelected] = useState<any>(null);

    if (!revenue?.byLandlord?.length) {
        return (
            <div className="text-center py-20 text-slate-400">
                <p className="text-4xl mb-3">🏢</p>
                <p className="font-semibold">Chưa có dữ liệu thu chi năm {year}</p>
                <p className="text-sm mt-1">Tạo hóa đơn cho các hợp đồng để xem thống kê</p>
            </div>
        );
    }

    // ── Detail view khi đã chọn 1 chủ nhà ────────────────────────────
    if (selected) {
        const item = selected;
        const collectedPct = item.totalExpected > 0
            ? Math.round((item.totalCollected / item.totalExpected) * 100) : 0;
        const activeMonths = item.monthlyData?.filter((m: any) => m.expected > 0) ?? [];
        const maxVal = Math.max(...(item.monthlyData ?? []).map((m: any) => m.expected), 1);

        return (
            <div className="space-y-5">
                {/* Back button + header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => setSelected(null)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                        ← Quay lại
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {item.landlord?.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{item.landlord?.fullName}</p>
                            <p className="text-xs text-slate-400">{item.landlord?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: `Dự kiến năm ${year}`, value: fmt(item.totalExpected),   cls: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
                        { label: 'Đã thu được',          value: fmt(item.totalCollected),  cls: 'text-emerald-600',                   bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Chưa thu / Nợ',        value: fmt(item.totalUnpaid),     cls: 'text-red-500',                       bg: 'bg-red-50 dark:bg-red-900/20' },
                        { label: 'Tỷ lệ thu tiền',       value: `${collectedPct}%`,
                          cls: collectedPct >= 80 ? 'text-emerald-600' : collectedPct >= 50 ? 'text-amber-500' : 'text-red-500',
                          bg: 'bg-white dark:bg-slate-900' },
                    ].map((s, j) => (
                        <motion.div key={j} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: j * 0.06 }}
                            className={`${s.bg} rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-800 shadow-sm`}>
                            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                            <p className={`font-black text-lg ${s.cls}`}>{s.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Monthly breakdown */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Thu chi từng tháng — Năm {year}</h3>
                        <div className="flex gap-3 text-xs">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Đã thu</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Chưa thu</span>
                        </div>
                    </div>

                    {activeMonths.length === 0 ? (
                        <p className="text-center text-slate-400 py-8 text-sm">Không có hóa đơn nào trong năm {year}</p>
                    ) : (
                        <div className="space-y-3">
                            {(item.monthlyData ?? []).map((m: any, i: number) => {
                                if (m.expected === 0) return null;
                                const collPct  = (m.collected / maxVal) * 100;
                                const unpaidPct = (m.unpaid / maxVal) * 100;
                                const mCollectedPct = m.expected > 0 ? Math.round((m.collected / m.expected) * 100) : 0;

                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 w-16 shrink-0 text-right font-medium">
                                            Tháng {m.month}
                                        </span>
                                        <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${collPct}%` }}
                                                transition={{ delay: 0.05 * i, duration: 0.5 }}
                                                className="h-full bg-emerald-500"
                                                title={`Đã thu: ${fmt(m.collected)}`} />
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${unpaidPct}%` }}
                                                transition={{ delay: 0.05 * i + 0.15, duration: 0.5 }}
                                                className="h-full bg-red-400"
                                                title={`Chưa thu: ${fmt(m.unpaid)}`} />
                                        </div>
                                        <div className="w-28 text-right shrink-0">
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{fmtShort(m.expected)}</p>
                                            <p className={`text-xs font-semibold ${mCollectedPct >= 100 ? 'text-emerald-500' : mCollectedPct > 0 ? 'text-amber-500' : 'text-red-400'}`}>
                                                {mCollectedPct}% đã thu
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Invoice count */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex gap-6 text-sm">
                        <span className="text-slate-500">Tổng hóa đơn: <strong className="text-slate-800 dark:text-slate-100">{item.invoiceCount}</strong></span>
                        <span className="text-emerald-600">Đã thu: <strong>{item.paidCount}</strong></span>
                        <span className="text-red-500">Còn nợ: <strong>{item.unpaidCount}</strong></span>
                    </div>
                    <Link href={`/admin/invoices`}
                        className="text-xs text-violet-600 hover:underline font-semibold flex items-center gap-1">
                        Xem hóa đơn →
                    </Link>
                </div>
            </div>
        );
    }

    // ── Danh sách chủ nhà ─────────────────────────────────────────────
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500">
                {revenue.byLandlord.length} chủ nhà · Bấm vào để xem chi tiết từng tháng
            </p>
            <div className="grid grid-cols-1 gap-3">
                {revenue.byLandlord.map((item: any, i: number) => {
                    const collectedPct = item.totalExpected > 0
                        ? Math.round((item.totalCollected / item.totalExpected) * 100) : 0;

                    return (
                        <motion.button
                            key={item.landlord?.id || i}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            onClick={() => setSelected(item)}
                            className="w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all group overflow-hidden">

                            <div className="flex items-center gap-4 p-5">
                                {/* Avatar */}
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold shrink-0 group-hover:scale-105 transition-transform">
                                    {item.landlord?.fullName?.[0]?.toUpperCase() || '?'}
                                </div>

                                {/* Name + email */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                        {item.landlord?.fullName}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{item.landlord?.email}</p>
                                </div>

                                {/* Stats */}
                                <div className="hidden sm:flex items-center gap-5 text-right">
                                    <div>
                                        <p className="text-xs text-slate-400">Dự kiến</p>
                                        <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{fmtShort(item.totalExpected)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-500">Đã thu</p>
                                        <p className="font-bold text-sm text-emerald-600">{fmtShort(item.totalCollected)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-red-400">Còn nợ</p>
                                        <p className="font-bold text-sm text-red-500">{fmtShort(item.totalUnpaid)}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${
                                        collectedPct >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                        collectedPct >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                        'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {collectedPct}%
                                    </div>
                                </div>

                                <span className="text-slate-300 dark:text-slate-600 group-hover:text-violet-400 transition-colors ml-1">›</span>
                            </div>

                            {/* Progress bar */}
                            <div className="px-5 pb-4">
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }} animate={{ width: `${collectedPct}%` }}
                                        transition={{ delay: 0.1 + i * 0.04, duration: 0.6, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${
                                            collectedPct >= 80 ? 'bg-emerald-500' :
                                            collectedPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                        }`} />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>{item.paidCount} hóa đơn đã thu</span>
                                    <span>{item.unpaidCount} còn nợ</span>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const [stats, setStats]     = useState<any>(null);
    const [revenue, setRevenue] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab]         = useState<'overview' | 'landlords'>('overview');
    const [year, setYear]       = useState(String(new Date().getFullYear()));

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        Promise.all([
            fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API}/api/invoices/admin-stats?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]).then(([s, r]) => {
            if (s.success) setStats(s.data);
            if (r.success) setRevenue(r.data);
        }).finally(() => setLoading(false));
    }, [token, year]);

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thống kê hệ thống</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tổng quan hoạt động nền tảng RentalContract</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={year} onChange={e => setYear(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none">
                        <option value="2024">Năm 2024</option>
                        <option value="2025">Năm 2025</option>
                        <option value="2026">Năm 2026</option>
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-800 w-fit">
                {([['overview', '📊 Tổng quan'], ['landlords', '🏢 Theo chủ nhà']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === key
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
                </div>
            ) : (
                tab === 'overview'
                    ? <OverviewTab stats={stats} revenue={revenue} year={year} />
                    : <LandlordStatsTab revenue={revenue} year={year} />
            )}
        </div>
    );
}
