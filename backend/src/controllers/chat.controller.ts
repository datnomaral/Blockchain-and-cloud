import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

export const chatWithAI = async (req: Request, res: Response) => {
    try {
        const { message, history = [] } = req.body;
        // Lấy API Key từ biến môi trường, phòng hờ lấy hardcode
        const apiKey = process.env.GEMINI_API_KEY || "AIzaSyC5kQzFEkcMYx85dqTUTpymnbS7DRDHWe4";

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: 'Server chưa cấu hình GEMINI_API_KEY.',
                reply: 'Xin lỗi, tôi chưa được cấp "giấy phép hoạt động" (thiếu API Key). Bạn hãy báo chủ nhà cấu hình giúp tôi nhé! 🛠️'
            });
        }

        // 1. Khởi tạo Google Gemini AI
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

        // 2. Lấy dữ liệu phòng trọ thực tế từ Database (RAG - Retrieval Augmented Generation)
        const properties = await prisma.property.findMany({
            take: 15, // Lấy 15 phòng mới nhất
            orderBy: { createdAt: 'desc' },
            select: {
                title: true,
                price: true,
                address: true,
                district: true,
                city: true,
                type: true,
                description: true,
                available: true,
                owner: {
                    select: { fullName: true, phone: true }
                }
            }
        });

        // 3. Tạo Context dữ liệu cho AI
        const propertyContext = properties.map(p =>
            `- [${p.available ? 'CÒN TRỐNG' : 'ĐÃ THUÊ'}] ${p.title}
   + Giá: ${new Intl.NumberFormat('vi-VN').format(p.price)} VND/tháng
   + Địa chỉ: ${p.address}, ${p.district}, ${p.city}
   + Loại: ${p.type}
   + Liên hệ chủ nhà: ${p.owner.fullName} (${p.owner.phone})
   + Mô tả: ${(p.description || '').substring(0, 100)}...`
        ).join('\n');

        // 4. Xây dựng System Prompt cực kỳ đơn giản (Ngắn gọn, báo giá)
        const systemPrompt = `
Chào bạn, tôi là trợ lý AI tìm phòng trọ. Tôi chỉ trả lời thật ngắn gọn về giá cả, địa chỉ và số điện thoại chủ nhà.

DANH SÁCH PHÒNG CÓ THẬT:
${propertyContext}

Nguyên tắc:
1. Hỏi gì đáp nấy, không nói dài.
2. Nếu có phòng phù hợp thì báo Giá và Địa chỉ.
3. Không tìm thấy thì báo "Hiện không có phòng giá này".
`;

        // 5. Bắt đầu cuộc hội thoại
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Tôi hiểu, hãy đưa ra câu hỏi tìm phòng." }],
                },
                // Map lịch sử chat cũ vào an toàn
                ...(Array.isArray(history) ? history.map((h: any) => ({
                    role: h.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text || '' }],
                })) : [])
            ],
        });

        // 6. Gửi tin nhắn mới
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({
            success: true,
            data: {
                reply: text
            }
        });

    } catch (error) {
        console.error('Chat AI Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xử lý AI',
            reply: 'Xin lỗi, não bộ tôi đang bị quá tải xíu. Bạn hỏi lại câu khác nhé! 🤯'
        });
    }
};
