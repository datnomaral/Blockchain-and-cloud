'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaShieldAlt, FaFileContract, FaCheckCircle, FaEthereum, FaRocket, FaLock } from 'react-icons/fa';
import { MdVerified, MdCloudDone } from 'react-icons/md';

export default function HomePage() {
    return (
        <div className="relative overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
                </div>

                <div className="container mx-auto max-w-6xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center space-y-8"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold"
                        >
                            <FaEthereum className="text-lg" />
                            Powered by Blockchain Technology
                        </motion.div>

                        {/* Main Heading */}
                        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-purple-600 to-secondary-600 leading-tight">
                            Hợp Đồng Thuê Phòng
                            <br />
                            <span className="text-4xl md:text-6xl">Trên Blockchain</span>
                        </h1>

                        {/* Description */}
                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                            Đảm bảo <span className="font-semibold text-primary-600">tính bất biến</span>,{' '}
                            <span className="font-semibold text-secondary-600">toàn vẹn</span> và{' '}
                            <span className="font-semibold text-purple-600">minh bạch</span> cho mọi hợp đồng thuê phòng
                        </p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        >
                            <Link href="/auth/register" className="btn-gradient px-8 py-4 text-lg">
                                <FaRocket className="inline-block mr-2" />
                                Bắt Đầu Ngay
                            </Link>
                            <Link
                                href="/contracts"
                                className="px-8 py-4 text-lg font-semibold text-primary-600 dark:text-primary-400 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-primary-200 dark:border-primary-800 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-lg"
                            >
                                Xem Hợp Đồng
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
                >
                    <div className="w-6 h-10 border-2 border-primary-400 rounded-full p-1">
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-1.5 h-3 bg-primary-400 rounded-full"
                        />
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 relative">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Tính Năng Nổi Bật
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400">
                            Công nghệ blockchain kết hợp cloud computing
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <FaLock className="text-4xl" />,
                                title: 'Bảo Mật Tuyệt Đối',
                                description: 'Dữ liệu được mã hóa SHA-256 và lưu trữ trên blockchain',
                                color: 'from-blue-500 to-cyan-500',
                            },
                            {
                                icon: <MdVerified className="text-4xl" />,
                                title: 'Xác Minh Nhanh',
                                description: 'Xác minh tính hợp lệ của hợp đồng chỉ trong vài giây',
                                color: 'from-emerald-500 to-teal-500',
                            },
                            {
                                icon: <FaShieldAlt className="text-4xl" />,
                                title: 'Bất Biến',
                                description: 'Hợp đồng không thể chỉnh sửa sau khi ký kết',
                                color: 'from-purple-500 to-pink-500',
                            },
                            {
                                icon: <FaFileContract className="text-4xl" />,
                                title: 'Smart Contract',
                                description: 'Tự động hóa quy trình ký kết và lưu trữ',
                                color: 'from-orange-500 to-red-500',
                            },
                            {
                                icon: <MdCloudDone className="text-4xl" />,
                                title: 'Cloud Storage',
                                description: 'Lưu trữ an toàn trên cloud với khả năng mở rộng cao',
                                color: 'from-indigo-500 to-blue-500',
                            },
                            {
                                icon: <FaCheckCircle className="text-4xl" />,
                                title: 'Minh Bạch',
                                description: 'Mọi giao dịch đều được ghi nhận và truy vết',
                                color: 'from-green-500 to-emerald-500',
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                className="glass-card p-8 rounded-2xl card-hover group"
                            >
                                <div className={`bg-gradient-to-br ${feature.color} w-16 h-16 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-900 dark:to-slate-800">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Quy Trình Hoạt Động
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400">
                            Đơn giản, nhanh chóng và an toàn
                        </p>
                    </motion.div>

                    <div className="space-y-12">
                        {[
                            {
                                step: '01',
                                title: 'Tạo Hợp Đồng',
                                description: 'Điền thông tin phòng trọ, chủ nhà, người thuê và các điều khoản',
                            },
                            {
                                step: '02',
                                title: 'Sinh Hash & Ký',
                                description: 'Hệ thống tự động tạo hash SHA-256 và ký bằng MetaMask wallet',
                            },
                            {
                                step: '03',
                                title: 'Ghi Blockchain',
                                description: 'Smart contract ghi nhận hash, địa chỉ ví và thời gian lên blockchain',
                            },
                            {
                                step: '04',
                                title: 'Xác Minh',
                                description: 'Bất kỳ ai cũng có thể xác minh tính hợp lệ của hợp đồng',
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="flex flex-col md:flex-row items-center gap-8"
                            >
                                <div className="glass-card p-6 rounded-2xl flex-shrink-0">
                                    <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                                        {item.step}
                                    </div>
                                </div>
                                <div className="glass-card p-8 rounded-2xl flex-grow">
                                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-lg text-slate-600 dark:text-slate-400">
                                        {item.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="glass-card p-12 rounded-3xl text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                Sẵn sàng bắt đầu?
                            </h2>
                            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                                Tạo hợp đồng thuê phòng an toàn và minh bạch ngay hôm nay
                            </p>
                            <Link href="/auth/register" className="btn-gradient px-10 py-5 text-lg inline-block">
                                Đăng Ký Miễn Phí
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
