'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaFileContract, FaCalendar, FaDollarSign } from 'react-icons/fa';

import toast from 'react-hot-toast';
import { onChainCreateContract } from '@/utils/contract';

interface Property {
    id: string;
    title: string;
    price: number;
}

export default function CreateContractPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState<Property[]>([]);
    const [tenantWalletAddress, setTenantWalletAddress] = useState('');
    const [formData, setFormData] = useState({
        propertyId: '',
        tenantEmail: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        deposit: '',
        paymentDay: '5',
        terms: `Điều khoản hợp đồng thuê phòng:

1. Thanh toán tiền phòng đầy đủ và đúng hạn vào ngày quy định hàng tháng.

2. Tiền điện, nước tính theo đồng hồ:
   - Điện: 3.500 VNĐ/kWh
   - Nước: 80.000 VNĐ/m³

3. Không được nuôi thú cưng trong phòng (trừ khi được chủ nhà đồng ý).

4. Giữ gìn vệ sinh chung, không gây ồn ào làm ảnh hưởng đến người xung quanh.

5. Không được tự ý sửa chữa, cải tạo phòng trọ mà không có sự đồng ý của chủ nhà.

6. Thông báo trước 1 tháng nếu muốn chấm dứt hợp đồng.

7. Bồi thường thiệt hại nếu làm hư hỏng tài sản trong phòng.

8. Chịu trách nhiệm về an toàn, phòng cháy chữa cháy trong quá trình thuê.`,
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập');
            router.push('/auth/login');
            return;
        }
        fetchMyProperties(token);
    }, [router]);

    const fetchMyProperties = async (token: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                // Filter to only show properties owned by current user
                setProperties(data.data.properties);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handlePropertyChange = (propertyId: string) => {
        const property = properties.find(p => p.id === propertyId);
        setFormData({
            ...formData,
            propertyId,
            monthlyRent: property?.price.toString() || '',
            deposit: property ? (property.price * 2).toString() : '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Vui lòng đăng nhập');
                router.push('/auth/login');
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contracts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    monthlyRent: parseFloat(formData.monthlyRent),
                    deposit: parseFloat(formData.deposit),
                    paymentDay: parseInt(formData.paymentDay),
                }),
            });

            const data = await res.json();

            if (data.success) {
                const contract = data.data.contract;

                // Nếu chủ nhà đã nhập ví người thuê thủ công → lưu vào DB trước
                const finalTenantWallet = contract.tenant.walletAddress ||
                    (tenantWalletAddress.startsWith('0x') && tenantWalletAddress.length === 42 ? tenantWalletAddress : null);

                if (!contract.tenant.walletAddress && finalTenantWallet) {
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin-set-wallet`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                tenantId: contract.tenant.id,
                                walletAddress: finalTenantWallet,
                            }),
                        });
                    } catch (_) {
                        // Không bắt buộc, tiếp tục
                    }
                }

                // Nếu có ví người thuê (từ DB hoặc nhập tay) → tạo on-chain luôn
                if (contract.contractHash && finalTenantWallet) {
                    try {
                        toast.loading('Đang khởi tạo hợp đồng trên Blockchain...', { id: 'blockchain-loading' });
                        
                        const txHash = await onChainCreateContract({
                            contractHash: contract.contractHash,
                            tenantWallet: finalTenantWallet,
                            depositAmount: contract.deposit,
                            monthlyRent: contract.monthlyRent,
                        });

                        console.info('On-chain createContract txHash:', txHash);
                        toast.success('Hợp đồng đã được lưu lên Blockchain!', { id: 'blockchain-loading' });
                        toast.success('Tạo hợp đồng thành công!');
                        router.push('/contracts');
                    } catch (chainError: any) {
                        console.error('Lỗi khi ghi hợp đồng lên blockchain:', chainError);
                        const errorMessage = chainError?.message?.includes('user rejected')
                            ? 'Bạn đã từ chối giao dịch trên MetaMask.'
                            : 'Không thể ghi hợp đồng lên blockchain. Vui lòng kiểm tra ví và thử lại.';
                        toast.error(errorMessage, { id: 'blockchain-loading', duration: 5000 });
                        setLoading(false);
                        return;
                    }
                } else {
                    toast.success('Hợp đồng đã được tạo! Vui lòng nhập ví người thuê khi ký.');
                    router.push('/contracts');
                }
            } else {
                toast.error(data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Lỗi kết nối đến server');
        } finally {
            setLoading(false);
        }
    };

    return (


        <main className="flex-1 container mx-auto px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">Tạo Hợp Đồng Mới</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Tạo hợp đồng thuê phòng trên blockchain
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl space-y-6">
                    {/* Property Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Chọn phòng trọ <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.propertyId}
                            onChange={(e) => handlePropertyChange(e.target.value)}
                            className="input-glass"
                        >
                            <option value="">-- Chọn phòng trọ --</option>
                            {properties.map(property => (
                                <option key={property.id} value={property.id}>
                                    {property.title} - {new Intl.NumberFormat('vi-VN').format(property.price)} VNĐ/tháng
                                </option>
                            ))}
                        </select>
                        {properties.length === 0 && (
                            <p className="mt-2 text-sm text-amber-600">
                                Bạn chưa có phòng trọ nào. <a href="/properties/create" className="underline font-semibold">Đăng tin ngay</a>
                            </p>
                        )}
                    </div>

                    {/* Tenant Email */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Email người thuê <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.tenantEmail}
                            onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                            className="input-glass"
                            placeholder="nguoithue@example.com"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Email của người thuê đã đăng ký trong hệ thống
                        </p>
                    </div>

                    {/* Tenant Wallet Address (optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            🔑 Địa chỉ ví MetaMask người thuê
                            <span className="ml-2 text-xs font-normal text-slate-400">(Tuỳ chọn — nhập ngay để ký blockchain nhanh hơn)</span>
                        </label>
                        <input
                            type="text"
                            value={tenantWalletAddress}
                            onChange={(e) => setTenantWalletAddress(e.target.value.trim())}
                            className="input-glass font-mono text-sm"
                            placeholder="0x2Bf2F6c089..."
                        />
                        {tenantWalletAddress && (!tenantWalletAddress.startsWith('0x') || tenantWalletAddress.length !== 42) && (
                            <p className="mt-1 text-xs text-red-500">⚠️ Địa chỉ ví không hợp lệ (phải bắt đầu bằng 0x và có đúng 42 ký tự)</p>
                        )}
                        {tenantWalletAddress && tenantWalletAddress.startsWith('0x') && tenantWalletAddress.length === 42 && (
                            <p className="mt-1 text-xs text-green-600">✅ Địa chỉ ví hợp lệ</p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                            Nếu nhập ví người thuê ngay bây giờ, hợp đồng sẽ được đăng ký blockchain ngay khi tạo
                        </p>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Ngày bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="input-glass pl-12"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Ngày kết thúc <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="input-glass pl-12"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Money */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Tiền thuê (VNĐ/tháng) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    required
                                    value={formData.monthlyRent}
                                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                                    className="input-glass pl-12"
                                    placeholder="3000000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Tiền cọc (VNĐ) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                value={formData.deposit}
                                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                                className="input-glass"
                                placeholder="6000000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Ngày thanh toán hàng tháng
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.paymentDay}
                                onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                                className="input-glass"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Ngày trong tháng (1-31)
                            </p>
                        </div>
                    </div>

                    {/* Terms */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Điều khoản hợp đồng <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={12}
                            value={formData.terms}
                            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                            className="input-glass resize-none font-mono text-sm"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Điều khoản này sẽ được hash và lưu trên blockchain
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                            📝 Quy trình tiếp theo:
                        </h3>
                        <ol className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                            <li>1. Hợp đồng sẽ được tạo với trạng thái "Chờ ký"</li>
                            <li>2. Người thuê sẽ nhận được thông báo qua email</li>
                            <li>3. Cả hai bên cần ký hợp đồng bằng MetaMask</li>
                            <li>4. Hash hợp đồng sẽ được lưu lên blockchain sau khi ký xong</li>
                        </ol>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <FaFileContract />
                            {loading ? 'Đang tạo...' : 'Tạo Hợp Đồng'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </main>


    );
}
