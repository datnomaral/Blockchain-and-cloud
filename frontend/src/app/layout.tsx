import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Chatbot from '@/components/common/Chatbot';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
    title: 'Rental Contract DApp - Hệ thống ký hợp đồng thuê phòng Blockchain',
    description: 'Web Application ký hợp đồng thuê phòng sử dụng Blockchain và Cloud Computing nhằm đảm bảo tính bảo mật và toàn vẹn dữ liệu',
    keywords: ['blockchain', 'smart contract', 'rental', 'ethereum', 'web3', 'hợp đồng', 'thuê phòng'],
    authors: [{ name: 'Q+T Team' }],
    openGraph: {
        title: 'Rental Contract DApp',
        description: 'Hệ thống ký hợp đồng thuê phòng trên Blockchain',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
            <body className={inter.className}>
                <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                </div>
                <Chatbot />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            color: '#1e293b',
                            border: '1px solid rgba(226, 232, 240, 0.5)',
                            padding: '16px',
                            borderRadius: '12px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
