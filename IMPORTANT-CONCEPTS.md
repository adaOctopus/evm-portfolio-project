# Web3 DApp Development - Interview Preparation Guide

This document covers common concepts for Web3 DApp development.

---

## 1. Adding Wallet Connection for Another Browser Extension

### How to add support for another wallet extension (like Coinbase Wallet, WalletConnect, etc.)

### Answer:

To add support for multiple wallet extensions, you need to:

1. **Detect available wallet providers** - Check which wallets are installed
2. **Handle multiple providers** - Support switching between wallets
3. **Standardize the interface** - Use EIP-1193 standard (which MetaMask and most wallets follow)

### Implementation:

#### File: `app/hooks/useWallet.ts`

```typescript
// Extend Window interface to include all wallet types
declare global {
  interface Window {
    ethereum?: any;
    coinbaseWalletExtension?: any;
    // WalletConnect can be injected or used via SDK
  }
}

// Function to detect all available wallets
const detectWallets = () => {
  const wallets = [];
  
  // MetaMask
  if (window.ethereum?.isMetaMask) {
    wallets.push({
      name: 'MetaMask',
      provider: window.ethereum,
      icon: '🦊'
    });
  }
  
  // Coinbase Wallet
  if (window.ethereum?.isCoinbaseWallet) {
    wallets.push({
      name: 'Coinbase Wallet',
      provider: window.ethereum,
      icon: '🔵'
    });
  }
  
  // Handle multiple providers (when multiple wallets are installed)
  if (window.ethereum?.providers) {
    window.ethereum.providers.forEach((provider: any) => {
      if (provider.isMetaMask && !wallets.find(w => w.name === 'MetaMask')) {
        wallets.push({ name: 'MetaMask', provider, icon: '🦊' });
      }
      if (provider.isCoinbaseWallet && !wallets.find(w => w.name === 'Coinbase Wallet')) {
        wallets.push({ name: 'Coinbase Wallet', provider, icon: '🔵' });
      }
    });
  }
  
  return wallets;
};

// Updated connectWallet function to accept wallet selection
const connectWallet = async (walletProvider?: any) => {
  setError(null);
  setIsLoading(true);
  
  // Use provided provider or detect default
  let ethereumProvider = walletProvider || window.ethereum;
  
  // If no provider specified, show wallet selection
  if (!ethereumProvider && typeof window !== "undefined") {
    const availableWallets = detectWallets();
    if (availableWallets.length === 0) {
      setError("No wallet extensions found. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.");
      setIsLoading(false);
      return;
    }
    
    // For now, use first available wallet
    // In a real app, you'd show a modal to let user choose
    ethereumProvider = availableWallets[0].provider;
  }
  
  // Rest of connection logic stays the same...
  const accounts = await ethereumProvider.request({
    method: "eth_requestAccounts",
  });
  
  // Create provider and continue...
};
```

#### Alternative: Using WalletConnect SDK

```typescript
// Install: npm install @walletconnect/ethereum-provider

import { EthereumProvider } from '@walletconnect/ethereum-provider';

const connectWalletConnect = async () => {
  const provider = await EthereumProvider.init({
    projectId: 'YOUR_PROJECT_ID', // Get from walletconnect.com
    chains: [1337], // Chain IDs
    showQrModal: true,
  });
  
  await provider.enable();
  
  const accounts = provider.accounts;
  // Use provider similar to MetaMask...
};
```

### Files to Modify:

1. **`app/hooks/useWallet.ts`** - Add wallet detection and selection logic
2. **`app/components/WalletSelector.tsx`** (NEW) - Create a component to let users choose wallet
3. **`package.json`** - Add wallet-specific SDKs if needed (e.g., `@walletconnect/ethereum-provider`)

---

## 2. Interacting with Smart Contracts & Tracing Block Data

### Question: How do you interact with smart contracts or trace block data and communicate it back to the UI?

### Answer:

There are multiple ways to interact with contracts and blockchain data:

### A. Direct Contract Interactions

#### File: `app/lib/contracts/contracts.ts`

