'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaPaperPlane, FaTimes, FaMinus, FaCommentDots, FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa';
import Link from 'next/link';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    relatedProperties?: Property[]; // Bot có thể trả về danh sách phòng
}

interface Property {
    id: string;
    title: string;
    price: number;
    address: string;
    district: string;
    city: string;
    images: string[];
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Xin chào! 👋 Tôi là RentalBot thông minh. Tôi có thể giúp bạn tìm phòng trọ, giải đáp thắc mắc về hợp đồng và giá cả. Bạn đang tìm phòng ở khu vực nào?',
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [properties, setProperties] = useState<Property[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch properties for AI context
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties`);
                const data = await res.json();
                if (data.success) {
                    setProperties(data.data.properties);
                }
            } catch (error) {
                console.error('Failed to load properties for bot context');
            }
        };
        fetchProperties();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    // --- SMART AI LOGIC (API) ---
    const processMessage = async (input: string, history: Message[]) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    history: history.slice(-5).map(msg => ({
                        text: msg.text,
                        sender: msg.sender
                    }))
                })
            });
            const data = await res.json();

            if (data.success) {
                return { text: data.data.reply, relatedProps: [] };
            } else {
                return { text: data.reply || 'Xin lỗi, tôi đang gặp sự cố kết nối. 😔', relatedProps: [] };
            }
        } catch (error) {
            return { text: 'Lỗi kết nối server. Vui lòng thử lại sau! 🔌', relatedProps: [] };
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputValue('');
        setIsTyping(true);

        // Call API
        const { text, relatedProps } = await processMessage(userMsg.text, newMessages);

        const botResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: text,
            sender: 'bot',
            timestamp: new Date(),
            relatedProperties: relatedProps
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="mb-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between text-white shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full relative">
                                    <FaRobot className="text-xl" />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-blue-600 rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">RentalBot AI 2.0</h3>
                                    <p className="text-[10px] text-blue-100 opacity-90">
                                        Trả lời tự động & Tìm phòng
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                >
                                    <FaMinus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50 scroll-smooth">
                            {messages.map((msg) => (
                                <div key={msg.id} className="space-y-2">
                                    {/* Message Bubble */}
                                    <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.sender === 'bot' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-1">
                                                <FaRobot />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                                                }`}
                                        >
                                            {msg.text}
                                            <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                                                }`}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Related Properties Cards */}
                                    {msg.relatedProperties && msg.relatedProperties.length > 0 && (
                                        <div className="pl-10 pr-4">
                                            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                                                {msg.relatedProperties.map(prop => (
                                                    <Link href={`/properties/${prop.id}`} key={prop.id} className="snap-center">
                                                        <div className="min-w-[200px] w-[200px] bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                                            <div className="h-24 bg-slate-200 relative">
                                                                {prop.images[0] ? (
                                                                    <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                                                                )}
                                                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md font-bold">
                                                                    {formatPrice(prop.price)}
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h4 className="font-bold text-xs line-clamp-2 mb-1 text-slate-800 dark:text-slate-200">{prop.title}</h4>
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                    <FaMapMarkerAlt />
                                                                    <span className="truncate">{prop.district}, {prop.city}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">
                                        <FaRobot />
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Footer */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Tìm phòng quận 1, giá dưới 5tr..."
                                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <FaPaperPlane />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg shadow-blue-500/30 transition-all relative ${isOpen
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    }`}
            >
                {isOpen ? <FaTimes size={24} /> : <FaCommentDots size={28} />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
            </motion.button>
        </div>
    );
}
