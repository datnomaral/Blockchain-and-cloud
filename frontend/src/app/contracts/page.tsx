'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaFileContract, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';

import toast from 'react-hot-toast';

interface Contract {
    id: string;
    property: {
        title: string;
        address: string;
    };
    landlord: {
        fullName: string;
    };
    tenant: {
        fullName: string;
    };
    startDate: string;
    endDate: string;
    monthlyRent: number;
    deposit: number;
    status: string;
    signedAt: string | null;
}

export default function ContractsPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập');
            router.push('/auth/login');
            return;
        }
        fetchContracts(token);
    }, [router]);

    const fetchContracts = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contracts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setContracts(data.data.contracts);
            }
        } catch (error) {
            toast.error('Lỗi khi tải hợp đồng');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string; icon: any }> = {
            DRAFT: { label: 'Nháp', className: 'badge badge-info', icon: FaClock },
            PENDING: { label: 'Chờ ký', className: 'badge badge-warning', icon: FaClock },
            SIGNED: { label: 'Đã ký', className: 'badge badge-success', icon: FaCheckCircle },
            ACTIVE: { label: 'Đang hoạt động', className: 'badge badge-success', icon: FaCheckCircle },
            EXPIRED: { label: 'Hết hạn', className: 'badge badge-error', icon: FaTimesCircle },
            TERMINATED: { label: 'Đã hủy', className: 'badge badge-error', icon: FaTimesCircle },
        };
        return badges[status] || badges.DRAFT;
    };

    const filteredContracts = filter === 'ALL'
        ? contracts
        : contracts.filter(c => c.status === filter);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (


        <main className="flex-1 container mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Quản Lý Hợp Đồng</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Theo dõi và quản lý các hợp đồng thuê phòng của bạn
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-8 justify-center">
                {['ALL', 'DRAFT', 'PENDING', 'SIGNED', 'ACTIVE', 'EXPIRED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${filter === status
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        {status === 'ALL' ? 'Tất cả' :
                            status === 'DRAFT' ? 'Nháp' :
                                status === 'PENDING' ? 'Chờ ký' :
                                    status === 'SIGNED' ? 'Đã ký' :
                                        status === 'ACTIVE' ? 'Đang hoạt động' : 'Hết hạn'}
                    </button>
                ))}
            </div>

            {/* Contracts List */}
            {filteredContracts.length === 0 ? (
                <div className="text-center py-12">
                    <FaFileContract className="text-6xl text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                        Chưa có hợp đồng nào
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredContracts.map((contract, index) => {
                        const statusInfo = getStatusBadge(contract.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <Link href={`/contracts/${contract.id}`} key={contract.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        {/* Left Side */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold">{contract.property.title}</h3>
                                                <span className={statusInfo.className}>
                                                    <StatusIcon className="inline mr-1" />
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                📍 {contract.property.address}
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                <div>
                                                    <span className="font-semibold">Chủ nhà:</span> {contract.landlord.fullName}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Người thuê:</span> {contract.tenant.fullName}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side */}
                                        <div className="text-right">
                                            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                                                {formatPrice(contract.monthlyRent)}
                                            </p>
                                            <p className="text-xs text-slate-500 mb-2">/ tháng</p>

                                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                                <p>Từ: {formatDate(contract.startDate)}</p>
                                                <p>Đến: {formatDate(contract.endDate)}</p>
                                            </div>

                                            {contract.signedAt && (
                                                <p className="text-xs text-green-600 mt-2">
                                                    Ký: {formatDate(contract.signedAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>


    );
}
