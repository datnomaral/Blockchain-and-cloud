import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("RentalContractManager", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployContractFixture() {
    const [landlord, tenant, otherAccount] = await ethers.getSigners();

    const RentalContractManager = await ethers.getContractFactory("RentalContractManager");
    const rentalContractManager = await RentalContractManager.deploy();

    return { rentalContractManager, landlord, tenant, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { rentalContractManager } = await loadFixture(deployContractFixture);
      expect(await rentalContractManager.getAddress()).to.be.properAddress;
    });
  });

  describe("Contract Management", function () {
    const contractHash = ethers.id("Sample Contract Content");
    const depositAmount = ethers.parseEther("1");
    const monthlyRent = ethers.parseEther("0.5");

    it("Should create a contract", async function () {
      const { rentalContractManager, landlord, tenant } = await loadFixture(deployContractFixture);

      await expect(rentalContractManager.createContract(
        contractHash,
        tenant.address,
        depositAmount,
        monthlyRent
      )).to.emit(rentalContractManager, "ContractCreated");

      const contract = await rentalContractManager.getContract(contractHash);
      expect(contract.landlord).to.equal(landlord.address);
      expect(contract.tenant).to.equal(tenant.address);
      expect(contract.isActive).to.be.false;
    });

    it("Should allow signing and activate after both signed", async function () {
      const { rentalContractManager, landlord, tenant } = await loadFixture(deployContractFixture);

      await rentalContractManager.createContract(
        contractHash,
        tenant.address,
        depositAmount,
        monthlyRent
      );

      // Landlord signs
      await rentalContractManager.signContract(contractHash);
      let contract = await rentalContractManager.getContract(contractHash);
      expect(contract.landlordSigned).to.be.true;
      expect(contract.isActive).to.be.false;

      // Tenant signs
      await rentalContractManager.connect(tenant).signContract(contractHash);
      contract = await rentalContractManager.getContract(contractHash);
      expect(contract.tenantSigned).to.be.true;
      expect(contract.isActive).to.be.true;
    });

    it("Should verify existence of contract", async function () {
      const { rentalContractManager, tenant } = await loadFixture(deployContractFixture);

      await rentalContractManager.createContract(
        contractHash,
        tenant.address,
        depositAmount,
        monthlyRent
      );

      const [exists, isActive] = await rentalContractManager.verifyContract(contractHash);
      expect(exists).to.be.true;
      expect(isActive).to.be.false;
    });
  });
});
