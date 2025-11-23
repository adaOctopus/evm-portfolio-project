# OpenZeppelin Security & Access Control Examples

This document explains the example contracts demonstrating OpenZeppelin's security and access control features.

## Overview

We've created **4 example contracts** that showcase different OpenZeppelin security patterns:

1. **SecureVault.sol** - Basic security (Ownable, ReentrancyGuard, Pausable)
2. **AccessControlExample.sol** - Role-based access control
3. **TimeLockExample.sol** - Time-delayed operations
4. **MultiRoleToken.sol** - Advanced token with multiple security features

---

## 1. SecureVault.sol

**Purpose**: Demonstrates basic security patterns for a vault that holds ETH.

### OpenZeppelin Features Used:
- ✅ **Ownable** - Simple ownership model
- ✅ **ReentrancyGuard** - Protection against reentrancy attacks
- ✅ **Pausable** - Emergency stop functionality

### Key Security Features:

```solidity
function deposit() public payable whenNotPaused nonReentrant {
    // Non-reentrant: Prevents reentrancy attacks
    // whenNotPaused: Only works when contract is not paused
    deposits[msg.sender] += msg.value;
}
```

**Use Cases**:
- Protecting against reentrancy attacks when sending ETH
- Ability to pause all operations in emergency
- Owner-only emergency withdrawal

**Real-World Example**: Multi-sig wallets, staking contracts, escrow services

---

## 2. AccessControlExample.sol

**Purpose**: Demonstrates role-based access control (RBAC) with multiple roles.

### OpenZeppelin Features Used:
- ✅ **AccessControl** - Role-based permissions system

### Roles Defined:
- `MINTER_ROLE` - Can mint tokens
- `BURNER_ROLE` - Can burn tokens
- `ADMIN_ROLE` - Can grant/revoke other roles
- `DEFAULT_ADMIN_ROLE` - Super admin (can do everything)

### Key Features:

```solidity
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
    // Only addresses with MINTER_ROLE can call this
    balances[to] += amount;
}
```

**Use Cases**:
- Multi-signature operations
- Decentralized organizations (DAOs)
- Contracts with multiple permission levels

**Real-World Example**: 
- Uniswap governance
- Compound protocol roles
- Aave permission system

---

## 3. TimeLockExample.sol

**Purpose**: Demonstrates time-delayed operations for critical changes.

### OpenZeppelin Features Used:
- ✅ **Ownable** - Ownership for proposal creation

### Key Concept:
Critical operations require a waiting period (e.g., 24 hours) before execution. This gives users time to react to proposed changes.

### How It Works:

```solidity
function proposeChange(uint256 newValue, bytes memory data) public onlyOwner {
    bytes32 proposalId = keccak256(abi.encodePacked(newValue, data, block.timestamp));
    uint256 executeTime = block.timestamp + MIN_DELAY; // 24 hours
    
    proposalTimestamps[proposalId] = executeTime;
}

function executeProposal(bytes32 proposalId, ...) public onlyOwner {
    require(block.timestamp >= proposalTimestamps[proposalId], "Proposal not ready");
    // Execute the change
}
```

**Use Cases**:
- Governance proposals
- Parameter changes in DeFi protocols
- Admin function delays

**Real-World Example**:
- Compound governance proposals (3-day timelock)
- MakerDAO governance delays
- Aave parameter updates

---

## 4. MultiRoleToken.sol

**Purpose**: Production-ready ERC20 token with multiple security layers.

### OpenZeppelin Features Used:
- ✅ **ERC20** - Token standard
- ✅ **AccessControl** - Multiple roles (MINTER, BURNER, PAUSER, ADMIN)
- ✅ **Pausable** - Can pause transfers
- ✅ **ReentrancyGuard** - Reentrancy protection

### Roles:
- `MINTER_ROLE` - Can create new tokens
- `BURNER_ROLE` - Can destroy tokens
- `PAUSER_ROLE` - Can pause/unpause the contract
- `DEFAULT_ADMIN_ROLE` - Can manage roles and max supply

### Key Security Features:

```solidity
function mint(address to, uint256 amount) 
    public 
    onlyRole(MINTER_ROLE)    // Only minters
    whenNotPaused            // Not paused
    nonReentrant             // No reentrancy
{
    require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
    _mint(to, amount);
}
```

**Features**:
- ✅ Role-based minting and burning
- ✅ Emergency pause capability
- ✅ Maximum supply cap
- ✅ Reentrancy protection
- ✅ Batch role management

