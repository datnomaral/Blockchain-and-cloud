'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaHome, FaMapMarkerAlt, FaDollarSign, FaRulerCombined } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function CreatePropertyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        city: 'Hồ Chí Minh',
        district: '',
        ward: '',
        type: 'ROOM',
        price: '',
        deposit: '',
        area: '',
        bedrooms: '1',
        bathrooms: '1',
        amenities: [] as string[],
    });

    const cities = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'];
    const propertyTypes = [
        { value: 'ROOM', label: '🏠 Phòng trọ' },
        { value: 'APARTMENT', label: '🏢 Căn hộ' },
        { value: 'HOUSE', label: '🏘️ Nhà nguyên căn' },
        { value: 'HOTEL', label: '🏨 Khách sạn' },
    ];
    const amenitiesList = ['Wifi', 'Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt', 'Bếp', 'Ban công', 'Thang máy', 'Bảo vệ', 'Bãi đậu xe'];

    const handleAmenityToggle = (amenity: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
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

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    deposit: parseFloat(formData.deposit),
                    area: parseFloat(formData.area),
                    bedrooms: parseInt(formData.bedrooms),
                    bathrooms: parseInt(formData.bathrooms),
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Đăng tin thành công!');
                router.push('/properties');
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
                    <h1 className="text-4xl font-bold mb-4">Đăng Tin Cho Thuê</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Điền thông tin chi tiết để thu hút người thuê
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="glass-card p-8 rounded-2xl space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <FaHome className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="input-glass pl-12"
                                placeholder="Ví dụ: Phòng trọ cao cấp gần ĐH Công Nghệ"
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium mb-3">
                            Loại phòng <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {propertyTypes.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type.value })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.type === type.value
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Mô tả <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input-glass resize-none"
                            placeholder="Mô tả chi tiết về phòng trọ, vị trí, tiện ích..."
                        />
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Địa chỉ <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input-glass pl-12"
                                    placeholder="Số nhà, tên đường"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Thành phố <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="input-glass"
                            >
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Quận/Huyện <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                className="input-glass"
                                placeholder="Quận 10"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Phường/Xã</label>
                            <input
                                type="text"
                                value={formData.ward}
                                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                                className="input-glass"
                                placeholder="Phường 14"
                            />
                        </div>
                    </div>

                    {/* Price & Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Giá thuê (VNĐ/tháng) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                                placeholder="3000000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Diện tích (m²) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaRulerCombined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    required
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                    className="input-glass pl-12"
                                    placeholder="25"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rooms */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Số phòng ngủ</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.bedrooms}
                                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                                className="input-glass"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Số phòng tắm</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.bathrooms}
                                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                                className="input-glass"
                            />
                        </div>
                    </div>

                    {/* Amenities */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Tiện ích</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {amenitiesList.map(amenity => (
                                <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => handleAmenityToggle(amenity)}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all text-sm ${formData.amenities.includes(amenity)
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                        }`}
                                >
                                    {amenity}
                                </button>
                            ))}
                        </div>
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
                            className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang đăng...' : 'Đăng Tin'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </main>
    );
}