```typescript
import { Contract, JsonRpcSigner, formatEther, parseEther } from "ethers";
import { CONTRACT_ADDRESSES } from "./addresses";
import { MyTokenABI } from "./abis";

// Reading from contract (view/pure functions)
export const readContractData = async (signer: JsonRpcSigner) => {
  const contract = new Contract(
    CONTRACT_ADDRESSES.MyToken,
    MyTokenABI,
    signer
  );
  
  // Read data (no transaction, no gas cost)
  const name = await contract.name();
  const totalSupply = await contract.totalSupply();
  const balance = await contract.balanceOf(signer.address);
  
  return { name, totalSupply, balance };
};

// Writing to contract (state-changing functions)
export const writeContract = async (
  signer: JsonRpcSigner,
  recipient: string,
  amount: string
) => {
  const contract = new Contract(
    CONTRACT_ADDRESSES.MyToken,
    MyTokenABI,
    signer
  );
  
  // This creates a transaction
  const tx = await contract.transfer(recipient, parseEther(amount));
  
  // Wait for transaction to be mined
  const receipt = await tx.wait();
  
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
  };
};

// Listening to contract events
export const listenToContractEvents = async (
  signer: JsonRpcSigner,
  callback: (event: any) => void
) => {
  const contract = new Contract(
    CONTRACT_ADDRESSES.MyToken,
    MyTokenABI,
    signer
  );
  
  // Listen to Transfer events
  contract.on("Transfer", (from, to, value, event) => {
    callback({
      from,
      to,
      value: formatEther(value),
      blockNumber: event.blockNumber,
      txHash: event.transactionHash,
    });
  });
  
  // Return cleanup function
  return () => contract.removeAllListeners();
};
```

### B. Tracing Block Data

#### File: `app/lib/blockchain/traceBlock.ts` (NEW)

```typescript
import { JsonRpcProvider } from "ethers";

const provider = new JsonRpcProvider("http://127.0.0.1:8545");

// Get block data
export const getBlockData = async (blockNumber: number | 'latest') => {
  const block = await provider.getBlock(blockNumber);
  
  return {
    number: block?.number,
    hash: block?.hash,
    timestamp: block?.timestamp,
    transactions: block?.transactions,
    gasUsed: block?.gasUsed.toString(),
    gasLimit: block?.gasLimit.toString(),
  };
};

// Get transaction details
export const getTransactionDetails = async (txHash: string) => {
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    gasPrice: tx.gasPrice?.toString(),
    gasLimit: tx.gasLimit.toString(),
    blockNumber: receipt?.blockNumber,
    status: receipt?.status === 1 ? 'success' : 'failed',
    gasUsed: receipt?.gasUsed.toString(),
    logs: receipt?.logs,
  };
};

// Get transaction trace (requires debug_traceTransaction - Hardhat supports this)
export const traceTransaction = async (txHash: string) => {
  const trace = await provider.send("debug_traceTransaction", [
    txHash,
    { tracer: "callTracer" }
  ]);
  
  return trace;
};

// Monitor new blocks
export const monitorBlocks = (
  callback: (blockNumber: number) => void
) => {
  provider.on("block", (blockNumber) => {
    callback(blockNumber);
  });
  
  return () => provider.removeAllListeners();
};
```

### C. Real-time Updates in UI

#### File: `app/hooks/useBlockchainData.ts` (NEW)

```typescript
import { useState, useEffect } from "react";
import { JsonRpcSigner } from "ethers";
import { getBlockData, getTransactionDetails } from "../lib/blockchain/traceBlock";

export const useBlockchainData = (signer: JsonRpcSigner | null) => {
  const [latestBlock, setLatestBlock] = useState<any>(null);
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);
  
  useEffect(() => {
    if (!signer?.provider) return;
    
    const provider = signer.provider;
    
    // Poll for latest block
    const fetchLatestBlock = async () => {
      const block = await getBlockData('latest');
      setLatestBlock(block);
    };
    
    // Listen to new blocks
    provider.on("block", async (blockNumber) => {
      const block = await getBlockData(blockNumber);
      setLatestBlock(block);
    });
    
    // Listen to pending transactions
    provider.on("pending", async (txHash) => {
      try {
        const tx = await provider.getTransaction(txHash);
        if (tx && tx.from === (await signer.getAddress()).toLowerCase()) {
          setPendingTxs(prev => [...prev, tx.hash]);
        }
      } catch (err) {
        console.error("Error fetching pending tx:", err);
      }
    });
    
    fetchLatestBlock();
    
    return () => {
      provider.removeAllListeners();
    };
  }, [signer]);
  
  return { latestBlock, pendingTxs };
};
```

### D. Using in Components

#### File: `app/components/BlockData.tsx` (NEW)

