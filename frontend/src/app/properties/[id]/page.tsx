'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaUser, FaPhone, FaCheckCircle, FaEnvelope, FaTimes, FaFacebook, FaComment } from 'react-icons/fa';
import { SiZalo } from 'react-icons/si';
import toast from 'react-hot-toast';

interface Property {
    id: string;
    title: string;
    description: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    type: string;
    price: number;
    deposit: number;
    area: number;
    bedrooms: number;
    bathrooms: number;
    images: string[];
    amenities: string[];
    available: boolean;
    owner: {
        fullName: string;
        phone: string;
        email: string;
        facebook?: string;
        zalo?: string;
    };
    createdAt: string;
}

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [message, setMessage] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchProperty();
    }, []);

    const fetchProperty = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties/${params.id}`);
            const data = await res.json();
            if (data.success) {
                setProperty(data.data.property);
            } else {
                toast.error('Không tìm thấy phòng trọ');
                router.push('/properties');
            }
        } catch (error) {
            toast.error('Lỗi khi tải thông tin');
            router.push('/properties');
        } finally {
            setLoading(false);
        }
    };

    const handleCall = () => {
        if (property?.owner.phone) {
            window.location.href = `tel:${property.owner.phone}`;
        } else {
            toast.error('Số điện thoại không khả dụng');
        }
    };

    const handleZalo = () => {
        if (property?.owner.zalo) {
            // Zalo deep link
            window.location.href = `https://zalo.me/${property.owner.zalo}`;
        } else {
            toast.error('Zalo không khả dụng');
        }
    };

    const handleFacebook = () => {
        if (property?.owner.facebook) {
            window.open(property.owner.facebook, '_blank');
        } else {
            toast.error('Facebook không khả dụng');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            const subject = encodeURIComponent(`Quan tâm: ${property?.title}`);
            const body = encodeURIComponent(`
Tên: ${senderName}
SĐT: ${senderPhone}

${message}

---
Tin nhắn từ RentalContract
      `);

            window.location.href = `mailto:${property?.owner.email}?subject=${subject}&body=${body}`;

            toast.success('Đã mở ứng dụng email!');
            setShowMessageModal(false);
            setMessage('');
            setSenderName('');
            setSenderPhone('');
        } catch (error) {
            toast.error('Lỗi khi gửi tin nhắn');
        } finally {
            setSending(false);
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

    const typeLabels: Record<string, string> = {
        ROOM: 'Phòng trọ',
        APARTMENT: 'Căn hộ',
        HOUSE: 'Nhà nguyên căn',
        HOTEL: 'Khách sạn',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!property) {
        return null;
    }

    return (
        <>
            <main className="flex-1 container mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-6xl mx-auto"
                >
                    {/* Back Button */}
                    <button onClick={() => router.back()} className="mb-6 text-blue-600 hover:underline flex items-center gap-2">
                        ← Quay lại
                    </button>

                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <FaMapMarkerAlt />
                                    <span>{property.address}, {property.ward}, {property.district}, {property.city}</span>
                                </div>
                            </div>
                            {property.available && (
                                <span className="badge badge-success text-lg px-4 py-2">
                                    <FaCheckCircle className="inline mr-2" />
                                    Còn trống
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-semibold">
                                {typeLabels[property.type] || property.type}
                            </span>
                            <span className="text-sm text-slate-500">
                                Đăng ngày {formatDate(property.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="mb-8">
                        <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-200 to-purple-200 mb-4">
                            {property.images.length > 0 ? (
                                <img src={property.images[currentImageIndex]} alt={property.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-6xl">🏠</div>
                            )}

                            {property.images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIndex((currentImageIndex - 1 + property.images.length) % property.images.length)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg"
                                    >
                                        ←
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex((currentImageIndex + 1) % property.images.length)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg"
                                    >
                                        →
                                    </button>
                                </>
                            )}
                        </div>

                        {property.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {property.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 ${currentImageIndex === index ? 'border-blue-600' : 'border-transparent'
                                            }`}
                                    >
                                        <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Price */}
                            <div className="glass-card p-6 rounded-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Giá thuê</p>
                                        <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                            {formatPrice(property.price)}
                                        </p>
                                        <p className="text-sm text-slate-500">/ tháng</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tiền cọc</p>
                                        <p className="text-2xl font-bold">{formatPrice(property.deposit)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="glass-card p-6 rounded-2xl">
                                <h2 className="text-xl font-bold mb-4">Thông Số</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <FaRulerCombined className="text-3xl text-blue-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{property.area}m²</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Diện tích</p>
                                    </div>

                                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <FaBed className="text-3xl text-purple-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{property.bedrooms}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Phòng ngủ</p>
                                    </div>

                                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <FaBath className="text-3xl text-green-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{property.bathrooms}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Phòng tắm</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="glass-card p-6 rounded-2xl">
                                <h2 className="text-xl font-bold mb-4">Mô Tả</h2>
                                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{property.description}</p>
                            </div>

                            {/* Amenities */}
                            {property.amenities.length > 0 && (
                                <div className="glass-card p-6 rounded-2xl">
                                    <h2 className="text-xl font-bold mb-4">Tiện Ích</h2>
                                    <div className="flex flex-wrap gap-3">
                                        {property.amenities.map((amenity, index) => (
                                            <span
                                                key={index}
                                                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-semibold flex items-center gap-2"
                                            >
                                                <FaCheckCircle className="text-green-600" />
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Contact */}
                        <div className="lg:col-span-1">
                            <div className="glass-card p-6 rounded-2xl sticky top-6">
                                <h2 className="text-xl font-bold mb-4">Thông Tin Liên Hệ</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                            <FaUser className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Chủ nhà</p>
                                            <p className="font-semibold">{property.owner.fullName}</p>
                                        </div>
                                    </div>

                                    {property.owner.phone && (
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                <FaPhone className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">Số điện thoại</p>
                                                <p className="font-semibold">{property.owner.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Buttons */}
                                <div className="space-y-3">
                                    <button onClick={handleCall} className="btn-gradient w-full flex items-center justify-center gap-2">
                                        <FaPhone />
                                        Gọi điện
                                    </button>

                                    {property.owner.zalo && (
                                        <button
                                            onClick={handleZalo}
                                            className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <SiZalo />
                                            Chat Zalo
                                        </button>
                                    )}

                                    {property.owner.facebook && (
                                        <button
                                            onClick={handleFacebook}
                                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FaFacebook />
                                            Facebook
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setShowMessageModal(true)}
                                        className="w-full px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FaEnvelope />
                                        Gửi email
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Message Modal */}
                <AnimatePresence>
                    {showMessageModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-6 rounded-2xl max-w-md w-full"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold">Gửi email cho chủ nhà</h3>
                                    <button
                                        onClick={() => setShowMessageModal(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                <form onSubmit={handleSendMessage} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Tên của bạn</label>
                                        <input
                                            type="text"
                                            required
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                            className="input-glass"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                                        <input
                                            type="tel"
                                            required
                                            value={senderPhone}
                                            onChange={(e) => setSenderPhone(e.target.value)}
                                            className="input-glass"
                                            placeholder="0901234567"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Tin nhắn</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="input-glass resize-none"
                                            placeholder="Tôi quan tâm đến phòng này..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sending ? 'Đang gửi...' : 'Gửi email'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </>
    );
}
