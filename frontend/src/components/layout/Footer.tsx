'use client';

import Link from 'next/link';
import { FaGithub, FaLinkedin, FaTwitter, FaEnvelope, FaHeart } from 'react-icons/fa';
import { MdLocationOn, MdPhone, MdEmail } from 'react-icons/md';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* About */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">RC</span>
                            </div>
                            <span className="text-xl font-bold text-white">
                                RentalContract
                            </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-4">
                            Hệ thống ký hợp đồng thuê phòng trên Blockchain, đảm bảo tính bảo mật, toàn vẹn và minh bạch.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="hover:text-primary-400 transition-colors">
                                <FaGithub size={20} />
                            </a>
                            <a href="#" className="hover:text-primary-400 transition-colors">
                                <FaLinkedin size={20} />
                            </a>
                            <a href="#" className="hover:text-primary-400 transition-colors">
                                <FaTwitter size={20} />
                            </a>
                            <a href="#" className="hover:text-primary-400 transition-colors">
                                <FaEnvelope size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Liên kết</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/', label: 'Trang chủ' },
                                { href: '/contracts', label: 'Hợp đồng' },
                                { href: '/properties', label: 'Phòng trọ' },
                                { href: '/about', label: 'Giới thiệu' },
                                { href: '/faq', label: 'FAQ' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Tài nguyên</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/docs', label: 'Tài liệu' },
                                { href: '/api', label: 'API Documentation' },
                                { href: '/blog', label: 'Blog' },
                                { href: '/support', label: 'Hỗ trợ' },
                                { href: '/privacy', label: 'Chính sách bảo mật' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="hover:text-primary-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Liên hệ</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <MdLocationOn className="text-primary-400 mt-1 flex-shrink-0" size={20} />
                                <span className="text-sm">
                                    Đại học Công nghệ Thông tin<br />
                                    TP. Hồ Chí Minh, Việt Nam
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MdPhone className="text-primary-400 flex-shrink-0" size={20} />
                                <span className="text-sm">+84 123 456 789</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MdEmail className="text-primary-400 flex-shrink-0" size={20} />
                                <span className="text-sm">contact@rentalcontract.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-400 text-sm">
                            © {currentYear} RentalContract DApp. All rights reserved.
                        </p>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                            Made with <FaHeart className="text-red-500" /> by Q+T Team
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