```typescript
"use client";

import { useBlockchainData } from "../hooks/useBlockchainData";
import { useWallet } from "../hooks/useWallet";

export default function BlockData() {
  const { signer } = useWallet();
  const { latestBlock, pendingTxs } = useBlockchainData(signer);
  
  return (
    <div className="rounded-lg border p-4">
      <h3>Latest Block</h3>
      {latestBlock && (
        <div>
          <p>Block Number: {latestBlock.number}</p>
          <p>Gas Used: {latestBlock.gasUsed}</p>
          <p>Timestamp: {new Date(latestBlock.timestamp * 1000).toLocaleString()}</p>
        </div>
      )}
      
      {pendingTxs.length > 0 && (
        <div>
          <h4>Your Pending Transactions</h4>
          {pendingTxs.map(tx => (
            <div key={tx}>{tx}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Key Files:

1. **`app/lib/contracts/contracts.ts`** - Contract interaction functions
2. **`app/lib/blockchain/traceBlock.ts`** (NEW) - Block and transaction tracing utilities
3. **`app/hooks/useBlockchainData.ts`** (NEW) - React hook for real-time blockchain data
4. **`app/components/BlockData.tsx`** (NEW) - UI component to display blockchain data

---

## 3. Gas Optimization & Security Techniques in Smart Contracts

### Question: What techniques should you use for gas optimization and security in contracts?

### Answer:

### A. Gas Optimization Techniques

#### 1. **Pack Storage Variables**

```solidity
// ❌ BAD: 3 storage slots (32 bytes each = 96 bytes total)
contract BadPacking {
    uint256 a;  // slot 0
    uint128 b;  // slot 1
    uint128 c;  // slot 2
}

// ✅ GOOD: 2 storage slots (32 bytes each = 64 bytes total)
contract GoodPacking {
    uint128 a;  // slot 0 (first 16 bytes)
    uint128 b;  // slot 0 (last 16 bytes)
    uint256 c;  // slot 1
}
```

#### 2. **Use Events Instead of Storage for Historical Data**

```solidity
// ❌ BAD: Expensive storage writes
contract Bad {
    mapping(address => uint256[]) public userHistory;
    
    function doSomething() public {
        userHistory[msg.sender].push(block.timestamp); // Expensive!
    }
}

// ✅ GOOD: Use events for historical data
contract Good {
    event UserAction(address indexed user, uint256 timestamp);
    
    function doSomething() public {
        emit UserAction(msg.sender, block.timestamp); // Cheap!
    }
}
```

#### 3. **Use Custom Errors Instead of Require Strings**

```solidity
// ❌ BAD: String errors cost gas
contract Bad {
    function transfer(address to, uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        // ...
    }
}

// ✅ GOOD: Custom errors are cheaper
contract Good {
    error InsufficientBalance(uint256 required, uint256 available);
    
    function transfer(address to, uint256 amount) public {
        if (balanceOf[msg.sender] < amount) {
            revert InsufficientBalance(amount, balanceOf[msg.sender]);
        }
        // ...
    }
}
```

#### 4. **Cache Array Length and Storage Values**

```solidity
// ❌ BAD: Multiple SLOAD operations
contract Bad {
    uint256[] public balances;
    
    function sum() public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < balances.length; i++) {  // SLOAD every iteration
            total += balances[i];  // SLOAD every iteration
        }
        return total;
    }
}

// ✅ GOOD: Cache values
contract Good {
    uint256[] public balances;
    
    function sum() public view returns (uint256) {
        uint256 total = 0;
        uint256 length = balances.length;  // SLOAD once
        for (uint i = 0; i < length; i++) {
            uint256 balance = balances[i];  // SLOAD once per iteration
            total += balance;
        }
        return total;
    }
}
```

#### 5. **Use External for Functions Only Called Externally**

```solidity
// ❌ BAD: public functions have extra overhead
contract Bad {
    function calculate(uint256 x) public pure returns (uint256) {
        return x * 2;
    }
}

// ✅ GOOD: external is cheaper for external calls
contract Good {
    function calculate(uint256 x) external pure returns (uint256) {
        return x * 2;
    }
}
```

### B. Security Techniques

#### 1. **Reentrancy Protection**

```solidity
// ❌ VULNERABLE: Reentrancy attack possible
contract Vulnerable {
    mapping(address => uint256) public balances;
    
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] = 0;  // Too late! Attacker can reenter
    }
}

// ✅ SECURE: Using ReentrancyGuard (OpenZeppelin)
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Secure is ReentrancyGuard {
    mapping(address => uint256) public balances;
    
    function withdraw() public nonReentrant {
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;  // Update state first (CEI pattern)
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
    }
}
```

#### 2. **Access Control**

```solidity
// ✅ GOOD: Using OpenZeppelin Ownable
import "@openzeppelin/contracts/access/Ownable.sol";

