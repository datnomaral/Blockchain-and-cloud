import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema
const createContractSchema = z.object({
    propertyId: z.string().uuid(),
    tenantEmail: z.string().email(),
    startDate: z.string(),
    endDate: z.string(),
    monthlyRent: z.number().positive(),
    deposit: z.number().positive(),
    paymentDay: z.number().min(1).max(31),
    terms: z.string().min(10),
});

/**
 * Generate SHA-256 hash for contract
 */
const generateContractHash = (contractData: any): string => {
    const dataString = JSON.stringify({
        propertyId: contractData.propertyId,
        landlordId: contractData.landlordId,
        tenantId: contractData.tenantId,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        monthlyRent: contractData.monthlyRent,
        terms: contractData.terms,
        timestamp: new Date().toISOString(),
    });

    return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Create new rental contract
 */
export const createContract = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const contractData = createContractSchema.parse(req.body);

        // Get property to verify owner
        const property = await prisma.property.findUnique({
            where: { id: contractData.propertyId },
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng trọ',
            });
        }

        // Validate tenant email
        const tenant = await prisma.user.findUnique({
            where: { email: contractData.tenantEmail },
        });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người thuê với email này. Vui lòng kiểm tra lại.',
            });
        }

        const tenantId = tenant.id;

        if (property.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền tạo hợp đồng cho phòng này',
            });
        }

        // Generate contract hash
        const { tenantEmail, ...restContractData } = contractData;
        const contractHash = generateContractHash({
            ...restContractData,
            tenantId,
            landlordId: userId,
        });

        // Create contract
        const contract = await prisma.contract.create({
            data: {
                ...restContractData,
                tenantId,
                landlordId: userId,
                startDate: new Date(contractData.startDate),
                endDate: new Date(contractData.endDate),
                contractHash,
                status: 'DRAFT',
            },
            include: {
                property: true,
                landlord: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        walletAddress: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        walletAddress: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Tạo hợp đồng thành công',
            data: { contract },
        });
    } catch (error: any) {
        console.error('Create contract error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo hợp đồng',
        });
    }
};

/**
 * Get all contracts for current user
 */
export const getContracts = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { status, role } = req.query;

        const where: any = {
            OR: [
                { landlordId: userId },
                { tenantId: userId },
            ],
        };

        if (status) {
            where.status = status;
        }

        if (role === 'landlord') {
            where.OR = [{ landlordId: userId }];
        } else if (role === 'tenant') {
            where.OR = [{ tenantId: userId }];
        }

        const contracts = await prisma.contract.findMany({
            where,
            include: {
                property: true,
                landlord: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        walletAddress: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        walletAddress: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: { contracts },
        });
    } catch (error: any) {
        console.error('Get contracts error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách hợp đồng',
        });
    }
};

/**
 * Get contract by ID
 */
export const getContractById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                property: true,
                landlord: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        walletAddress: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        walletAddress: true,
                    },
                },
            },
        });

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hợp đồng',
            });
        }

        // Check permission
        if (contract.landlordId !== userId && contract.tenantId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem hợp đồng này',
            });
        }

        res.json({
            success: true,
            data: { contract },
        });
    } catch (error: any) {
        console.error('Get contract error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thông tin hợp đồng',
        });
    }
};

/**
 * Sign contract with blockchain
 */
