# UUPS Upgradeable Contract Guide

## What is UUPS?

**UUPS (Universal Upgradeable Proxy Standard)** allows you to upgrade smart contracts while keeping the same address.

- **Proxy Contract**: The address users interact with (never changes)
- **Implementation Contract**: The actual logic (can be upgraded)

## How It Works

```
User → Proxy → Implementation (V1)
              ↓ (upgrade)
              Implementation (V2)
```

The proxy delegates all calls to the implementation. When you upgrade, only the implementation address changes.

---

## Files Created

1. **`contracts/SimpleStorageV1.sol`** - Initial version (stores a number)
2. **`contracts/SimpleStorageV2.sol`** - Upgraded version (adds counter)
3. **`scripts/deploy-uups.ts`** - Deploy the proxy
4. **`scripts/upgrade-uups.ts`** - Upgrade to V2

---

## Quick Start

### Step 1: Start Local Network

```bash
npm run node
```

Keep this terminal open. In a new terminal:

### Step 2: Deploy V1

```bash
npm run deploy:uups
```

**Output:**
```
✅ Proxy Address (use this!): 0x5FbDB2315678afecb367f032d93F642f64180aa3
📦 Implementation Address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**Save the Proxy Address!** This is what you'll use to interact with the contract.

### Step 3: Upgrade to V2

Set the proxy address and upgrade:

```bash
PROXY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 npm run upgrade:uups
```

Or add to `.env`:
```env
PROXY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Then run:
```bash
npm run upgrade:uups
```

**Output:**
```
✅ Proxy Address (unchanged): 0x5FbDB2315678afecb367f032d93F642f64180aa3
📦 Old Implementation: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
📦 New Implementation: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

Notice: **Proxy address stays the same!**

---

## Key Concepts

### 1. Storage Layout (CRITICAL!)

⚠️ **NEVER change storage variable order or types in upgrades!**

**✅ CORRECT (V1 → V2):**
```solidity
// V1
uint256 public storedValue;  // slot 0

// V2
uint256 public storedValue;  // slot 0 (same!)
uint256 public updateCount;  // slot 1 (new, appended)
```

**❌ WRONG:**
```solidity
// V1
uint256 public storedValue;  // slot 0

// V2
uint256 public updateCount;  // slot 0 (WRONG! Overwrites storedValue)
uint256 public storedValue;  // slot 1 (WRONG! Data lost)
```

### 2. Constructor vs Initialize

**❌ Don't use constructor:**
```solidity
constructor() {
    storedValue = 100;  // Won't work in upgradeable contracts!
}
```

**✅ Use initialize:**
```solidity
function initialize(uint256 initialValue) public initializer {
    __Ownable_init(msg.sender);
    __UUPSUpgradeable_init();
    storedValue = initialValue;
}
```

### 3. _authorizeUpgrade

Only the owner can upgrade (defined in `_authorizeUpgrade`):

```solidity
function _authorizeUpgrade(address newImplementation) 
    internal 
    override 
    onlyOwner 
{}
```

---

## Testing the Upgrade

### Before Upgrade (V1)
```typescript
const contract = await ethers.getContractAt("SimpleStorageV1", PROXY_ADDRESS);
await contract.getValue();  // Returns: 100
await contract.setValue(200);
// No getUpdateCount() - doesn't exist in V1
```

### After Upgrade (V2)
```typescript
const contract = await ethers.getContractAt("SimpleStorageV2", PROXY_ADDRESS);
await contract.getValue();  // Returns: 200 (preserved!)
await contract.getUpdateCount();  // Returns: 1 (new function!)
await contract.setValue(300);  // Now increments counter
await contract.getUpdateCount();  // Returns: 2
```

---

## What Gets Preserved?

✅ **Preserved:**
- All storage variables (if layout unchanged)
- Contract balance (ETH)
- Token balances (if any)
- Owner address
- All state

❌ **Not Preserved:**
- Implementation contract code (replaced)
- Old function logic (replaced with new)

---

## Common Patterns

### Pattern 1: Add New Function

```solidity
// V1
function getValue() public view returns (uint256) {
    return storedValue;
}

// V2 - Add new function
function getValue() public view returns (uint256) {
    return storedValue;
}

function getDoubleValue() public view returns (uint256) {
    return storedValue * 2;  // New function
}
```

### Pattern 2: Modify Function Logic

```solidity
// V1
function setValue(uint256 newValue) public {
    storedValue = newValue;
}

// V2 - Add logic
function setValue(uint256 newValue) public {
    storedValue = newValue;
    updateCount++;  // New logic
}
```

### Pattern 3: Add Storage Variable

```solidity
// V1
uint256 public storedValue;

// V2
uint256 public storedValue;  // Keep existing
uint256 public newVariable;  // Add new (append only!)
```

---

## Security Notes

1. **Only owner can upgrade** (via `_authorizeUpgrade`)
2. **Storage layout must match** (or data will be corrupted)
3. **Test upgrades on testnet first**
4. **Verify implementation** before upgrading on mainnet

---

## Troubleshooting

### Error: "Storage layout incompatible"

**Cause**: Changed storage variable order or type.

**Fix**: Keep all existing variables in same order, only append new ones.

### Error: "Contract is not upgradeable"

**Cause**: Forgot to inherit from `UUPSUpgradeable`.

**Fix**: Add `UUPSUpgradeable` to inheritance.

### Error: "Initializer reverted"

**Cause**: Trying to initialize an already initialized contract.

**Fix**: `initialize()` can only be called once. Use upgrade for changes.

---

## Summary

1. **Deploy**: `npm run deploy:uups` → Get proxy address
2. **Upgrade**: `PROXY_ADDRESS=0x... npm run upgrade:uups`
3. **Remember**: Proxy address stays the same, only implementation changes
4. **Critical**: Never change storage layout order!