contract Secure is Ownable {
    function adminFunction() public onlyOwner {
        // Only owner can call
    }
    
    // Transfer ownership securely
    function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "Invalid address");
        _transferOwnership(newOwner);
    }
}

// ✅ BETTER: Using AccessControl for role-based access
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BetterSecure is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        // Only addresses with MINTER_ROLE can mint
    }
}
```

#### 3. **Integer Overflow Protection**

```solidity
// ✅ GOOD: Solidity 0.8+ has built-in overflow protection
pragma solidity ^0.8.0;

contract SafeMath {
    // No need for SafeMath library in 0.8+
    // Overflow/underflow automatically reverts
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;  // Automatically reverts on overflow
    }
}
```

#### 4. **Validate External Inputs**

```solidity
// ✅ GOOD: Always validate inputs
contract Secure {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        // Input validation
        require(to != address(0), "Cannot transfer to zero address");
        require(to != msg.sender, "Cannot transfer to self");
        require(amount > 0, "Amount must be greater than zero");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // State changes
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        // Emit event
        emit Transfer(msg.sender, to, amount);
    }
}
```

#### 5. **Use Pull Over Push Pattern for Payments**

```solidity
// ❌ BAD: Push pattern (can fail and block withdrawals)
contract Bad {
    mapping(address => uint256) public balances;
    
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);  // Can fail!
    }
}

// ✅ GOOD: Pull pattern (users initiate withdrawal)
contract Good {
    mapping(address => uint256) public balances;
    
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

#### 6. **Pausable for Emergency Stops**

```solidity
// ✅ GOOD: Using OpenZeppelin Pausable
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureContract is Pausable, Ownable {
    function criticalFunction() public whenNotPaused {
        // Can be paused by owner in emergency
    }
    
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
}
```

#### 7. **Time Locks for Critical Operations**

```solidity
// ✅ GOOD: Time lock for critical changes
contract Secure {
    address public admin;
    uint256 public newAdmin;
    uint256 public adminChangeTime;
    uint256 public constant TIMELOCK = 2 days;
    
    function proposeAdminChange(address _newAdmin) public {
        require(msg.sender == admin, "Only admin");
        newAdmin = _newAdmin;
        adminChangeTime = block.timestamp + TIMELOCK;
    }
    
    function executeAdminChange() public {
        require(block.timestamp >= adminChangeTime, "Timelock not expired");
        require(newAdmin != address(0), "Invalid admin");
        admin = newAdmin;
        newAdmin = address(0);
    }
}
```

### Summary of Best Practices:

**Gas Optimization:**
- Pack storage variables efficiently
- Use events for historical data
- Use custom errors instead of require strings
- Cache storage reads
- Use `external` for external-only functions
- Avoid unnecessary loops
- Use `calldata` instead of `memory` for function parameters

**Security:**
- Always use ReentrancyGuard for state-changing external calls
- Implement proper access control (Ownable/AccessControl)
- Validate all external inputs
- Use Pull over Push pattern for payments
- Implement Pausable for emergencies
- Add time locks for critical operations
- Use Solidity 0.8+ for automatic overflow protection
- Follow Checks-Effects-Interactions (CEI) pattern

---

## Quick Reference: Key File Locations

### Wallet Connection:
- `app/hooks/useWallet.ts` - Main wallet connection hook
- `app/lib/contracts/addresses.ts` - Contract addresses
- `app/lib/contracts/abis.ts` - Contract ABIs

### Contract Interactions:
- `app/lib/contracts/contracts.ts` - Contract interaction functions
- `app/components/MintNFTForm.tsx` - Example of contract interaction
- `app/components/VaultForm.tsx` - Example of contract interaction

### Block Data (if implemented):
- `app/lib/blockchain/traceBlock.ts` - Block/transaction tracing
- `app/hooks/useBlockchainData.ts` - React hook for blockchain data

---

## Interview Tips:

1. **Always mention OpenZeppelin** - Industry standard for secure contracts
2. **Explain the why** - Don't just say "use ReentrancyGuard", explain reentrancy attacks
3. **Know the trade-offs** - Gas optimization vs. security vs. readability
4. **Reference real attacks** - DAO hack, reentrancy attacks, etc.
5. **Testing importance** - Mention Hardhat testing, fuzzing, formal verification

