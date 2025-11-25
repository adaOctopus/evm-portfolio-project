# UUPS Upgradeable Contract - Simple Guide

## What is UUPS?

**UUPS (Universal Upgradeable Proxy Standard)** allows you to:
- Deploy a contract that can be upgraded later
- Keep the same address (proxy) while changing the implementation
- Preserve all data when upgrading
- Add new functionality without losing existing state

## How It Works

```
┌─────────────┐
│   Proxy     │  ← This address stays the same
│  (Storage)  │
└──────┬──────┘
       │ forwards calls to
       ▼
┌─────────────┐
│Implementation│ ← This can be upgraded
│   (Logic)   │
└─────────────┘
```

## Quick Start

### 1. Start Local Network
```bash
npm run node
```

### 2. Deploy V1 (in new terminal)
```bash
npm run deploy:counter
```

**Output will show:**
- Proxy Address (save this!)
- Implementation Address

### 3. Upgrade to V2
```bash
PROXY_ADDRESS=0x... npm run upgrade:counter
```

Replace `0x...` with the proxy address from step 2.

## Files Created

- `contracts/SimpleCounterV1.sol` - Initial version (increment only)
- `contracts/SimpleCounterV2.sol` - Upgraded version (increment + decrement)
- `scripts/deploy-counter.ts` - Deployment script
- `scripts/upgrade-counter.ts` - Upgrade script

## Key Concepts

### 1. Storage Layout (CRITICAL!)

**✅ CORRECT - Append new variables:**
```solidity
// V1
uint256 public count;  // Slot 0

// V2
uint256 public count;  // Slot 0 - MUST stay same
uint256 public maxCount;  // Slot 1 - NEW, appended
```

**❌ WRONG - Don't change existing variables:**
```solidity
// V1
uint256 public count;  // Slot 0

// V2
uint256 public maxCount;  // ❌ WRONG! Changed slot 0
uint256 public count;  // ❌ WRONG! Moved to slot 1
```

### 2. Constructor vs Initialize

**Constructor**: Disabled (calls `_disableInitializers()`)
```solidity
constructor() {
    _disableInitializers();
}
```

**Initialize**: Called once on first deployment
```solidity
function initialize(uint256 initialCount) public initializer {
    __Ownable_init(msg.sender);
    __UUPSUpgradeable_init();
    count = initialCount;
}
```

### 3. Authorize Upgrades

Only owner can upgrade:
```solidity
function _authorizeUpgrade(address newImplementation) 
    internal 
    override 
    onlyOwner 
{}
```

## Testing the Upgrade

### Before Upgrade (V1)
```solidity
// Can only increment
counter.increment();  // ✅ Works
counter.decrement();  // ❌ Doesn't exist
```

### After Upgrade (V2)
```solidity
// Can increment AND decrement
counter.increment();  // ✅ Works
counter.decrement();  // ✅ Works (new!)
counter.getMaxCount(); // ✅ Works (new!)
```

## Important Notes

1. **Proxy Address Never Changes** - Use this for all interactions
2. **Data is Preserved** - All storage variables persist
3. **Storage Layout Must Match** - Keep existing variables in same order
4. **Only Owner Can Upgrade** - Controlled by `_authorizeUpgrade`
5. **Implementation Changes** - New code, same proxy

## Troubleshooting

**Error: "Storage layout incompatible"**
- You changed the order of existing storage variables
- Solution: Keep existing variables in same order, only append new ones

**Error: "PROXY_ADDRESS not set"**
- You didn't provide the proxy address
- Solution: `PROXY_ADDRESS=0x... npm run upgrade:counter`

**Error: "Not the owner"**
- You're not the deployer/owner
- Solution: Use the same account that deployed

## Summary

1. Deploy creates Proxy + Implementation
2. Proxy address is what you use
3. Upgrade changes Implementation only
4. Data stays in Proxy (preserved)
5. New functionality available immediately

