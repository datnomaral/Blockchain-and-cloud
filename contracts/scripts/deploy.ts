import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying RentalContractManager smart contract...\n");

    // Get the contract factory
    const RentalContractManager = await ethers.getContractFactory("RentalContractManager");

    // Deploy the contract
    console.log("⏳ Deploying contract...");
    const rentalContract = await RentalContractManager.deploy();

    await rentalContract.waitForDeployment();

    const address = await rentalContract.getAddress();

    console.log("✅ RentalContractManager deployed successfully!");
    console.log(`📍 Contract Address: ${address}`);
    console.log(`🔗 Network: ${(await ethers.provider.getNetwork()).name}`);
    console.log(`⛽ Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);

    // Get deployer info
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployed by: ${deployer.address}`);
    console.log(`💰 Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

    console.log("📋 Next steps:");
    console.log("1. Update backend/.env with CONTRACT_ADDRESS");
    console.log("2. Update frontend/.env.local with NEXT_PUBLIC_CONTRACT_ADDRESS");
    console.log(`3. Verify contract on Polygonscan (if on testnet/mainnet)\n`);

    console.log(`Contract Address to copy: ${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
