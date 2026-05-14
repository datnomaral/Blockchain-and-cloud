'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaChartBar, FaHome, FaUsers, FaFileContract,
    FaSignOutAlt, FaBars, FaTimes, FaShieldAlt,
    FaChevronRight, FaBell, FaCog, FaExternalLinkAlt,
    FaMoneyBillWave
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
    {
        group: 'Tổng quan',
        items: [
            { href: '/admin', label: 'Thống kê', icon: <FaChartBar />, exact: true },
        ],
    },
    {
        group: 'Quản lý',
        items: [
            { href: '/admin/properties', label: 'Danh sách phòng', icon: <FaHome />, exact: false },
            { href: '/admin/customers', label: 'Chủ nhà & Người thuê', icon: <FaUsers />, exact: false },
            { href: '/admin/contracts', label: 'Hợp đồng',          icon: <FaFileContract />, exact: false },
            { href: '/admin/invoices',  label: 'Thu / Chi',         icon: <FaMoneyBillWave />, exact: false },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router   = useRouter();
    const pathname = usePathname();
    const [user, setUser]         = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted]   = useState(false);

    useEffect(() => {
        setMounted(true);
        const token    = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            router.push('/auth/login');
            return;
        }
        
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'ADMIN') {
            toast.error('Bạn không có quyền truy cập trang quản trị!');
            router.push('/');
            return;
        }

        setUser(parsedUser);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Đã đăng xuất');
        router.push('/');
    };

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950">
            {/* ── Sidebar (desktop) ── */}
            <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-slate-900 dark:bg-slate-950 text-white">
                <SidebarContent
                    user={user}
                    pathname={pathname}
                    isActive={isActive}
                    onLogout={handleLogout}
                />
            </aside>

            {/* ── Mobile Sidebar overlay ── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900 text-white lg:hidden"
                        >
                            <SidebarContent
                                user={user}
                                pathname={pathname}
                                isActive={isActive}
                                onLogout={handleLogout}
                                onClose={() => setSidebarOpen(false)}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main area ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between px-4 md:px-6 h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <FaBars size={18} />
                            </button>
                            <div>
                                <BreadCrumb pathname={pathname} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* <Link
                                href="/"
                                target="_blank"
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                <FaExternalLinkAlt size={11} />
                                Xem trang chủ
                            </Link> */}
                            {user && (
                                <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {user.fullName?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                    <div className="hidden sm:block text-right">
                                        <p className="text-sm font-semibold leading-none">{user.fullName}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}

// ── Sidebar inner content ─────────────────────────────────────────────
function SidebarContent({ user, pathname, isActive, onLogout, onClose }: {
    user: any;
    pathname: string;
    isActive: (href: string, exact: boolean) => boolean;
    onLogout: () => void;
    onClose?: () => void;
}) {
    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-700/50">
                <Link href="/admin" className="flex items-center gap-3" onClick={onClose}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
                        <FaShieldAlt className="text-white text-base" />
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-none">Admin Panel</p>
                        <p className="text-xs text-slate-400 mt-0.5">RentalContract</p>
                    </div>
                </Link>
                {onClose && (
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                        <FaTimes size={14} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                {NAV_ITEMS.map((group) => (
                    <div key={group.group}>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
                            {group.group}
                        </p>
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const active = isActive(item.href, item.exact);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onClose}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                                                ${active
                                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                        >
                                            <span className={`text-base transition-transform duration-200 ${active ? '' : 'group-hover:scale-110'}`}>
                                                {item.icon}
                                            </span>
                                            <span className="flex-1">{item.label}</span>
                                            {active && <FaChevronRight className="text-xs opacity-60" />}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* User + Logout */}
            <div className="p-3 border-t border-slate-700/50 space-y-2">
                {user && (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {user.fullName?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate leading-none">{user.fullName}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                    <FaSignOutAlt className="text-base" />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}

// ── Breadcrumb ────────────────────────────────────────────────────────
const CRUMB_MAP: Record<string, string> = {
    admin:      'Quản trị',
    properties: 'Danh sách phòng',
    customers:  'Chủ nhà & Người thuê',
    contracts:  'Hợp đồng',
    invoices:   'Thu / Chi',
};

function BreadCrumb({ pathname }: { pathname: string }) {
    const parts = pathname.split('/').filter(Boolean);
    return (
        <div className="flex items-center gap-1.5 text-sm">
            {parts.map((part, i) => {
                const label = CRUMB_MAP[part] || part;
                const isLast = i === parts.length - 1;
                return (
                    <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-slate-400">/</span>}
                        <span className={isLast ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-500'}>
                            {label}
                        </span>
                    </span>
                );
            })}
        </div>
    );
}
