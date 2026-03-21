'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaSearch, FaPlus } from 'react-icons/fa';


interface Property {
    id: string;
    title: string;
    description: string;
    address: string;
    city: string;
    district: string;
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
    };
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`);
            const data = await res.json();
            if (data.success) {
                setProperties(data.data.properties);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
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

    // Filter by type AND search query
    const filteredProperties = properties
        .filter(p => filter === 'ALL' || p.type === filter)
        .filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.district.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (


        <main className="flex-1 container mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Danh Sách Phòng Trọ</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
                    Tìm kiếm phòng trọ phù hợp với nhu cầu của bạn
                </p>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-8">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo tên phòng, địa chỉ, quận..."
                            className="input-glass pl-12 w-full"
                        />
                    </div>
                </div>

                {/* Quick Action */}
                <Link href="/properties/create">
                    <button className="btn-gradient inline-flex items-center gap-2 mb-4">
                        <FaPlus /> Đăng Tin Mới
                    </button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-8 justify-center">
                {['ALL', 'ROOM', 'APARTMENT', 'HOUSE'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${filter === type
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        {type === 'ALL' ? 'Tất cả' :
                            type === 'ROOM' ? 'Phòng trọ' :
                                type === 'APARTMENT' ? 'Căn hộ' : 'Nhà nguyên căn'}
                    </button>
                ))}
            </div>

            {/* Results Count */}
            {!loading && (
                <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
                    Tìm thấy <span className="font-bold">{filteredProperties.length}</span> kết quả
                </p>
            )}

            {/* Loading */}
            {loading && (
                <div className="text-center py-12">
                    <div className="spinner mx-auto"></div>
                    <p className="mt-4 text-slate-600">Đang tải...</p>
                </div>
            )}

            {/* Properties Grid */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProperties.map((property, index) => (
                        <Link href={`/properties/${property.id}`} key={property.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card rounded-2xl overflow-hidden card-hover h-full"
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-gradient-to-br from-blue-200 to-purple-200">
                                    {property.images[0] ? (
                                        <img
                                            src={property.images[0]}
                                            alt={property.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-4xl">
                                            🏠
                                        </div>
                                    )}
                                    {property.available && (
                                        <span className="absolute top-3 right-3 badge badge-success">
                                            Còn trống
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="font-bold text-lg mb-2 line-clamp-1">
                                        {property.title}
                                    </h3>

                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mb-3">
                                        <FaMapMarkerAlt className="mr-1" />
                                        <span className="line-clamp-1">{property.district}, {property.city}</span>
                                    </div>

                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                                        {property.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        {property.area && (
                                            <div className="flex items-center gap-1">
                                                <FaRulerCombined />
                                                <span>{property.area}m²</span>
                                            </div>
                                        )}
                                        {property.bedrooms && (
                                            <div className="flex items-center gap-1">
                                                <FaBed />
                                                <span>{property.bedrooms}</span>
                                            </div>
                                        )}
                                        {property.bathrooms && (
                                            <div className="flex items-center gap-1">
                                                <FaBath />
                                                <span>{property.bathrooms}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <div>
                                            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                                {formatPrice(property.price)}
                                            </p>
                                            <p className="text-xs text-slate-500">/ tháng</p>
                                        </div>
                                        <div className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                                            Xem chi tiết
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}

            {/* No Results */}
            {!loading && filteredProperties.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-2xl mb-4">🔍</p>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                        Không tìm thấy phòng trọ nào
                    </p>
                    {searchQuery && (
                        <p className="text-sm text-slate-500">
                            với từ khóa "<span className="font-semibold">{searchQuery}</span>"
                        </p>
                    )}
                </div>
            )}
        </main>


    );
}
