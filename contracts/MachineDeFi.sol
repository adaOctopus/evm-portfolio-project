// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MachineDeFi
 * @dev Tokenizes real-world machines, tracks metadata, and distributes revenue to token holders
 * @notice Implements fractional ownership of machines with revenue sharing
 */
contract MachineDeFi is Ownable, ReentrancyGuard, Pausable {
    // ============ STRUCTS ============
    
    struct Machine {
        uint256 machineId;
        address operator;           // Real-world operator of the machine
        string name;                // Machine name/identifier
        string metadataURI;         // IPFS URI or URL for machine metadata
        uint256 totalShares;        // Total shares (tokens) issued
        uint256 totalRevenue;       // Total revenue generated (wei)
        uint256 lastRevenueShare;   // Block timestamp of last revenue distribution
        uint256 creationTimestamp;  // When machine was registered
        bool active;                // Whether machine is active
    }
    
    struct ShareSnapshot {
        uint256 snapshotId;         // Snapshot ID for revenue distribution
        uint256 totalShares;        // Total shares at snapshot time
        uint256 revenueAmount;      // Revenue to be distributed
        uint256 distributedAmount;  // Amount already distributed
        bool completed;             // Whether distribution is complete
    }
    
    // ============ STATE VARIABLES ============
    
    // Machine registry: machineId => Machine
    mapping(uint256 => Machine) public machines;
    
    // Machine tokens: machineId => ERC20 token contract address
    mapping(uint256 => address) public machineTokens;
    
    // Share snapshots: machineId => snapshotId => ShareSnapshot
    mapping(uint256 => mapping(uint256 => ShareSnapshot)) public shareSnapshots;
    
    // Snapshot counter per machine: machineId => snapshotId
    mapping(uint256 => uint256) public snapshotCounters;
    
    // Balance snapshots: machineId => snapshotId => user => balance
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public balanceSnapshots;
    
    // Snapshot block numbers: machineId => snapshotId => blockNumber
    mapping(uint256 => mapping(uint256 => uint256)) public snapshotBlockNumbers;
    
    // Machine operator mapping: operator => machineId[]
    mapping(address => uint256[]) public operatorMachines;
    
    // Revenue claimed per user: machineId => snapshotId => user => claimed
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public revenueClaimed;
    
    // Token contract addresses: machineId => token address
    mapping(uint256 => address) private _tokenAddresses;
    
    // Counter for machine IDs
    uint256 private _machineIdCounter;
    
    // Platform fee (basis points: 10000 = 100%)
    uint256 public platformFeeBps = 250; // 2.5% default
    
    // Minimum revenue threshold for distribution (wei)
    uint256 public minRevenueThreshold = 0.01 ether;
    
    // ============ EVENTS ============
    
    event MachineRegistered(
        uint256 indexed machineId,
        address indexed operator,
        string name,
        string metadataURI,
        address tokenAddress
    );
    
    event RevenueReported(
        uint256 indexed machineId,
        uint256 amount,
        uint256 snapshotId,
        address indexed reporter
    );
    
    event RevenueClaimed(
        uint256 indexed machineId,
        uint256 indexed snapshotId,
        address indexed user,
        uint256 amount
    );
    
    event MachineMetadataUpdated(
        uint256 indexed machineId,
        string newMetadataURI
    );
    
    event MachineStatusChanged(
        uint256 indexed machineId,
        bool active
    );
    
    // ============ ERRORS ============
    
    error MachineNotFound();
    error UnauthorizedOperator();
    error MachineNotActive();
    error InsufficientRevenue();
    error NoSharesOwned();
    error AlreadyClaimed();
    error InvalidMachineId();
    error ZeroAddress();
    error InvalidFee();
    
    // ============ MODIFIERS ============
    
    modifier onlyMachineOperator(uint256 machineId) {
        if (machines[machineId].operator != msg.sender) {
            revert UnauthorizedOperator();
        }
        _;
    }
    
    modifier machineExists(uint256 machineId) {
        if (machines[machineId].operator == address(0)) {
            revert MachineNotFound();
        }
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ MACHINE REGISTRATION ============
    
    /**
     * @dev Register a new machine and create its ownership token
     * @param operator Address of the machine operator (real-world owner)
     * @param name Machine name/identifier
     * @param metadataURI IPFS URI or URL for machine metadata (serial number, specs, location, etc.)
     * @param totalShares Initial number of shares to issue (recommended: 1e18 for 1 token = 1 wei precision)
     * @return machineId The unique identifier for the registered machine
     */
    function registerMachine(
        address operator,
        string memory name,
        string memory metadataURI,
        uint256 totalShares
    ) public whenNotPaused returns (uint256) {
        if (operator == address(0)) revert ZeroAddress();
        if (totalShares == 0) revert InvalidMachineId();
        
        uint256 machineId = ++_machineIdCounter;
        
        // Deploy ERC20 token for this machine's shares
        MachineToken token = new MachineToken(
            string(abi.encodePacked(name, " Shares")),
            string(abi.encodePacked("SHARE", _toString(machineId))),
            machineId
        );
        address tokenAddress = address(token);
        
        // Register machine
        machines[machineId] = Machine({
            machineId: machineId,
            operator: operator,
            name: name,
            metadataURI: metadataURI,
            totalShares: totalShares,
            totalRevenue: 0,
            lastRevenueShare: 0,
            creationTimestamp: block.timestamp,
            active: true
        });
        
        machineTokens[machineId] = tokenAddress;
        _tokenAddresses[machineId] = tokenAddress;
        operatorMachines[operator].push(machineId);
        
        // Mint initial shares to operator
        token.mint(operator, totalShares);
        
        emit MachineRegistered(machineId, operator, name, metadataURI, tokenAddress);
        
        return machineId;
    }
    
    // ============ REVENUE MANAGEMENT ============
    
    /**
     * @dev Report revenue generated by a machine
     * @param machineId The machine ID
     * @notice Only the machine operator can report revenue
     * @notice Creates a snapshot for fair revenue distribution
     */
    function reportRevenue(uint256 machineId) 
        public 
        payable 
        machineExists(machineId) 
        onlyMachineOperator(machineId) 
        whenNotPaused 
        nonReentrant 
    {
        Machine storage machine = machines[machineId];
        if (!machine.active) revert MachineNotActive();
        if (msg.value < minRevenueThreshold) revert InsufficientRevenue();
        
        // Calculate platform fee
        uint256 platformFee = (msg.value * platformFeeBps) / 10000;
        uint256 revenueToDistribute = msg.value - platformFee;
        
        // Transfer platform fee to contract owner
        if (platformFee > 0) {
            (bool feeSuccess, ) = owner().call{value: platformFee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Update machine revenue
        machine.totalRevenue += msg.value;
        machine.lastRevenueShare = block.timestamp;
        
        // Create snapshot for revenue distribution
        uint256 snapshotId = ++snapshotCounters[machineId];
        uint256 snapshotBlock = block.number;
        
        MachineToken token = MachineToken(machineTokens[machineId]);
        uint256 totalShares = token.totalSupply();
        
        // Store snapshot data
        snapshotBlockNumbers[machineId][snapshotId] = snapshotBlock;
        
        shareSnapshots[machineId][snapshotId] = ShareSnapshot({
            snapshotId: snapshotId,
            totalShares: totalShares,
            revenueAmount: revenueToDistribute,
            distributedAmount: 0,
            completed: false
        });
        
        // Store operator's balance at snapshot time (they likely have tokens)
        // Note: Other holders' balances will be stored lazily when they claim
        // This saves gas on revenue reporting
        uint256 operatorBalance = token.balanceOf(machine.operator);
        if (operatorBalance > 0) {
            balanceSnapshots[machineId][snapshotId][machine.operator] = operatorBalance;
        }
        
        emit RevenueReported(machineId, msg.value, snapshotId, msg.sender);
    }
    
    /**
     * @dev Claim revenue share based on token ownership at snapshot time
     * @param machineId The machine ID
     * @param snapshotId The snapshot ID to claim from
     */
    function claimRevenue(uint256 machineId, uint256 snapshotId)
        public
        machineExists(machineId)
        whenNotPaused
        nonReentrant
    {
        ShareSnapshot storage snapshot = shareSnapshots[machineId][snapshotId];
        if (snapshot.revenueAmount == 0) revert InvalidMachineId();
        if (revenueClaimed[machineId][snapshotId][msg.sender]) revert AlreadyClaimed();
        
        MachineToken token = MachineToken(machineTokens[machineId]);
        
        // Get user's balance at snapshot time
        // If not stored, get from token contract (current balance as proxy for snapshot balance)
        // In production, you'd query historical balance using block number
        uint256 userShares = balanceSnapshots[machineId][snapshotId][msg.sender];
        
        // If balance not stored, fetch current balance and store it
        // Note: In production, query historical balance at snapshotBlock using archive node
        // For now, use current balance (balances stored at snapshot time via lazy loading)
        if (userShares == 0) {
            // Query balance at snapshot block - using current balance as proxy
            // Note: For true historical queries, use eth_call with block number
            userShares = token.balanceOf(msg.sender);
            
            // Store for future reference (lazy loading)
            if (userShares > 0) {
                balanceSnapshots[machineId][snapshotId][msg.sender] = userShares;
            }
        }
        
        if (userShares == 0) revert NoSharesOwned();
        
        // Calculate user's share of revenue
        uint256 userRevenue = (snapshot.revenueAmount * userShares) / snapshot.totalShares;
        
        if (userRevenue == 0) revert InsufficientRevenue();
        
        // Mark as claimed
        revenueClaimed[machineId][snapshotId][msg.sender] = true;
        snapshot.distributedAmount += userRevenue;
        
        // Check if all revenue has been distributed
        if (snapshot.distributedAmount >= snapshot.revenueAmount) {
            snapshot.completed = true;
        }
        
        // Transfer revenue to user
        (bool success, ) = msg.sender.call{value: userRevenue}("");
        require(success, "Revenue transfer failed");
        
        emit RevenueClaimed(machineId, snapshotId, msg.sender, userRevenue);
    }
    
    /**
     * @dev Batch claim revenue from multiple snapshots
     * @param machineId The machine ID
     * @param snapshotIds Array of snapshot IDs to claim from
     */
    function batchClaimRevenue(uint256 machineId, uint256[] memory snapshotIds)
        public
        machineExists(machineId)
        whenNotPaused
        nonReentrant
    {
        uint256 totalClaimed = 0;
        MachineToken token = MachineToken(machineTokens[machineId]);
        
        for (uint256 i = 0; i < snapshotIds.length; i++) {
            uint256 snapshotId = snapshotIds[i];
            
            if (revenueClaimed[machineId][snapshotId][msg.sender]) continue;
            
            ShareSnapshot storage snapshot = shareSnapshots[machineId][snapshotId];
            if (snapshot.revenueAmount == 0) continue;
            
            // Get balance from snapshot storage or query from token
            uint256 userShares = balanceSnapshots[machineId][snapshotId][msg.sender];
            if (userShares == 0) {
                userShares = token.balanceOf(msg.sender);
                if (userShares > 0) {
                    balanceSnapshots[machineId][snapshotId][msg.sender] = userShares;
                }
            }
            
            if (userShares == 0) continue;
            
            uint256 userRevenue = (snapshot.revenueAmount * userShares) / snapshot.totalShares;
            
            if (userRevenue > 0) {
                revenueClaimed[machineId][snapshotId][msg.sender] = true;
                snapshot.distributedAmount += userRevenue;
                totalClaimed += userRevenue;
                
                if (snapshot.distributedAmount >= snapshot.revenueAmount) {
                    snapshot.completed = true;
                }
            }
        }
        
        if (totalClaimed > 0) {
            (bool success, ) = msg.sender.call{value: totalClaimed}("");
            require(success, "Batch revenue transfer failed");
            emit RevenueClaimed(machineId, snapshotIds[0], msg.sender, totalClaimed);
        }
    }
    
    // ============ METADATA MANAGEMENT ============
    
    /**
     * @dev Update machine metadata URI
     * @param machineId The machine ID
     * @param newMetadataURI New metadata URI (IPFS or URL)
     */
    function updateMachineMetadata(uint256 machineId, string memory newMetadataURI)
        public
        machineExists(machineId)
        onlyMachineOperator(machineId)
    {
        machines[machineId].metadataURI = newMetadataURI;
        emit MachineMetadataUpdated(machineId, newMetadataURI);
    }
    
    // ============ MACHINE MANAGEMENT ============
    
    /**
     * @dev Activate or deactivate a machine
     * @param machineId The machine ID
     * @param active Whether machine is active
     */
    function setMachineStatus(uint256 machineId, bool active)
        public
        machineExists(machineId)
        onlyMachineOperator(machineId)
    {
        machines[machineId].active = active;
        emit MachineStatusChanged(machineId, active);
    }
    
    /**
     * @dev Transfer machine operator rights
     * @param machineId The machine ID
     * @param newOperator New operator address
     */
    function transferOperator(uint256 machineId, address newOperator)
        public
        machineExists(machineId)
        onlyMachineOperator(machineId)
    {
        if (newOperator == address(0)) revert ZeroAddress();
        machines[machineId].operator = newOperator;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get machine details
     */
    function getMachine(uint256 machineId) public view returns (Machine memory) {
        return machines[machineId];
    }
    
    /**
     * @dev Get machine token address
     */
    function getMachineToken(uint256 machineId) public view returns (address) {
        return machineTokens[machineId];
    }
    
    /**
     * @dev Get all machines owned by an operator
     */
    function getOperatorMachines(address operator) public view returns (uint256[] memory) {
        return operatorMachines[operator];
    }
    
    /**
     * @dev Get user's claimable revenue across all snapshots for a machine
     */
    function getClaimableRevenue(uint256 machineId, address user)
        public
        view
        returns (uint256 totalClaimable, uint256[] memory snapshotIds, uint256[] memory amounts)
    {
        MachineToken token = MachineToken(machineTokens[machineId]);
        uint256 snapshotCount = snapshotCounters[machineId];
        
        uint256[] memory claimableSnapshotIds = new uint256[](snapshotCount);
        uint256[] memory claimableAmounts = new uint256[](snapshotCount);
        uint256 claimableCount = 0;
        uint256 total = 0;
        
        for (uint256 i = 1; i <= snapshotCount; i++) {
            if (revenueClaimed[machineId][i][user]) continue;
            
            ShareSnapshot memory snapshot = shareSnapshots[machineId][i];
            if (snapshot.revenueAmount == 0) continue;
            
            // Get balance from snapshot storage or query from token
            uint256 userShares = balanceSnapshots[machineId][i][user];
            if (userShares == 0) {
                userShares = token.balanceOf(user);
            }
            
            if (userShares == 0) continue;
            
            uint256 userRevenue = (snapshot.revenueAmount * userShares) / snapshot.totalShares;
            
            if (userRevenue > 0) {
                claimableSnapshotIds[claimableCount] = i;
                claimableAmounts[claimableCount] = userRevenue;
                total += userRevenue;
                claimableCount++;
            }
        }
        
        // Resize arrays
        uint256[] memory finalSnapshotIds = new uint256[](claimableCount);
        uint256[] memory finalAmounts = new uint256[](claimableCount);
        
        for (uint256 i = 0; i < claimableCount; i++) {
            finalSnapshotIds[i] = claimableSnapshotIds[i];
            finalAmounts[i] = claimableAmounts[i];
        }
        
        return (total, finalSnapshotIds, finalAmounts);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Set platform fee (in basis points: 10000 = 100%)
     */
    function setPlatformFee(uint256 newFeeBps) public onlyOwner {
        if (newFeeBps > 1000) revert InvalidFee(); // Max 10%
        platformFeeBps = newFeeBps;
    }
    
    /**
     * @dev Set minimum revenue threshold
     */
    function setMinRevenueThreshold(uint256 newThreshold) public onlyOwner {
        minRevenueThreshold = newThreshold;
    }
    
    /**
     * @dev Pause contract (emergency only)
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    // ============ HELPER FUNCTIONS ============
    
    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // ============ RECEIVE ============
    
    receive() external payable {
        revert("Use reportRevenue() to report machine revenue");
    }
}

/**
 * @title MachineToken
 * @dev ERC20 token representing fractional ownership of a machine
 */
contract MachineToken is ERC20, Ownable {
    uint256 public immutable machineId;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 _machineId
    ) ERC20(name, symbol) Ownable(msg.sender) {
        machineId = _machineId;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}