**Use Cases**:
- Enterprise tokens
- Stablecoins
- Governance tokens
- DeFi protocol tokens

**Real-World Example**: 
- USDC (Centrally managed, can freeze)
- USDT (Has multiple roles)
- DAI (Governance-controlled minting)

---

## Comparison: Ownable vs AccessControl

### Ownable (Simple)
```solidity
contract SimpleContract is Ownable {
    function adminFunction() public onlyOwner {
        // Only one address can call this
    }
}
```
- ✅ Simple: One owner
- ❌ Limited: Can't have multiple admins
- ❌ All-or-nothing: Owner has full control

### AccessControl (Advanced)
```solidity
contract AdvancedContract is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    function mint() public onlyRole(MINTER_ROLE) {
        // Multiple addresses with MINTER_ROLE can call this
    }
}
```
- ✅ Flexible: Multiple roles, multiple addresses per role
- ✅ Granular: Different permissions for different functions
- ✅ Scalable: Easy to add new roles

**When to Use**:
- **Ownable**: Simple projects, single admin needed
- **AccessControl**: Complex projects, DAOs, multi-sig operations

---

## Security Patterns Explained

### 1. ReentrancyGuard (`nonReentrant`)

**Problem**: Attackers can call back into your contract during execution.

**Solution**: Lock the function until it completes.

```solidity
function withdraw() public nonReentrant {
    // Contract is "locked" during this execution
    // Even if attacker calls back, function won't execute again
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    // Lock is released after function completes
}
```

### 2. Pausable (`whenNotPaused`)

**Problem**: If a vulnerability is found, you need to stop operations quickly.

**Solution**: Pause button that stops all state-changing functions.

```solidity
function pause() public onlyRole(PAUSER_ROLE) {
    _pause(); // Stops all functions with whenNotPaused modifier
}

function transfer() public whenNotPaused {
    // This won't work when paused
}
```

### 3. AccessControl (`onlyRole`)

**Problem**: Need different permissions for different functions.

**Solution**: Roles that can be assigned to multiple addresses.

```solidity
// Grant role
grantRole(MINTER_ROLE, minterAddress);

// Use in function
function mint() public onlyRole(MINTER_ROLE) {
    // Only addresses with MINTER_ROLE can call
}
```

### 4. TimeLock (Custom Implementation)

**Problem**: Critical changes should have a delay so users can react.

**Solution**: Require a waiting period before execution.

```solidity
uint256 executeTime = block.timestamp + 24 hours;
// Users have 24 hours to see the proposal before it executes
```

---

## Testing the Examples

All examples have comprehensive tests:

```bash
# Test SecureVault
npx hardhat test test/SecureVault.test.ts

# Test MultiRoleToken
npx hardhat test test/MultiRoleToken.test.ts

# Test all
npm test
```

---

## Deployment Examples

```bash
# Deploy SecureVault
npx hardhat run scripts/deploy-secure-vault.ts --network localhost

# Deploy MultiRoleToken
npx hardhat run scripts/deploy-multi-role-token.ts --network localhost
```

---

## Best Practices Demonstrated

1. ✅ **Least Privilege**: Give roles only the permissions they need
2. ✅ **Defense in Depth**: Multiple security layers (pause + reentrancy + access control)
3. ✅ **Fail-Safe Defaults**: Paused by default when needed, roles denied by default
4. ✅ **Transparency**: Events for all important actions
5. ✅ **Upgradeability**: Can add new roles or permissions later

---

## When to Use Each Pattern

| Pattern | Use When | Example |
|---------|----------|---------|
| **Ownable** | Simple single-admin contract | Basic NFT minting |
| **AccessControl** | Multiple admins/roles needed | DAO governance token |
| **ReentrancyGuard** | Sending ETH/tokens externally | Vault, escrow |
| **Pausable** | Need emergency stop | Exchange, marketplace |
| **TimeLock** | Critical parameter changes | DeFi protocol settings |

---

## Summary

OpenZeppelin provides production-ready security building blocks:

1. **Ownable** - Simple ownership ✅
2. **AccessControl** - Advanced role management ✅
3. **ReentrancyGuard** - Attack prevention ✅
4. **Pausable** - Emergency controls ✅
5. **TimeLock** - Governance delays ✅

All these patterns are **audited**, **battle-tested**, and used by projects handling **billions of dollars**.

**Always use OpenZeppelin instead of writing security code from scratch!**

