'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaBars, FaTimes } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');

    const connectWallet = async () => {
        // Will be implemented with Web3 logic
        setIsWalletConnected(true);
        setWalletAddress('0x1234...5678');
    };

    const navLinks = [
        { href: '/', label: 'Trang chủ' },
        { href: '/contracts', label: 'Hợp đồng' },
        { href: '/properties', label: 'Phòng trọ' },
        { href: '/about', label: 'Giới thiệu' },
    ];

    return (
        <nav className="sticky top-0 z-50 glass-card border-b border-white/20">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-bold text-xl">RC</span>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 hidden sm:block">
                            RentalContract
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
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

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        {isWalletConnected ? (
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl font-medium">
                                <FaWallet />
                                <span className="text-sm">{walletAddress}</span>
                            </div>
                        ) : (
                            <button
                                onClick={connectWallet}
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

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
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
                                <button
                                    onClick={connectWallet}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold"
                                >
                                    <FaWallet />
                                    {isWalletConnected ? walletAddress : 'Kết nối ví'}
                                </button>
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