export const signContract = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { signature, txHash } = req.body;
        const userId = (req as any).user.userId;

        if (!signature) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu chữ ký (signature)',
            });
        }

        const contract = await prisma.contract.findUnique({
            where: { id },
        });

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hợp đồng',
            });
        }

        // Determine if landlord or tenant is signing
        const isLandlord = contract.landlordId === userId;
        const isTenant = contract.tenantId === userId;

        if (!isLandlord && !isTenant) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền ký hợp đồng này',
            });
        }

        // Chỉ cho phép ký khi hợp đồng ở trạng thái DRAFT hoặc PENDING
        if (contract.status !== 'DRAFT' && contract.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Không thể ký hợp đồng ở trạng thái ${contract.status}`,
            });
        }

        // Kiểm tra đã ký chưa
        if (isLandlord && contract.landlordSignature) {
            return res.status(400).json({
                success: false,
                message: 'Chủ nhà đã ký hợp đồng này rồi',
            });
        }
        if (isTenant && contract.tenantSignature) {
            return res.status(400).json({
                success: false,
                message: 'Người thuê đã ký hợp đồng này rồi',
            });
        }

        // Build update data
        const updateData: any = {
            status: 'PENDING',
        };

        if (isLandlord) {
            updateData.landlordSignature = signature;
        } else {
            updateData.tenantSignature = signature;
        }

        // Tính toán sau khi ký: nếu cả 2 đã ký thì chuyển sang ACTIVE
        const landlordSigAfter = isLandlord ? signature : contract.landlordSignature;
        const tenantSigAfter = isTenant ? signature : contract.tenantSignature;

        if (landlordSigAfter && tenantSigAfter) {
            updateData.status = 'ACTIVE';
            updateData.signedAt = new Date();
            if (txHash) {
                updateData.blockchainTxHash = txHash;
            }
        }

        const updatedContract = await prisma.contract.update({
            where: { id },
            data: updateData,
            include: {
                property: true,
                landlord: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        walletAddress: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        walletAddress: true,
                    },
                },
            },
        });

        const bothSigned = updatedContract.status === 'ACTIVE';

        res.json({
            success: true,
            message: bothSigned
                ? 'Cả hai bên đã ký! Hợp đồng có hiệu lực.'
                : 'Ký hợp đồng thành công! Đang chờ bên còn lại ký.',
            data: { contract: updatedContract },
        });
    } catch (error: any) {
        console.error('Sign contract error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi ký hợp đồng',
        });
    }
};

/**
 * Verify contract by hash (Public)
 */
export const verifyContract = async (req: Request, res: Response) => {
    try {
        const { hash } = req.params;

        const contract = await prisma.contract.findUnique({
            where: { contractHash: hash },
            include: {
                property: {
                    select: {
                        title: true,
                        address: true,
                    },
                },
                landlord: {
                    select: {
                        fullName: true,
                        walletAddress: true,
                    },
                },
                tenant: {
                    select: {
                        fullName: true,
                        walletAddress: true,
                    },
                },
            },
        });

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hợp đồng với hash này',
            });
        }

        res.json({
            success: true,
            message: 'Hợp đồng hợp lệ',
            data: {
                verified: true,
                contract: {
                    hash: contract.contractHash,
                    status: contract.status,
                    signedAt: contract.signedAt,
                    blockchainTx: contract.blockchainTxHash,
                    property: contract.property,
                    landlord: contract.landlord,
                    tenant: contract.tenant,
                },
            },
        });
    } catch (error: any) {
        console.error('Verify contract error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xác minh hợp đồng',
        });
    }
};

/**
 * Generate contract PDF
 */
export const generateContractPDF = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                property: true,
                landlord: true,
                tenant: true,
            },
        });

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hợp đồng',
            });
        }

        if (contract.landlordId !== userId && contract.tenantId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền tải PDF hợp đồng này',
            });
        }

        // Cho phép xuất PDF khi SIGNED hoặc ACTIVE
        if (contract.status !== 'SIGNED' && contract.status !== 'ACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể xuất PDF sau khi hợp đồng đã ký xong',
            });
        }

        const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'contracts');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, `${contract.id}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        const fontCandidates = [
            { regular: 'C:\\Windows\\Fonts\\arial.ttf', bold: 'C:\\Windows\\Fonts\\arialbd.ttf' },
            { regular: 'C:\\Windows\\Fonts\\tahoma.ttf', bold: 'C:\\Windows\\Fonts\\tahomabd.ttf' },
        ];

        let hasCustomFont = false;
        for (const candidate of fontCandidates) {
            if (fs.existsSync(candidate.regular) && fs.existsSync(candidate.bold)) {
                doc.registerFont('ContractRegular', candidate.regular);
                doc.registerFont('ContractBold', candidate.bold);
                hasCustomFont = true;
                break;
            }
        }

        const useRegular = () => doc.font(hasCustomFont ? 'ContractRegular' : 'Helvetica');
        const useBold = () => doc.font(hasCustomFont ? 'ContractBold' : 'Helvetica-Bold');
        const formatMoney = (value: number) =>
            new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
        const formatDate = (value: Date) => new Date(value).toLocaleDateString('vi-VN');

        useBold();
        doc.fontSize(20).text('HOP DONG THUE NHA/DICH VU', { align: 'center' });
        doc.moveDown();

        useRegular();
        doc.fontSize(12);
        doc.text(`Ma hop dong: ${contract.id}`);
        doc.text(`Trang thai: ${contract.status}`);
        if (contract.contractHash) {
            doc.text(`Contract Hash: ${contract.contractHash}`);
        }
        doc.moveDown();

        useBold();
        doc.text('BEN CHO THUE (Ben A):');
        useRegular();
        doc.text(`Ho ten: ${contract.landlord.fullName}`);
        doc.text(`Email: ${contract.landlord.email}`);
        if (contract.landlord.phone) {
            doc.text(`SDT: ${contract.landlord.phone}`);
        }
        if (contract.landlord.walletAddress) {
            doc.text(`Vi: ${contract.landlord.walletAddress}`);
        }
        doc.moveDown();

        useBold();
        doc.text('BEN THUE (Ben B):');
        useRegular();
        doc.text(`Ho ten: ${contract.tenant.fullName}`);
        doc.text(`Email: ${contract.tenant.email}`);
        if (contract.tenant.phone) {
            doc.text(`SDT: ${contract.tenant.phone}`);
        }
        if (contract.tenant.walletAddress) {
            doc.text(`Vi: ${contract.tenant.walletAddress}`);
        }
        doc.moveDown();

        useBold();
        doc.text('THONG TIN PHONG/DIA DIEM:');
        useRegular();
        doc.text(`Tieu de: ${contract.property.title}`);
        doc.text(`Dia chi: ${contract.property.address}, ${contract.property.ward}, ${contract.property.district}, ${contract.property.city}`);
        doc.moveDown();

        useBold();
        doc.text('DIEU KHOAN HOP DONG:');
        doc.moveDown(0.5);
        useRegular();
        doc.fontSize(11).text(contract.terms, { align: 'justify' });
        doc.moveDown();

        useBold();
        doc.fontSize(12).text('THONG TIN THANH TOAN:');
        useRegular();
        doc.text(`Tien thue hang thang: ${formatMoney(contract.monthlyRent)}`);
        doc.text(`Tien dat coc: ${formatMoney(contract.deposit)}`);
        doc.text(`Ngay thanh toan hang thang: Ngay ${contract.paymentDay}`);
        doc.moveDown();

        useBold();
        doc.text('THOI HAN HOP DONG:');
        useRegular();
        doc.text(`Ngay bat dau: ${formatDate(contract.startDate)}`);
        doc.text(`Ngay ket thuc: ${formatDate(contract.endDate)}`);
        doc.moveDown();

        useBold();
        doc.text('TRANG THAI KY KET:');
        useRegular();
        doc.text(`Ben A da ky: ${contract.landlordSignature ? 'Co' : 'Chua'}`);
        doc.text(`Ben B da ky: ${contract.tenantSignature ? 'Co' : 'Chua'}`);
        if (contract.signedAt) {
            doc.text(`Thoi gian ky hoan tat: ${new Date(contract.signedAt).toLocaleString('vi-VN')}`);
        }
        if (contract.blockchainTxHash) {
            doc.text(`Blockchain Tx Hash: ${contract.blockchainTxHash}`);
        }

        doc.end();

        writeStream.on('finish', async () => {
            const relativePath = `/uploads/contracts/${contract.id}.pdf`;

            await prisma.contract.update({
                where: { id },
                data: {
                    contractPdf: relativePath,
                },
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=contract-${contract.id}.pdf`);

            fs.createReadStream(filePath).pipe(res);
        });

        writeStream.on('error', (err) => {
            console.error('Generate PDF write error:', err);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo file PDF',
            });
        });
    } catch (error: any) {
        console.error('Generate PDF error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo PDF',
        });
    }
};
