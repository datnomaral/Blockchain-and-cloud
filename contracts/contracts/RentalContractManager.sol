// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title RentalContractManager
 * @dev Smart Contract for managing rental contracts on blockchain
 * @notice This contract stores hashes of rental contracts to ensure immutability
 */
contract RentalContractManager {
    // Struct to store contract information
    struct ContractInfo {
        bytes32 contractHash;      // SHA-256 hash of contract
        address landlord;          // Landlord wallet address
        address tenant;            // Tenant wallet address
        uint256 timestamp;         // Timestamp when contract was last updated/fully signed
        bool isActive;             // Contract status (active/inactive)
        bool landlordSigned;       // Landlord signature status
        bool tenantSigned;         // Tenant signature status
        uint256 depositAmount;     // Agreed deposit amount (off-chain currency or on-chain token unit)
        uint256 monthlyRent;       // Agreed monthly rent amount
        bool depositPaid;          // Whether deposit has been marked as paid
        bool depositRefunded;      // Whether deposit has been refunded
        uint256 totalPaid;         // Total amount of rent payments recorded
    }

    // Mapping from contract hash to contract info
    mapping(bytes32 => ContractInfo) public contracts;

    // Array to track all contract hashes
    bytes32[] public contractHashes;

    // Events
    event ContractCreated(
        bytes32 indexed contractHash,
        address indexed landlord,
        address indexed tenant,
        uint256 timestamp
    );

    event ContractSigned(
        bytes32 indexed contractHash,
        address indexed signer,
        bool isLandlord,
        uint256 timestamp
    );

    event ContractFullySigned(
        bytes32 indexed contractHash,
        uint256 timestamp
    );

    event ContractTerminated(
        bytes32 indexed contractHash,
        uint256 timestamp
    );

    event DepositPaid(
        bytes32 indexed contractHash,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );

    event RentPaid(
        bytes32 indexed contractHash,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );

    event DepositRefunded(
        bytes32 indexed contractHash,
        address indexed receiver,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Create a new rental contract
     * @param _contractHash SHA-256 hash of the contract
     * @param _tenant Address of the tenant
     * @param _depositAmount Agreed deposit amount (metadata)
     * @param _monthlyRent Agreed monthly rent amount (metadata)
     */
    function createContract(
        bytes32 _contractHash,
        address _tenant,
        uint256 _depositAmount,
        uint256 _monthlyRent
    ) external {
        require(_contractHash != bytes32(0), "Invalid contract hash");
        require(_tenant != address(0), "Invalid tenant address");
        require(contracts[_contractHash].contractHash == bytes32(0), "Contract already exists");
        require(msg.sender != _tenant, "Landlord and tenant cannot be the same");
        require(_depositAmount > 0, "Deposit must be greater than 0");
        require(_monthlyRent > 0, "Monthly rent must be greater than 0");

        contracts[_contractHash] = ContractInfo({
            contractHash: _contractHash,
            landlord: msg.sender,
            tenant: _tenant,
            timestamp: block.timestamp,
            isActive: false,
            landlordSigned: false,
            tenantSigned: false,
            depositAmount: _depositAmount,
            monthlyRent: _monthlyRent,
            depositPaid: false,
            depositRefunded: false,
            totalPaid: 0
        });

        contractHashes.push(_contractHash);

        emit ContractCreated(_contractHash, msg.sender, _tenant, block.timestamp);
    }

    /**
     * @dev Sign a contract (can be called by landlord or tenant)
     * @param _contractHash Hash of the contract to sign
     */
    function signContract(bytes32 _contractHash) external {
        ContractInfo storage contractInfo = contracts[_contractHash];
        
        require(contractInfo.contractHash != bytes32(0), "Contract does not exist");
        require(
            msg.sender == contractInfo.landlord || msg.sender == contractInfo.tenant,
            "Only landlord or tenant can sign"
        );

        bool isLandlord = msg.sender == contractInfo.landlord;

        if (isLandlord) {
            require(!contractInfo.landlordSigned, "Landlord already signed");
            contractInfo.landlordSigned = true;
        } else {
            require(!contractInfo.tenantSigned, "Tenant already signed");
            contractInfo.tenantSigned = true;
        }

        emit ContractSigned(_contractHash, msg.sender, isLandlord, block.timestamp);

        // If both parties signed, activate the contract
        if (contractInfo.landlordSigned && contractInfo.tenantSigned) {
            contractInfo.isActive = true;
            contractInfo.timestamp = block.timestamp;
            emit ContractFullySigned(_contractHash, block.timestamp);
        }
    }

    /**
     * @dev Verify if a contract exists and is valid
     * @param _contractHash Hash of the contract to verify
     * @return exists Whether the contract exists
     * @return isActive Whether the contract is active
     * @return landlord Address of the landlord
     * @return tenant Address of the tenant
     * @return timestamp When the contract was fully signed
     */
    function verifyContract(bytes32 _contractHash)
        external
        view
        returns (
            bool exists,
            bool isActive,
            address landlord,
            address tenant,
            uint256 timestamp,
            bool landlordSigned,
            bool tenantSigned
        )
    {
        ContractInfo memory contractInfo = contracts[_contractHash];
        
        exists = contractInfo.contractHash != bytes32(0);
        isActive = contractInfo.isActive;
        landlord = contractInfo.landlord;
        tenant = contractInfo.tenant;
        timestamp = contractInfo.timestamp;
        landlordSigned = contractInfo.landlordSigned;
        tenantSigned = contractInfo.tenantSigned;
    }

    /**
     * @dev Get contract details
     * @param _contractHash Hash of the contract
     * @return ContractInfo structure
     */
    function getContract(bytes32 _contractHash)
        external
        view
        returns (ContractInfo memory)
    {
        require(contracts[_contractHash].contractHash != bytes32(0), "Contract does not exist");
        return contracts[_contractHash];
    }

    /**
     * @dev Terminate a contract (can only be called by landlord or tenant)
     * @param _contractHash Hash of the contract to terminate
     */
    function terminateContract(bytes32 _contractHash) external {
        ContractInfo storage contractInfo = contracts[_contractHash];
        
        require(contractInfo.contractHash != bytes32(0), "Contract does not exist");
        require(
            msg.sender == contractInfo.landlord || msg.sender == contractInfo.tenant,
            "Only landlord or tenant can terminate"
        );
        require(contractInfo.isActive, "Contract is not active");

        contractInfo.isActive = false;

        emit ContractTerminated(_contractHash, block.timestamp);
    }

    /**
     * @dev Mark deposit as paid (off-chain payment record)
     * @notice This function does NOT transfer funds. It only records that the deposit was paid,
     *         allowing the on-chain state to reflect the real-world payment.
     * @param _contractHash Hash of the contract
     * @param _amount Amount of the deposit paid (for auditing/metadata)
     */
    function markDepositPaid(bytes32 _contractHash, uint256 _amount) external {
        ContractInfo storage contractInfo = contracts[_contractHash];

        require(contractInfo.contractHash != bytes32(0), "Contract does not exist");
        require(
            msg.sender == contractInfo.landlord || msg.sender == contractInfo.tenant,
            "Only landlord or tenant can update deposit"
        );
        require(!contractInfo.depositPaid, "Deposit already marked as paid");
        require(_amount > 0, "Amount must be greater than 0");

        contractInfo.depositPaid = true;

        emit DepositPaid(_contractHash, msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Record a rent payment (off-chain payment record)
     * @notice This function does NOT transfer funds. It only records that a rent payment occurred.
     * @param _contractHash Hash of the contract
     * @param _amount Amount of rent paid
     */
    function recordRentPayment(bytes32 _contractHash, uint256 _amount) external {
        ContractInfo storage contractInfo = contracts[_contractHash];

        require(contractInfo.contractHash != bytes32(0), "Contract does not exist");
        require(
            msg.sender == contractInfo.landlord || msg.sender == contractInfo.tenant,
            "Only landlord or tenant can record payment"
        );
        require(contractInfo.isActive, "Contract is not active");
        require(_amount > 0, "Amount must be greater than 0");

        contractInfo.totalPaid += _amount;

        emit RentPaid(_contractHash, msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Mark deposit as refunded (off-chain refund record)
     * @notice This function does NOT transfer funds. It only records that the deposit was refunded.
     * @param _contractHash Hash of the contract
     * @param _amount Amount of deposit refunded
     */
    function markDepositRefunded(bytes32 _contractHash, uint256 _amount) external {
        ContractInfo storage contractInfo = contracts[_contractHash];

        require(contractInfo.contractHash != bytes32(0), "Contract does not exist");
        require(
            msg.sender == contractInfo.landlord || msg.sender == contractInfo.tenant,
            "Only landlord or tenant can update refund"
        );
        require(contractInfo.depositPaid, "Deposit not marked as paid yet");
        require(!contractInfo.depositRefunded, "Deposit already refunded");
        require(_amount > 0, "Amount must be greater than 0");

        contractInfo.depositRefunded = true;

        emit DepositRefunded(_contractHash, msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Get total number of contracts
     * @return Total number of contracts
     */
    function getTotalContracts() external view returns (uint256) {
        return contractHashes.length;
    }

    /**
     * @dev Get all contract hashes
     * @return Array of all contract hashes
     */
    function getAllContractHashes() external view returns (bytes32[] memory) {
        return contractHashes;
    }

    /**
     * @dev Get contracts by user (landlord or tenant)
     * @param _user Address of the user
     * @return Array of contract hashes where user is involved
     */
    function getContractsByUser(address _user) external view returns (bytes32[] memory) {
        uint256 count = 0;
        
        // Count contracts
        for (uint256 i = 0; i < contractHashes.length; i++) {
            ContractInfo memory contractInfo = contracts[contractHashes[i]];
            if (contractInfo.landlord == _user || contractInfo.tenant == _user) {
                count++;
            }
        }

        // Create array
        bytes32[] memory userContracts = new bytes32[](count);
        uint256 index = 0;

        // Fill array
        for (uint256 i = 0; i < contractHashes.length; i++) {
            ContractInfo memory contractInfo = contracts[contractHashes[i]];
            if (contractInfo.landlord == _user || contractInfo.tenant == _user) {
                userContracts[index] = contractHashes[i];
                index++;
            }
        }

        return userContracts;
    }
}
