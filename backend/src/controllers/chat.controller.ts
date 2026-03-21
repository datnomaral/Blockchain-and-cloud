import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

export const chatWithAI = async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;
        // TEMPORARY DEBUG: Hardcode key to verify
        const apiKey = "AIzaSyC5kQzFEkcMYx85dqTUTpymnbS7DRDHWe4";

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

        // 4. Xây dựng System Prompt (Nhân cách & Kiến thức)
        const systemPrompt = `
Bạn là RentalBot - Trợ lý ảo AI cao cấp của nền tảng RentalContract.
Nhiệm vụ của bạn là tư vấn cho khách hàng tìm thuê phòng trọ một cách nhiệt tình, chuyên nghiệp và lôi cuốn như một người bạn.

DỮ LIỆU PHÒNG TRỌ HIỆN CÓ (Chỉ tư vấn dựa trên danh sách này):
${propertyContext}

NGUYÊN TẮC TRẢ LỜI:
1. **Giao tiếp tự nhiên**: Dùng ngôn ngữ đời thường, thân thiện, sử dụng emoji phù hợp (😊, 🏠, 💸, 🚀).
2. **Trung thực**: Chỉ giới thiệu phòng có trong danh sách. Nếu không tìm thấy phòng phù hợp, hãy gợi ý phòng khác hoặc khuyên khách mở rộng khu vực tìm kiếm.
3. **Chốt sale khéo léo**: Luôn khuyến khích khách đến xem phòng hoặc liên hệ chủ nhà.
4. **Kiến thức bổ trợ**:
   - Hợp đồng: Ký qua Blockchain, không lo lừa đảo, pháp lý rõ ràng.
   - Thanh toán: Hỗ trợ tiền mặt hoặc Crypto (ETH).
   - Cọc: Thường là 1 tháng tiền nhà.

HÃY TRẢ LỜI NGẮN GỌN, ĐI VÀO TRỌNG TÂM. Đừng viết quá dài dòng.
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
                    parts: [{ text: "Đã rõ! Tôi là RentalBot, sẵn sàng phục vụ. Tôi sẽ tư vấn dựa trên danh sách phòng bạn cung cấp với phong cách thân thiện, chuyên nghiệp." }],
                },
                // Map lịch sử chat cũ vào (nếu có)
                ...history.map((h: any) => ({
                    role: h.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }],
                }))
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
