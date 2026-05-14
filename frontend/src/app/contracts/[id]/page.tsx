'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaFileContract, FaCheckCircle, FaWallet, FaClipboard, FaCopy, FaExternalLinkAlt, FaDownload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { connectWallet, signMessage } from '@/utils/wallet';
import { onChainCreateContract, onChainSignContract, onChainVerifyContract } from '@/utils/contract';

interface Contract {
    id: string;
    property: {
        title: string;
        address: string;
    };
    landlord: {
        id: string;
        fullName: string;
        walletAddress: string | null;
    };
    tenant: {
        id: string;
        fullName: string;
        walletAddress: string | null;
    };
    startDate: string;
    endDate: string;
    monthlyRent: number;
    deposit: number;
    paymentDay: number;
    terms: string;
    status: string;
    contractHash: string | null;
    landlordSignature: string | null;
    tenantSignature: string | null;
    signedAt: string | null;
    blockchainTxHash: string | null;
}

export default function ContractDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [showTenantWalletModal, setShowTenantWalletModal] = useState(false);
    const [tenantWalletInput, setTenantWalletInput] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchContract();
    }, []);

    const fetchContract = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/contracts/${params.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();
            if (data.success) {
                setContract(data.data.contract);
            }
        } catch (error) {
            toast.error('Lỗi khi tải hợp đồng');
        } finally {
            setLoading(false);
        }
    };

    const handleConnectWallet = async () => {
        try {
            const wallet = await connectWallet();
            if (wallet) {
                setWalletAddress(wallet.address);
                toast.success(`Đã kết nối: ${wallet.address.slice(0, 10)}...`);

                // Update wallet address in backend
                const token = localStorage.getItem('token');
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/connect-wallet`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ walletAddress: wallet.address }),
                });
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleSign = async () => {
        if (!contract) return;

        setSigning(true);
        try {
            // Kết nối ví nếu chưa có
            const currentWalletAddress = walletAddress || user?.walletAddress;
            if (!currentWalletAddress) {
                toast.error('Vui lòng kết nối MetaMask trước');
                await handleConnectWallet();
                setSigning(false);
                return;
            }

            // Tạo message để ký off-chain (xác nhận danh tính)
            const message = `Ký hợp đồng thuê phòng\n\nID: ${contract.id}\nPhòng: ${contract.property.title}\nGiá: ${contract.monthlyRent} VNĐ/tháng\n\nNgười ký xác nhận đồng ý với tất cả điều khoản trong hợp đồng này.`;
            const signature = await signMessage(message);

            let txHash: string | undefined;

            if (contract.contractHash) {
                try {
                    const isLandlord = user?.id === contract.landlord.id;

                    // Bước 1: Kiểm tra hợp đồng đã tồn tại trên blockchain chưa
                    toast.loading('Đang kiểm tra trạng thái Blockchain...', { id: 'signing-blockchain' });
                    const onChainStatus = await onChainVerifyContract(contract.contractHash);

                    if (!onChainStatus.exists) {
                        // Hợp đồng chưa tồn tại trên chain
                        if (!isLandlord) {
                            // Tenant không thể tạo contract on-chain, chỉ landlord mới được
                            toast.error(
                                'Hợp đồng chưa được khởi tạo trên Blockchain. Vui lòng yêu cầu chủ nhà ký trước.',
                                { id: 'signing-blockchain', duration: 6000 }
                            );
                            setSigning(false);
                            return;
                        }

                        // Resolve tenant wallet: từ DB hoặc từ input thủ công của chủ nhà
                        const resolvedTenantWallet = contract.tenant.walletAddress || tenantWalletInput.trim();

                        if (!resolvedTenantWallet || !resolvedTenantWallet.startsWith('0x') || resolvedTenantWallet.length !== 42) {
                            toast.dismiss('signing-blockchain');
                            setSigning(false);
                            setShowTenantWalletModal(true);
                            return;
                        }

                        // Nếu chủ nhà đã nhập ví thủ công, lưu vào backend cho người thuê
                        if (!contract.tenant.walletAddress && resolvedTenantWallet) {
                            try {
                                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin-set-wallet`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                    },
                                    body: JSON.stringify({
                                        tenantId: contract.tenant.id,
                                        walletAddress: resolvedTenantWallet,
                                    }),
                                });
                            } catch (_) {
                                // Không bắt buộc phải lưu thành công, tiếp tục ký
                            }
                        }

                        // Landlord tạo contract on-chain trước
                        toast.loading('Đang khởi tạo hợp đồng trên Blockchain...', { id: 'signing-blockchain' });
                        const createTxHash = await onChainCreateContract({
                            contractHash: contract.contractHash,
                            tenantWallet: resolvedTenantWallet,
                            depositAmount: contract.deposit,
                            monthlyRent: contract.monthlyRent,
                        });
                        console.info('createContract txHash:', createTxHash);
                    }

                    // Bước 2: Ký hợp đồng trên blockchain
                    toast.loading('Đang ký hợp đồng trên Blockchain...', { id: 'signing-blockchain' });
                    txHash = await onChainSignContract(contract.contractHash);
                    console.info('signContract txHash:', txHash);
                    toast.success('Chữ ký đã được ghi lên Blockchain!', { id: 'signing-blockchain' });

                } catch (chainError: any) {
                    console.error('Blockchain error:', chainError);

                    let errorMessage = 'Không thể ghi nhận chữ ký lên blockchain. Vui lòng thử lại.';
                    if (chainError?.message?.includes('user rejected') || chainError?.code === 4001) {
                        errorMessage = 'Bạn đã từ chối giao dịch trên MetaMask.';
                    } else if (chainError?.message?.includes('gas')) {
                        errorMessage = 'Lỗi gas fee. Vui lòng thử lại sau vài giây.';
                    } else if (chainError?.message) {
                        errorMessage = `Lỗi blockchain: ${chainError.message.slice(0, 100)}`;
                    }

                    toast.error(errorMessage, { id: 'signing-blockchain', duration: 6000 });
                    setSigning(false);
                    return;
                }
            }

            // Bước 3: Lưu chữ ký vào backend
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/contracts/${contract.id}/sign`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ signature, txHash }),
                }
            );

            const data = await res.json();

            if (data.success) {
                toast.success(data.message || 'Ký hợp đồng thành công! ✅');
                fetchContract();
            } else {
                toast.error(data.message || 'Không thể lưu chữ ký vào hệ thống');
            }
        } catch (error: any) {
            console.error('Sign error:', error);
            toast.error(error.message || 'Lỗi khi ký hợp đồng');
        } finally {
            setSigning(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã sao chép!');
    };

    const handleExportPdf = async () => {
        if (!contract) return;

        setExportingPdf(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/contracts/${contract.id}/pdf`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || 'Không thể xuất file PDF');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `contract-${contract.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Đã tải file PDF');
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi xuất file PDF');
        } finally {
            setExportingPdf(false);
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

    const canSign = () => {
        if (!contract || !user) return false;

        const isLandlord = user.id === contract.landlord.id;
        const isTenant = user.id === contract.tenant.id;

        if (isLandlord && !contract.landlordSignature) return true;
        if (isTenant && !contract.tenantSignature) return true;

        return false;
    };

    const canExportPdf = contract?.status === 'SIGNED' || contract?.status === 'ACTIVE';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Không tìm thấy hợp đồng</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-5xl mx-auto space-y-6"
                >
                    {/* Header Card */}
                    <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FaFileContract className="text-9xl" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{contract.property.title}</h1>
                                    <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                        📍 {contract.property.address}
                                    </p>
                                </div>
                                <span className={`badge px-4 py-2 text-sm font-bold ${
                                        contract.status === 'ACTIVE' ? 'badge-success' :
                                        contract.status === 'SIGNED' ? 'badge-success' :
                                        contract.status === 'PENDING' ? 'badge-warning' : 'badge-info'
                                    }`}>
                                    {contract.status === 'ACTIVE' ? 'ĐANG HIỆU LỰC' :
                                        contract.status === 'SIGNED' ? 'ĐÃ KÝ KẾT' :
                                        contract.status === 'PENDING' ? 'CHỜ KÝ' : 'BẢN NHÁP'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide font-semibold">Chủ nhà (Bên A)</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{contract.landlord.fullName}</p>
                                    {contract.landlordSignature ? (
                                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                            <FaCheckCircle /> Đã ký xác nhận
                                        </div>
                                    ) : (
                                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                                            ⏳ Chờ ký
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide font-semibold">Người thuê (Bên B)</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{contract.tenant.fullName}</p>
                                    {contract.tenantSignature ? (
                                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                            <FaCheckCircle /> Đã ký xác nhận
                                        </div>
                                    ) : (
                                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                                            ⏳ Chờ ký
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contract Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Terms */}
                            <div className="glass-card p-6 rounded-2xl">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <FaClipboard className="text-blue-600" />
                                    Điều Khoản Hợp Đồng
                                </h2>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl whitespace-pre-wrap text-sm leading-relaxed border border-slate-100 dark:border-slate-800">
                                    {contract.terms}
                                </div>
                            </div>

                            {/* Blockchain Info */}
                            {contract.contractHash && (
                                <div className="glass-card p-6 rounded-2xl border-l-4 border-blue-600">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        🔗 Thông Tin Blockchain
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Contract Hash (SHA-256)</p>
                                                <button
                                                    onClick={() => copyToClipboard(contract.contractHash!)}
                                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    <FaCopy /> Copy
                                                </button>
                                            </div>
                                            <code className="block text-xs font-mono bg-slate-100 dark:bg-slate-900 p-3 rounded-lg break-all border border-slate-200 dark:border-slate-700">
                                                {contract.contractHash}
                                            </code>
                                        </div>

                                        {contract.blockchainTxHash && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Transaction Hash</p>
                                                    <a
                                                        href={`https://amoy.polygonscan.com/tx/${contract.blockchainTxHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <FaExternalLinkAlt /> Xem trên Explorer
                                                    </a>
                                                </div>
                                                <code className="block text-xs font-mono bg-slate-100 dark:bg-slate-900 p-3 rounded-lg break-all border border-slate-200 dark:border-slate-700">
                                                    {contract.blockchainTxHash}
                                                </code>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <div className="glass-card p-6 rounded-2xl">
                                <h3 className="font-bold text-lg mb-4">Chi Tiết Thanh Toán</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-600 dark:text-slate-400">Giá thuê</span>
                                        <span className="font-bold text-blue-600 text-lg">{formatPrice(contract.monthlyRent)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-600 dark:text-slate-400">Tiền cọc</span>
                                        <span className="font-bold">{formatPrice(contract.deposit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400">Ngày thanh toán</span>
                                        <span className="font-semibold">Ngày {contract.paymentDay} hàng tháng</span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6 rounded-2xl">
                                <h3 className="font-bold text-lg mb-4">Thời Hạn</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Bắt đầu</p>
                                        <p className="font-semibold">{formatDate(contract.startDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Kết thúc</p>
                                        <p className="font-semibold">{formatDate(contract.endDate)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tenant Wallet Input Modal */}
                            {showTenantWalletModal && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                                        <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">🔑 Nhập địa chỉ ví người thuê</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            Người thuê chưa kết nối MetaMask. Bạn có thể nhập thủ công địa chỉ ví của họ để tiến hành ký hợp đồng.
                                        </p>
                                        <div className="mb-1 text-xs text-slate-500">Ví người thuê đã cung cấp:</div>
                                        <input
                                            type="text"
                                            value={tenantWalletInput}
                                            onChange={(e) => setTenantWalletInput(e.target.value)}
                                            placeholder="0x2Bf2F6c089..."
                                            className="w-full border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-mono mb-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                                        />
                                        {tenantWalletInput && (!tenantWalletInput.startsWith('0x') || tenantWalletInput.length !== 42) && (
                                            <p className="text-xs text-red-500 mb-3">⚠️ Địa chỉ ví không hợp lệ (phải bắt đầu bằng 0x và có 42 ký tự)</p>
                                        )}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowTenantWalletModal(false)}
                                                className="flex-1 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (tenantWalletInput.startsWith('0x') && tenantWalletInput.length === 42) {
                                                        setShowTenantWalletModal(false);
                                                        handleSign();
                                                    }
                                                }}
                                                disabled={!tenantWalletInput.startsWith('0x') || tenantWalletInput.length !== 42}
                                                className="flex-1 py-3 btn-gradient rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ✅ Xác nhận & Ký
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="sticky top-6 space-y-3">
                                {canSign() ? (
                                    <>
                                        {!walletAddress && !user?.walletAddress && (
                                            <button
                                                onClick={handleConnectWallet}
                                                className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2"
                                            >
                                                <FaWallet /> Kết Nối MetaMask
                                            </button>
                                        )}

                                        <button
                                            onClick={handleSign}
                                            disabled={signing}
                                            className="w-full py-4 btn-gradient rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {signing ? (
                                                <>
                                                    <div className="spinner w-5 h-5 border-white"></div> Đang ký...
                                                </>
                                            ) : (
                                                <>
                                                    <FaFileContract /> Ký Hợp Đồng Ngay
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (contract.status === 'SIGNED' || contract.status === 'ACTIVE') ? (
                                    <div className="w-full py-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl font-bold text-center border border-green-200 dark:border-green-800 flex flex-col items-center justify-center gap-1">
                                        <div className="flex items-center gap-2 text-lg">
                                            <FaCheckCircle /> Đã Hoàn Tất
                                        </div>
                                        <span className="text-xs font-normal opacity-80">Hợp đồng đã có hiệu lực pháp lý</span>
                                    </div>
                                ) : (
                                    <div className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-semibold text-center">
                                        Đang chờ bên còn lại ký...
                                    </div>
                                )}

                                {canExportPdf && (
                                    <button
                                        onClick={handleExportPdf}
                                        disabled={exportingPdf}
                                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {exportingPdf ? (
                                            <>
                                                <div className="spinner w-5 h-5 border-white"></div> Đang xuất PDF...
                                            </>
                                        ) : (
                                            <>
                                                <FaDownload /> Xuất file PDF
                                            </>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={() => router.back()}
                                    className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Quay lại danh sách
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
