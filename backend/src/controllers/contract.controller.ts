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

        // Update contract with signature
        const updateData: any = {
            status: 'PENDING',
        };

        if (isLandlord) {
            updateData.landlordSignature = signature;
        } else {
            updateData.tenantSignature = signature;
        }

        // If both signatures exist, mark as signed
        if (
            (isLandlord && contract.tenantSignature) ||
            (isTenant && contract.landlordSignature)
        ) {
            updateData.status = 'SIGNED';
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

        res.json({
            success: true,
            message: 'Ký hợp đồng thành công',
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

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'contracts');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, `${contract.id}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Title
        doc.fontSize(20).text('HỢP ĐỒNG THUÊ NHÀ/DỊCH VỤ', { align: 'center' });
        doc.moveDown();

        // Basic info
        doc.fontSize(12);
        doc.text(`Mã hợp đồng: ${contract.id}`);
        doc.text(`Trạng thái: ${contract.status}`);
        if (contract.contractHash) {
            doc.text(`Contract Hash: ${contract.contractHash}`);
        }
        doc.moveDown();

        // Parties
        doc.font('Helvetica-Bold').text('BÊN CHO THUÊ (Bên A):');
        doc.font('Helvetica').text(`Họ tên: ${contract.landlord.fullName}`);
        doc.text(`Email: ${contract.landlord.email}`);
        if (contract.landlord.phone) {
            doc.text(`SĐT: ${contract.landlord.phone}`);
        }
        if (contract.landlord.walletAddress) {
            doc.text(`Ví: ${contract.landlord.walletAddress}`);
        }
        doc.moveDown();

        doc.font('Helvetica-Bold').text('BÊN THUÊ (Bên B):');
        doc.font('Helvetica').text(`Họ tên: ${contract.tenant.fullName}`);
        doc.text(`Email: ${contract.tenant.email}`);
        if (contract.tenant.phone) {
            doc.text(`SĐT: ${contract.tenant.phone}`);
        }
        if (contract.tenant.walletAddress) {
            doc.text(`Ví: ${contract.tenant.walletAddress}`);
        }
        doc.moveDown();

        // Property
        doc.font('Helvetica-Bold').text('THÔNG TIN PHÒNG/ĐỊA ĐIỂM:');
        doc.font('Helvetica').text(`Tiêu đề: ${contract.property.title}`);
        doc.text(`Địa chỉ: ${contract.property.address}, ${contract.property.ward}, ${contract.property.district}, ${contract.property.city}`);
        doc.moveDown();

        // Terms
        doc.font('Helvetica-Bold').text('ĐIỀU KHOẢN HỢP ĐỒNG:');
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(11).text(contract.terms, {
            align: 'justify',
        });
        doc.moveDown();

        // Payment info
        doc.fontSize(12).font('Helvetica-Bold').text('THÔNG TIN THANH TOÁN:');
        doc.font('Helvetica');
        doc.text(`Tiền thuê hàng tháng: ${contract.monthlyRent} VND`);
        doc.text(`Tiền đặt cọc: ${contract.deposit} VND`);
        doc.text(`Ngày thanh toán hàng tháng: Ngày ${contract.paymentDay}`);
        doc.moveDown();

        // Dates
        doc.font('Helvetica-Bold').text('THỜI HẠN HỢP ĐỒNG:');
        doc.font('Helvetica');
        doc.text(`Ngày bắt đầu: ${contract.startDate.toISOString().substring(0, 10)}`);
        doc.text(`Ngày kết thúc: ${contract.endDate.toISOString().substring(0, 10)}`);
        doc.moveDown();

        // Signatures info
        doc.font('Helvetica-Bold').text('TRẠNG THÁI KÝ KẾT:');
        doc.font('Helvetica');
        doc.text(`Bên A đã ký: ${contract.landlordSignature ? 'Có' : 'Chưa'}`);
        doc.text(`Bên B đã ký: ${contract.tenantSignature ? 'Có' : 'Chưa'}`);
        if (contract.signedAt) {
            doc.text(`Thời gian ký hoàn tất: ${contract.signedAt.toISOString()}`);
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
