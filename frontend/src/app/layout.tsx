import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Chatbot from '@/components/common/Chatbot';
import ConditionalLayout from '@/components/layout/ConditionalLayout';

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
                <ConditionalLayout>
                    {children}
                </ConditionalLayout>
                <Chatbot />
            </body>
        </html>
    );
}
