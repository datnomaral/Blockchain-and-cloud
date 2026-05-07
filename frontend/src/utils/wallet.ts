import { ethers } from 'ethers';

export interface WalletInfo {
    address: string;
    provider: ethers.BrowserProvider;
    signer: ethers.Signer;
}

export const connectWallet = async (): Promise<WalletInfo | null> => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask chưa được cài đặt');
    }

    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Check and switch network if necessary
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const amoyChainId = '0x13882'; // 80002 in hex

        if (chainId !== amoyChainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: amoyChainId }],
                });
            } catch (switchError: any) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: amoyChainId,
                                chainName: 'Polygon Amoy Testnet',
                                nativeCurrency: {
                                    name: 'POL',
                                    symbol: 'POL',
                                    decimals: 18,
                                },
                                rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                                blockExplorerUrls: ['https://amoy.polygonscan.com/'],
                            },
                        ],
                    });
                } else {
                    throw switchError;
                }
            }
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        return { address, provider, signer };
    } catch (error: any) {
        console.error('Error connecting wallet:', error);
        throw new Error(error.message || 'Không thể kết nối MetaMask');
    }
};

export const selectWallet = async (): Promise<WalletInfo | null> => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask chưa được cài đặt');
    }

    try {
        await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
        });
    } catch (error: any) {
        if (error?.code === 4001) {
            throw new Error('Bạn đã hủy chọn ví');
        }
        throw error;
    }

    return connectWallet();
};

export const signMessage = async (message: string): Promise<string> => {
    const wallet = await connectWallet();
    if (!wallet) throw new Error('Chưa kết nối ví');

    try {
        const signature = await wallet.signer.signMessage(message);
        return signature;
    } catch (error: any) {
        console.error('Error signing message:', error);
        throw new Error('Người dùng từ chối ký');
    }
};

export const verifySignature = (
    message: string,
    signature: string,
    address: string
): boolean => {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch {
        return false;
    }
};

// Declare ethereum in window object
declare global {
    interface Window {
        ethereum?: any;
    }
}
