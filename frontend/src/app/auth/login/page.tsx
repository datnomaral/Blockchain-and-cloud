'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                toast.success('Đăng nhập thành công!');
                router.push('/dashboard');
            } else {
                toast.error(data.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            toast.error('Lỗi kết nối đến server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="glass-card p-8 rounded-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                            Đăng Nhập
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Chào mừng bạn quay trở lại!
                        </p>
                    </div>

                    {/* Demo Accounts */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                            🎯 Tài khoản demo:
                        </p>
                        <div className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
                            <p>Chủ nhà: chunha@demo.com / 123456</p>
                            <p>Người thuê: nguoithue@demo.com / 123456</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-glass pl-12"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Mật khẩu</label>
                            <div className="relative">
                                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input-glass pl-12 pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm">
                        <p className="text-slate-600 dark:text-slate-400">
                            Chưa có tài khoản?{' '}
                            <Link href="/auth/register" className="text-blue-600 hover:underline font-semibold">
                                Đăng ký ngay
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
