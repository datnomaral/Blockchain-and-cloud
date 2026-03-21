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

    // Ensure 0x prefix
    if (!hash.startsWith('0x')) {
        return `0x${hash}`;
    }
    return hash;
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

export const onChainCreateContract = async (params: {
    contractHash: string;
    tenantWallet: string;
    depositAmount: number;
    monthlyRent: number;
}) => {
    const { contract } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(params.contractHash);

    // Lưu ý: depositAmount, monthlyRent đang được truyền trực tiếp (đơn vị tuỳ ý, thường là off-chain VND hoặc on-chain token unit)
    const tx = await contract.createContract(
        hashBytes32,
        params.tenantWallet,
        BigInt(params.depositAmount),
        BigInt(params.monthlyRent)
    );

    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};

export const onChainSignContract = async (contractHash: string) => {
    const { contract } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(contractHash);

    const tx = await contract.signContract(hashBytes32);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};

export const onChainMarkDepositPaid = async (contractHash: string, amount: number) => {
    const { contract } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(contractHash);

    const tx = await contract.markDepositPaid(hashBytes32, BigInt(amount));
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};

export const onChainRecordRentPayment = async (contractHash: string, amount: number) => {
    const { contract } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(contractHash);

    const tx = await contract.recordRentPayment(hashBytes32, BigInt(amount));
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};

export const onChainMarkDepositRefunded = async (contractHash: string, amount: number) => {
    const { contract } = await getContractInstance();
    const hashBytes32 = toBytes32FromHex(contractHash);

    const tx = await contract.markDepositRefunded(hashBytes32, BigInt(amount));
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
};

