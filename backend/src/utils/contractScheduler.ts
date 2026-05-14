import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Chạy mỗi ngày lúc 00:05 để:
 * 1. Tự động chuyển hợp đồng ACTIVE đã qua endDate → EXPIRED
 */
export function startContractScheduler() {
    // Chạy lúc 00:05 mỗi ngày
    cron.schedule('5 0 * * *', async () => {
        console.log('[Scheduler] Kiểm tra hợp đồng hết hạn...');
        try {
            const now = new Date();

            // Tìm tất cả hợp đồng ACTIVE đã qua ngày kết thúc
            const expired = await prisma.contract.updateMany({
                where: {
                    status: 'ACTIVE',
                    endDate: { lt: now },
                },
                data: { status: 'EXPIRED' },
            });

            if (expired.count > 0) {
                console.log(`[Scheduler] ✅ Đã chuyển ${expired.count} hợp đồng sang EXPIRED`);
            } else {
                console.log('[Scheduler] Không có hợp đồng nào cần cập nhật');
            }
        } catch (err) {
            console.error('[Scheduler] Lỗi khi cập nhật hợp đồng:', err);
        }
    }, {
        timezone: 'Asia/Ho_Chi_Minh',
    });

    console.log('📅 Contract scheduler đã khởi động (chạy mỗi ngày lúc 00:05 ICT)');
}
