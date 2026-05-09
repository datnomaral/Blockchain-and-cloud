'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaBars, FaTimes } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { connectWallet, selectWallet, WalletInfo } from '@/utils/wallet';
import toast from 'react-hot-toast';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');

    const shortWallet = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    const updateWalletState = (address: string) => {
        setIsWalletConnected(true);
        setWalletAddress(shortWallet(address));
    };

    const updateStoredUser = (user: any) => {
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('storage'));
    };

    const saveWalletToAccount = async (address: string) => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/connect-wallet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ walletAddress: address, forceRelink: true }),
        });

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.message || 'Không thể liên kết ví');
        }

        updateStoredUser(data.data.user);
    };

    const applyWallet = async (wallet: WalletInfo | null) => {
        if (!wallet) return;

        await saveWalletToAccount(wallet.address);
        updateWalletState(wallet.address);
        setIsWalletMenuOpen(false);
        setIsMenuOpen(false);
    };

    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    updateWalletState(accounts[0]);
                }
            }
        };

        checkConnection();

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) {
                    updateWalletState(accounts[0]);
                } else {
                    setIsWalletConnected(false);
                    setWalletAddress('');
                    setIsWalletMenuOpen(false);
                }
            });
        }
    }, []);

    const handleConnectWallet = async () => {
        try {
            await applyWallet(await connectWallet());
            toast.success('Kết nối ví thành công!');
        } catch (error: any) {
            toast.error(error.message || 'Lỗi kết nối ví');
        }
    };

    const handleChangeWallet = async () => {
        try {
            await applyWallet(await selectWallet());
            toast.success('Đã thay đổi ví!');
        } catch (error: any) {
            toast.error(error.message || 'Lỗi thay đổi ví');
        }
    };

    const handleDisconnectWallet = async () => {
        try {
            const token = localStorage.getItem('token');

            if (token) {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/disconnect-wallet`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                if (!data.success) {
                    throw new Error(data.message || 'Không thể hủy kết nối ví');
                }

                updateStoredUser(data.data.user);
            }

            setIsWalletConnected(false);
            setWalletAddress('');
            setIsWalletMenuOpen(false);
            setIsMenuOpen(false);
            toast.success('Đã hủy kết nối ví');
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi hủy kết nối ví');
        }
    };

    const navLinks = [
        { href: '/', label: 'Trang chủ' },
        { href: '/contracts', label: 'Hợp đồng' },
        { href: '/properties', label: 'Phòng trọ' },
        { href: '/invoices', label: 'Thanh toán' },
        { href: '/about', label: 'Giới thiệu' },
    ];

    return (
        <nav className="sticky top-0 z-50 glass-card border-b border-white/20">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-bold text-xl">RC</span>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 hidden sm:block">
                            RentalContract
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-300"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4">
                        {isWalletConnected ? (
                            <div className="relative hidden sm:block">
                                <button
                                    type="button"
                                    onClick={() => setIsWalletMenuOpen((open) => !open)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                                >
                                    <FaWallet />
                                    <span className="text-sm">{walletAddress}</span>
                                </button>

                                {isWalletMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                        <button
                                            type="button"
                                            onClick={handleChangeWallet}
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Thay đổi ví
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDisconnectWallet}
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        >
                                            Hủy kết nối ví
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleConnectWallet}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                            >
                                <FaWallet />
                                Kết nối ví
                            </button>
                        )}

                        <Link
                            href="/dashboard"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 glass-card rounded-xl font-semibold hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                        >
                            <MdDashboard />
                            Dashboard
                        </Link>

                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex flex-col space-y-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-300 py-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}

                                {isWalletConnected ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleChangeWallet}
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold"
                                        >
                                            <FaWallet />
                                            Thay đổi ví
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDisconnectWallet}
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold"
                                        >
                                            <FaWallet />
                                            Hủy kết nối ví
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleConnectWallet}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold"
                                    >
                                        <FaWallet />
                                        Kết nối ví
                                    </button>
                                )}

                                <Link
                                    href="/dashboard"
                                    className="flex items-center justify-center gap-2 px-4 py-3 glass-card rounded-xl font-semibold"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <MdDashboard />
                                    Dashboard
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}
