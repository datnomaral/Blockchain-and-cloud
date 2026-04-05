import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Lấy dữ liệu phòng từ DB
async function getPropertyData(): Promise<string> {
    try {
        const properties = await prisma.property.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                title: true, price: true, address: true,
                district: true, city: true, type: true,
                description: true, available: true,
                owner: { select: { fullName: true, phone: true } }
            }
        });

        if (properties.length > 0) {
            return properties.map((p, i) =>
                `${i + 1}. [${p.available ? 'CÒN TRỐNG' : 'ĐÃ THUÊ'}] ${p.title} | ${new Intl.NumberFormat('vi-VN').format(p.price)} VND/tháng | ${p.address}, ${p.district}, ${p.city} | LH: ${p.owner.fullName} (${p.owner.phone}) | ${p.type}`
            ).join('\n');
        }
    } catch (err: any) {
        console.log('DB unavailable, AI sẽ trả lời chung');
    }
    return '';
}

// System Prompt
function buildSystemPrompt(propertyData: string): string {
    const dataSection = propertyData
        ? `\nDANH SÁCH PHÒNG HIỆN CÓ:\n${propertyData}`
        : '\n(Hiện chưa có dữ liệu phòng trong hệ thống)';

    return `Bạn là RentalBot — trợ lý AI của hệ thống quản lý hợp đồng cho thuê phòng trọ tại TP.HCM, tích hợp blockchain.

CÁCH TRẢ LỜI:
- Ngắn gọn, dễ đọc, thân thiện
- Mỗi ý trên 1 dòng riêng, dùng emoji phù hợp
- Khi liệt kê phòng: mỗi phòng xuống dòng, ghi rõ Tên - Giá - Địa chỉ - SĐT
- KHÔNG viết thành đoạn văn dài liên tục
- KHÔNG dùng markdown (**, ##)

VÍ DỤ CÁCH TRẢ LỜI TÌM PHÒNG:
"Tôi tìm thấy 2 phòng phù hợp:

🏠 Phòng trọ Quận 1
💰 4.500.000 VND/tháng
📍 123 Nguyễn Trãi, Q1
📞 Anh Minh: 0901-234-567

🏠 Studio Quận 7
💰 3.200.000 VND/tháng
📍 45 Nguyễn Thị Thập, Q7
📞 Chị Lan: 0912-345-678

Bạn muốn xem phòng nào?"
${dataSection}

CÁC TÍNH NĂNG CỦA HỆ THỐNG (ĐÃ CÓ, ĐANG HOẠT ĐỘNG):

1. TÌM PHÒNG TRỌ:
   Vào mục "Danh sách phòng" trên thanh menu để xem và lọc phòng theo quận, giá, loại phòng

2. ĐĂNG TIN CHO THUÊ:
   Chủ nhà đăng nhập → vào "Bảng điều khiển" → nhấn "Đăng tin mới"
   Điền thông tin phòng: tiêu đề, giá, địa chỉ, quận, loại phòng, mô tả

3. HỢP ĐỒNG THUÊ (BLOCKCHAIN):
   Vào mục "Hợp đồng" → nhấn "Tạo hợp đồng mới"
   Ký hợp đồng điện tử, được lưu trên blockchain (Polygon)
   Hợp đồng minh bạch, không ai có thể chỉnh sửa sau khi ký
   Có thể xác minh và tải về bản PDF

4. QUẢN LÝ TÀI KHOẢN:
   Nhấn "Đăng ký" hoặc "Đăng nhập" trên góc phải
   Vào "Bảng điều khiển" để quản lý phòng và hợp đồng của mình

QUAN TRỌNG: KHÔNG BAO GIỜ hiển thị đường dẫn URL (như /properties, /auth...) cho người dùng. Hãy dùng tên nút/menu bằng tiếng Việt.
Nếu chào hỏi → chào ngắn gọn, hỏi cần giúp gì.
Nếu không có phòng phù hợp → gợi ý tìm khu vực/giá khác.
Chỉ trả lời liên quan đến phòng trọ, hợp đồng, và tính năng hệ thống.`;
}

export const chatWithAI = async (req: Request, res: Response) => {
    try {
        const { message, history = [] } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(200).json({
                success: true,
                data: { reply: 'Xin lỗi, hệ thống chưa được cấu hình API Key. Vui lòng báo quản trị viên! 🛠️' }
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const propertyData = await getPropertyData();
        const systemPrompt = buildSystemPrompt(propertyData);

        for (const modelName of MODELS) {
            try {
                console.log(`Trying model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const chat = model.startChat({
                    history: [
                        { role: "user", parts: [{ text: systemPrompt }] },
                        { role: "model", parts: [{ text: "Xin chào! 👋 Tôi là RentalBot.\nBạn muốn tìm phòng ở khu vực nào?\nHãy cho tôi biết quận và mức giá mong muốn nhé! 😊" }] },
                        ...(Array.isArray(history) ? history.map((h: any) => ({
                            role: h.sender === 'user' ? 'user' : 'model',
                            parts: [{ text: h.text || '' }],
                        })) : [])
                    ],
                });

                const result = await chat.sendMessage(message);
                const text = (await result.response).text();
                console.log(`✅ ${modelName} OK`);

                return res.status(200).json({ success: true, data: { reply: text } });

            } catch (modelError: any) {
                console.error(`❌ ${modelName} failed:`, modelError?.message);
                if (modelError?.message?.includes('429')) {
                    await delay(2000);
                    continue;
                }
                if (modelError?.message?.includes('API_KEY') || modelError?.message?.includes('403')) break;
                continue;
            }
        }

        // Fallback
        return res.status(200).json({
            success: true,
            data: { reply: 'Hiện tại tôi đang bận xíu 😅\nBạn thử lại sau 1 phút nhé!\nHoặc xem danh sách phòng trên trang chủ.' }
        });

    } catch (error: any) {
        console.error('=== CHAT ERROR ===', error?.message);
        return res.status(200).json({
            success: true,
            data: { reply: 'Xin lỗi, có lỗi xảy ra.\nBạn thử lại sau nhé! 🤯' }
        });
    }
};
