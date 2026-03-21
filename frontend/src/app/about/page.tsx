'use client';

import { motion } from 'framer-motion';
import { FaShieldAlt, FaRocket, FaUsers, FaCode } from 'react-icons/fa';


export default function AboutPage() {
    const features = [
        {
            icon: FaShieldAlt,
            title: 'Bảo Mật Cao',
            description: 'Sử dụng Blockchain để lưu trữ hash hợp đồng, đảm bảo tính bất biến và minh bạch.',
        },
        {
            icon: FaRocket,
            title: 'Hiện Đại',
            description: 'Xây dựng với công nghệ mới nhất: Next.js 14, TypeScript, TailwindCSS, Prisma.',
        },
        {
            icon: FaUsers,
            title: 'Dễ Sử Dụng',
            description: 'Giao diện thân thiện, trực quan, dễ dàng cho cả chủ nhà và người thuê.',
        },
        {
            icon: FaCode,
            title: 'Mã Nguồn Mở',
            description: 'Project được phát triển với mục đích học tập và nghiên cứu.',
        },
    ];

    const techStack = [
        { name: 'Next.js 14', color: 'from-blue-600 to-blue-400' },
        { name: 'TypeScript', color: 'from-blue-500 to-blue-300' },
        { name: 'TailwindCSS', color: 'from-cyan-600 to-cyan-400' },
        { name: 'Prisma ORM', color: 'from-indigo-600 to-indigo-400' },
        { name: 'PostgreSQL', color: 'from-blue-700 to-blue-500' },
        { name: 'Solidity', color: 'from-purple-600 to-purple-400' },
        { name: 'Hardhat', color: 'from-yellow-600 to-yellow-400' },
        { name: 'Ethers.js', color: 'from-purple-500 to-purple-300' },
    ];

    return (


        <main className="flex-1">
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                        Về Dự Án
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                        Xây dựng Web Application ký hợp đồng thuê phòng sử dụng Blockchain và Cloud Computing
                        nhằm đảm bảo tính bảo mật và toàn vẹn dữ liệu
                    </p>
                    <div className="inline-block p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                        <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-xl">
                            <p className="text-sm font-semibold">
                                🎓 Đồ án tốt nghiệp - Khoa Công Nghệ Thông Tin
                            </p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">Tính Năng Nổi Bật</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="glass-card p-6 rounded-2xl text-center card-hover"
                        >
                            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl mb-4">
                                <feature.icon className="text-4xl text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Tech Stack */}
            <section className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">Công Nghệ Sử Dụng</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {techStack.map((tech, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                viewport={{ once: true }}
                                className={`px-6 py-3 rounded-full bg-gradient-to-r ${tech.color} text-white font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105`}
                            >
                                {tech.name}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">Cách Hoạt Động</h2>
                <div className="max-w-4xl mx-auto space-y-8">
                    {[
                        {
                            step: '01',
                            title: 'Đăng Ký & Đăng Nhập',
                            description: 'Người dùng tạo tài khoản với vai trò Chủ nhà hoặc Người thuê.',
                        },
                        {
                            step: '02',
                            title: 'Tạo Hợp Đồng',
                            description: 'Chủ nhà tạo hợp đồng với các điều khoản chi tiết và thông tin người thuê.',
                        },
                        {
                            step: '03',
                            title: 'Sinh Hash SHA-256',
                            description: 'Hệ thống tự động tạo hash độc nhất từ nội dung hợp đồng.',
                        },
                        {
                            step: '04',
                            title: 'Ký Kết Blockchain',
                            description: 'Cả hai bên ký hợp đồng, hash được lưu lên blockchain bất biến.',
                        },
                        {
                            step: '05',
                            title: 'Xác Minh Công Khai',
                            description: 'Bất kỳ ai cũng có thể xác minh tính hợp lệ của hợp đồng qua hash.',
                        },
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="flex gap-6"
                        >
                            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                {item.step}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Team */}
            <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-6">Nhóm Phát Triển</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                        Q+T Team - Khoa Công Nghệ Thông Tin
                    </p>
                    <div className="inline-block glass-card px-8 py-4 rounded-2xl">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            📧 Contact: <span className="font-semibold">qtteam@demo.com</span>
                        </p>
                    </div>
                </div>
            </section>
        </main>


    );
}
