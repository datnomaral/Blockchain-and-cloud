import { ethers } from 'ethers';
import { connectWallet } from './wallet';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const CONTRACT_ABI = [
    // create + sign + verify
    'function createContract(bytes32 _contractHash, address _tenant, uint256 _depositAmount, uint256 _monthlyRent) external',
    'function signContract(bytes32 _contractHash) external',
    'function verifyContract(bytes32 _contractHash) external view returns (bool exists, bool isActive, address landlord, address tenant, uint256 timestamp, bool landlordSigned, bool tenantSigned)',
    // payment-related metadata
    'function markDepositPaid(bytes32 _contractHash, uint256 _amount) external',
    'function recordRentPayment(bytes32 _contractHash, uint256 _amount) external',
    'function markDepositRefunded(bytes32 _contractHash, uint256 _amount) external',
];

const toBytes32FromHex = (hash: string): string => {
    if (!hash) {
        throw new Error('Contract hash không hợp lệ');
    }
    if (!hash.startsWith('0x')) {
        return `0x${hash}`;
    }
    return hash;
};

/**
 * Lấy gas overrides phù hợp với Polygon Amoy.
 * Amoy yêu cầu maxPriorityFeePerGas tối thiểu 25 Gwei.
 * Chúng ta lấy fee data từ network rồi đảm bảo đủ minimum.
 */
const getGasOverrides = async (provider: ethers.BrowserProvider) => {
    const feeData = await provider.getFeeData();

    // Minimum 30 Gwei để đảm bảo qua được Amoy
    const MIN_PRIORITY_FEE = ethers.parseUnits('30', 'gwei');
    const MIN_MAX_FEE = ethers.parseUnits('60', 'gwei');

    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > MIN_PRIORITY_FEE
        ? feeData.maxPriorityFeePerGas
        : MIN_PRIORITY_FEE;

    const maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas > MIN_MAX_FEE
        ? feeData.maxFeePerGas
        : MIN_MAX_FEE;

    return { maxPriorityFeePerGas, maxFeePerGas };
};

const getContractInstance = async () => {
    if (!CONTRACT_ADDRESS) {
        throw new Error('Chưa cấu hình NEXT_PUBLIC_CONTRACT_ADDRESS trong .env.local');
    }

    const wallet = await connectWallet();
    if (!wallet) {
        throw new Error('Chưa kết nối ví');
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet.signer);
    return { contract, wallet };
};

/**
 * Kiểm tra hợp đồng đã tồn tại trên blockchain chưa
 */
export const onChainVerifyContract = async (contractHash: string): Promise<{
    exists: boolean;
    isActive: boolean;
    landlordSigned: boolean;
    tenantSigned: boolean;
}> => {
    if (!CONTRACT_ADDRESS) {
        throw new Error('Chưa cấu hình NEXT_PUBLIC_CONTRACT_ADDRESS');
    }

    const wallet = await connectWallet();
    if (!wallet) throw new Error('Chưa kết nối ví');

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet.provider);
    const hashBytes32 = toBytes32FromHex(contractHash);

    const result = await contract.verifyContract(hashBytes32);
    return {
        exists: result[0],
        isActive: result[1],
        landlordSigned: result[5],
        tenantSigned: result[6],
    };
};

export const onChainCreateContract = async (params: {
    contractHash: string;
    tenantWallet: string;
    depositAmount: number;
    monthlyRent: number;
}) => {
    const { contract, wallet } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(params.contractHash);
    const gasOverrides = await getGasOverrides(wallet.provider);

    const tx = await contract.createContract(
        hashBytes32,
        params.tenantWallet,
        BigInt(Math.round(params.depositAmount)),
        BigInt(Math.round(params.monthlyRent)),
        gasOverrides
    );

    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};

export const onChainSignContract = async (contractHash: string) => {
    const { contract, wallet } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(contractHash);
    const gasOverrides = await getGasOverrides(wallet.provider);

    const tx = await contract.signContract(hashBytes32, gasOverrides);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};

export const onChainMarkDepositPaid = async (contractHash: string, amount: number) => {
    const { contract, wallet } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(contractHash);
    const gasOverrides = await getGasOverrides(wallet.provider);

    const tx = await contract.markDepositPaid(hashBytes32, BigInt(amount), gasOverrides);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};

export const onChainRecordRentPayment = async (contractHash: string, amount: number) => {
    const { contract, wallet } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(contractHash);
    const gasOverrides = await getGasOverrides(wallet.provider);

    const tx = await contract.recordRentPayment(hashBytes32, BigInt(amount), gasOverrides);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};

export const onChainMarkDepositRefunded = async (contractHash: string, amount: number) => {
    const { contract, wallet } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(contractHash);
    const gasOverrides = await getGasOverrides(wallet.provider);

    const tx = await contract.markDepositRefunded(hashBytes32, BigInt(amount), gasOverrides);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};
