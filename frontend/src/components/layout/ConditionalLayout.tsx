'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            {isAdmin ? (
                <>{children}</>
            ) : (
                <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                </div>
            )}

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
        </>
    );
}
