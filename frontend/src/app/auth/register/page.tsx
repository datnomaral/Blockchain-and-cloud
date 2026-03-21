'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'TENANT' as 'LANDLORD' | 'TENANT',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                toast.success('Đăng ký thành công!');
                router.push('/dashboard');
            } else {
                toast.error(data.message || 'Đăng ký thất bại');
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
                            Đăng Ký
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Tạo tài khoản mới miễn phí
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Họ và tên</label>
                            <div className="relative">
                                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="input-glass pl-12"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                        </div>

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

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                            <div className="relative">
                                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input-glass pl-12"
                                    placeholder="0901234567"
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
                                    minLength={6}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input-glass pl-12 pr-12"
                                    placeholder="Tối thiểu 6 ký tự"
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

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Bạn là</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'TENANT' })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'TENANT'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">🏠</div>
                                        <div className="font-semibold">Người thuê</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'LANDLORD' })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'LANDLORD'
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">🏢</div>
                                        <div className="font-semibold">Chủ nhà</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm">
                        <p className="text-slate-600 dark:text-slate-400">
                            Đã có tài khoản?{' '}
                            <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
                                Đăng nhập
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
