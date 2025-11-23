# Advanced Ethereum Development - Senior Solutions Engineer Guide

This document covers advanced concepts for Senior Solutions Engineer interviews in Ethereum projects.

---

## 1. Upgradeable Contract Patterns

### Question: How would you make contracts upgradeable? Explain different proxy patterns and how to apply them to existing contracts.

### Answer:

Upgradeable contracts allow you to fix bugs, add features, or optimize gas without deploying new contracts. There are three main proxy patterns:

### A. Transparent Proxy Pattern

**Most Common** - Uses a proxy contract that delegates all calls to an implementation contract.

#### How It Works:
- Proxy stores state (storage slots)
- Implementation contract has the logic
- Admin can upgrade implementation while keeping state

#### Example: Making MyToken Upgradeable

**Step 1: Install OpenZeppelin Upgradeable Contracts**

```bash
npm install @openzeppelin/contracts-upgradeable
npm install @openzeppelin/hardhat-upgrades
npm install --save-dev @openzeppelin/hardhat-upgrades
```

**Step 2: Modify Hardhat Config**

**File: `hardhat.config.ts`**

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // ... rest of config
};

export default config;
```

**Step 3: Convert MyToken to Upgradeable**

**File: `contracts/MyTokenUpgradeable.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyTokenUpgradeable is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize() public initializer {
        __ERC20_init("MyToken", "MTK");
        __Ownable_init(msg.sender);
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    // New function added in upgrade
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
```

**Step 4: Deployment Script**

**File: `scripts/deploy-upgradeable.ts`**

```typescript
import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying upgradeable MyToken...");
  
  // Deploy as upgradeable proxy
  const MyTokenUpgradeable = await ethers.getContractFactory("MyTokenUpgradeable");
  const myToken = await upgrades.deployProxy(
    MyTokenUpgradeable,
    [], // Constructor args (empty for initialize)
    { initializer: "initialize" }
  );
  
  await myToken.waitForDeployment();
  const proxyAddress = await myToken.getAddress();
  
  console.log("Proxy deployed to:", proxyAddress);
  console.log("Implementation deployed to:", await upgrades.erc1967.getImplementationAddress(proxyAddress));
  
  // Upgrade the contract later
  // const MyTokenV2 = await ethers.getContractFactory("MyTokenV2");
  // await upgrades.upgradeProxy(proxyAddress, MyTokenV2);
}
```

### B. UUPS (Universal Upgradeable Proxy Standard)

**More Gas Efficient** - Upgrade logic is in the implementation contract, not proxy.

**File: `contracts/MyTokenUUPS.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MyTokenUUPS is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    function initialize() public initializer {
        __ERC20_init("MyToken", "MTK");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    // Required for UUPS - only owner can upgrade
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
```

**Deployment:**

```typescript
const myToken = await upgrades.deployProxy(
  MyTokenUUPS,
  [],
  { kind: "uups" }
);
```

### C. Beacon Proxy Pattern

**For Multiple Contracts** - One beacon controls multiple proxy instances.

**Use Case:** Deploying the same NFT contract to multiple addresses but upgrading all at once.

### Storage Layout Rules (CRITICAL!)

⚠️ **NEVER change storage layout order** - Proxy patterns rely on storage slots matching.

```solidity
// ❌ BAD: Changing storage layout breaks upgrades
contract V1 {
    uint256 public a;  // slot 0
    uint256 public b;  // slot 1
}

contract V2 {
    uint256 public c;  // slot 0 - WRONG! Overwrites 'a'
    uint256 public a;  // slot 1 - WRONG! Overwrites 'b'
    uint256 public b;  // slot 2 - NEW
}

// ✅ GOOD: Append only, never remove or reorder
contract V1 {
    uint256 public a;  // slot 0
    uint256 public b;  // slot 1
}

contract V2 {
    uint256 public a;  // slot 0 - SAME
    uint256 public b;  // slot 1 - SAME
    uint256 public c;  // slot 2 - NEW (append only)
}
```

### Files to Modify:

1. **`hardhat.config.ts`** - Add `@openzeppelin/hardhat-upgrades` plugin
2. **`contracts/MyTokenUpgradeable.sol`** (NEW) - Convert existing contracts
3. **`contracts/MyNFTUpgradeable.sol`** (NEW) - Convert NFT contract
4. **`scripts/deploy-upgradeable.ts`** (NEW) - Deployment script
5. **`scripts/upgrade-contract.ts`** (NEW) - Upgrade script

**Upgrade Script Example:**

```typescript
import { upgrades } from "hardhat";

async function main() {
  const PROXY_ADDRESS = "0x..."; // Your proxy address
  
  const MyTokenV2 = await ethers.getContractFactory("MyTokenV2");
  console.log("Upgrading proxy...");
  
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, MyTokenV2);
  console.log("Upgraded to:", await upgraded.getAddress());
}
```

---

## 2. OPCODE Analysis & Gas Optimization

### Question: How do you analyze contracts using OPCODEs to test gas optimization?

### Answer:

OPCODEs (Operation Codes) are the low-level instructions executed by the EVM. Analyzing them helps optimize gas costs.

### A. Getting OPCODE Output from Hardhat

**File: `hardhat.config.ts` - Add custom task**

```typescript
import { task } from "hardhat/config";

task("opcodes", "Displays OPCODEs for a contract")
  .addParam("contract", "Contract name")
  .setAction(async (taskArgs, hre) => {
    const contractName = taskArgs.contract;
    const Contract = await hre.ethers.getContractFactory(contractName);
    
    // Get bytecode
    const bytecode = Contract.bytecode;
    console.log("Bytecode length:", bytecode.length);
    
    // Disassemble (requires additional tooling)
    // Or use online tools: https://ethervm.io/decompile
  });
```

### B. Using Hardhat to Analyze Gas

**File: `scripts/analyze-gas.ts`**

```typescript
import { ethers } from "hardhat";

async function main() {
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy();
  await token.waitForDeployment();
  
  // Deploy contract and measure gas
  const deployTx = await MyToken.deploy();
  const receipt = await deployTx.deployTransaction.wait();
  console.log("Deployment gas used:", receipt.gasUsed.toString());
  
  // Measure specific function gas
  const mintTx = await token.mint(
    "0x...", 
    ethers.parseEther("100")
  );
  const mintReceipt = await mintTx.wait();
  console.log("Mint gas used:", mintReceipt.gasUsed.toString());
  
  // Compare optimized vs non-optimized
}
```

**Run:**
```bash
npx hardhat run scripts/analyze-gas.ts --network localhost
```

### C. Manual OPCODE Analysis Tools

**1. Using `evm.codes` (Online)**

```bash
# Get bytecode from contract
npx hardhat compile
# Find bytecode in artifacts/contracts/MyToken.sol/MyToken.json
# Paste at: https://evm.codes/playground
```

**2. Using Foundry's `cast`**

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Disassemble contract
cast disasm 0x6080604052... > opcodes.txt

# Analyze gas costs per OPCODE
# SLOAD (storage read) = 2100 gas (cold), 100 gas (warm)
# SSTORE (storage write) = 20000 gas (zero→non-zero), 2900 (non-zero→non-zero)
# CALL = 2300 gas minimum
```

### D. Key OPCODEs and Gas Costs

| OPCODE | Gas Cost | Description | Optimization Tip |
|--------|----------|-------------|------------------|
| `SLOAD` | 2100 (cold)<br>100 (warm) | Read storage | Cache storage reads |
| `SSTORE` | 20000 (zero→non-zero)<br>2900 (non-zero→non-zero)<br>4800 (non-zero→zero) | Write storage | Minimize storage writes, pack variables |
| `CALL` | 2300 min + calldata | External call | Batch operations, use internal functions |
| `CREATE` | 32000 + code size | Create contract | Reduce contract size |
| `SHA3` | 30 + word cost | Hash operation | Cache hash results |
| `LOG*` | 375 + topic cost | Emit event | Events are cheap, use for history |
| `EXTCODESIZE` | 700 | Check code size | Cache results |
| `BALANCE` | 700 (cold)<br>100 (warm) | Get balance | Cache if used multiple times |

### E. Example: Comparing Two Contract Versions

**Optimized vs Non-Optimized Contract**

```solidity
// ❌ BAD: Multiple SLOAD operations
contract BadToken {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount);  // SLOAD 1
        balances[msg.sender] -= amount;           // SLOAD 2, SSTORE 1
        balances[to] += amount;                   // SLOAD 3, SSTORE 2
    }
}

// ✅ GOOD: Cached storage reads
contract GoodToken {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        uint256 senderBalance = balances[msg.sender];  // SLOAD 1 (cached)
        require(senderBalance >= amount);
        balances[msg.sender] = senderBalance - amount; // SSTORE 1
        balances[to] += amount;                        // SLOAD 2, SSTORE 2
    }
}
```

**OPCODE Difference:**
- Bad version: 3 SLOADs + 2 SSTOREs = ~6200 gas
- Good version: 2 SLOADs + 2 SSTOREs = ~4200 gas
- **Savings: ~2000 gas (32% reduction)**

### F. Advanced: Using Hardhat Gas Reporter

**File: `hardhat.config.ts`**

```typescript
import "hardhat-gas-reporter";

const config: HardhatUserConfig = {
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 20, // gwei
    coinmarketcap: "YOUR_API_KEY", // Optional
  },
  // ...
};
```

**File: `test/MyToken.gas.test.ts`**

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyToken Gas Tests", function () {
  it("Should deploy with minimal gas", async function () {
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy();
    await token.deployed();
    // Gas reporter will show deployment gas
  });
  
  it("Should mint with optimal gas", async function () {
    const [owner] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy();
    
    // Gas reporter shows this function's gas cost
    const tx = await token.mint(owner.address, ethers.parseEther("100"));
    await tx.wait();
  });
});
```

**Run:**
```bash
REPORT_GAS=true npx hardhat test
```

### G. OPCODE-Level Optimization Checklist

1. ✅ Minimize SLOAD operations (cache storage reads)
2. ✅ Reduce SSTORE operations (pack variables, use events for logs)
3. ✅ Use custom errors instead of require strings
4. ✅ Use `external` for functions only called externally
5. ✅ Pack storage variables (uint128 + uint128 = 1 slot)
6. ✅ Use `calldata` instead of `memory` for arrays/strings
7. ✅ Avoid loops over dynamic arrays
8. ✅ Use events for historical data instead of storage
9. ✅ Optimize function selector usage (shorter function names)
10. ✅ Minimize contract size (use libraries, remove unused code)

---

## 3. Cross-Chain & Layer 2 Solutions

### Question: How would you deploy this DApp to Layer 2 or make it cross-chain?

### Answer:

### A. Layer 2 Solutions (Optimistic Rollups)

**Using Optimism or Arbitrum:**

**File: `hardhat.config.ts`**

```typescript
const config: HardhatUserConfig = {
  networks: {
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 10,
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161,
    },
  },
};
```

**Deployment:**

```typescript
// Deploy to Optimism
npx hardhat run scripts/deploy.js --network optimism

// Deploy to Arbitrum
npx hardhat run scripts/deploy.js --network arbitrum
```

### B. Cross-Chain Bridge Pattern

**Using LayerZero or Wormhole:**

```solidity
// File: contracts/CrossChainToken.sol
import "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";

contract CrossChainToken is ERC20, NonblockingLzApp {
    function sendTokens(
        uint16 _dstChainId,
        address _destination,
        uint256 _amount
    ) public payable {
        // Lock tokens on source chain
        _burn(msg.sender, _amount);
        
        // Send cross-chain message
        _lzSend(
            _dstChainId,
            abi.encode(_destination, _amount),
            payable(msg.sender),
            address(0x0),
            bytes(""),
            msg.value
        );
    }
    
    function _nonblockingLzReceive(
        uint16,
        bytes memory,
        uint64,
        bytes memory _payload
    ) internal override {
        (address destination, uint256 amount) = abi.decode(_payload, (address, uint256));
        _mint(destination, amount);
    }
}
```

### C. Frontend Multi-Chain Support

**File: `app/lib/networks/chains.ts`**

```typescript
export const SUPPORTED_CHAINS = {
  ethereum: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth.llamarpc.com",
    contracts: {
      MyToken: "0x...",
    },
  },
  optimism: {
    chainId: 10,
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    contracts: {
      MyToken: "0x...",
    },
  },
  arbitrum: {
    chainId: 42161,
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    contracts: {
      MyToken: "0x...",
    },
  },
};

export const switchNetwork = async (chainId: number) => {
  if (typeof window === "undefined" || !window.ethereum) return;
  
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      // Chain not added, add it
      const chain = Object.values(SUPPORTED_CHAINS).find(c => c.chainId === chainId);
      if (chain) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: chain.name,
            rpcUrls: [chain.rpcUrl],
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
          }],
        });
      }
    }
  }
};
```

---

## 4. Event Indexing & The Graph Protocol

### Question: How do you efficiently query and index blockchain events for the frontend?

### Answer:

### A. The Graph Protocol Setup

**1. Install Dependencies:**

```bash
npm install -g @graphprotocol/graph-cli
```

**2. Initialize Subgraph:**

```bash
graph init --protocol ethereum \
  --product hosted-service \
  --contract-name MyToken \
  --index-events \
  your-github-username/eth-project-subgraph
```

**3. Schema Definition:**

**File: `subgraph/schema.graphql`**

```graphql
type Transfer @entity {
  id: ID!
  from: Bytes!
  to: Bytes!
  value: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

type Token @entity {
  id: ID!
  totalSupply: BigInt!
  transfers: [Transfer!]! @derivedFrom(field: "token")
}
```

**4. Mapping Handler:**

**File: `subgraph/src/mapping.ts`**

```typescript
import { Transfer as TransferEvent } from "../generated/MyToken/MyToken";
import { Transfer, Token } from "../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  let transfer = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.value = event.params.value;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.transactionHash = event.transaction.hash;
  transfer.save();
  
  // Update token entity
  let token = Token.load(event.address.toHex());
  if (!token) {
    token = new Token(event.address.toHex());
    token.totalSupply = BigInt.fromI32(0);
  }
  token.save();
}
```

**5. Query from Frontend:**

```typescript
// File: app/lib/subgraph/queries.ts
const SUBGRAPH_URL = "https://api.thegraph.com/subgraphs/name/your-username/your-subgraph";

export const getTransfers = async (userAddress: string) => {
  const query = `
    {
      transfers(where: { to: "${userAddress}" }, orderBy: timestamp, orderDirection: desc) {
        id
        from
        to
        value
        timestamp
        blockNumber
      }
    }
  `;
  
  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  
  const { data } = await response.json();
  return data.transfers;
};
```

### B. Alternative: Custom Event Indexer

**File: `app/lib/events/indexer.ts`**

```typescript
import { Contract, EventLog } from "ethers";

export const indexEvents = async (
  contract: Contract,
  fromBlock: number,
  toBlock: number | "latest"
) => {
  // Get all Transfer events in block range
  const filter = contract.filters.Transfer();
  const events = await contract.queryFilter(filter, fromBlock, toBlock);
  
  const indexedEvents = events.map((event: EventLog) => ({
    from: event.args.from,
    to: event.args.to,
    value: event.args.value.toString(),
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    blockHash: event.blockHash,
  }));
  
  return indexedEvents;
};

// Store in database (IndexedDB, localStorage, or backend)
export const storeEvents = (events: any[]) => {
  localStorage.setItem("tokenTransfers", JSON.stringify(events));
};
```

---

## 5. MEV Protection & Flashloan Attack Prevention

### Question: How do you protect contracts from MEV attacks and flashloan exploits?

### Answer:

### A. MEV Protection Techniques

**1. Commit-Reveal Scheme**

```solidity
contract ProtectedAuction {
    mapping(bytes32 => address) public commits;
    mapping(address => uint256) public reveals;
    
    // Phase 1: Commit hash
    function commitBid(bytes32 commitment) public {
        commits[commitment] = msg.sender;
    }
    
    // Phase 2: Reveal after commit period
    function revealBid(uint256 amount, bytes32 secret) public {
        bytes32 commitment = keccak256(abi.encodePacked(amount, secret));
        require(commits[commitment] == msg.sender, "Invalid commitment");
        reveals[msg.sender] = amount;
    }
}
```

**2. ReentrancyGuard for State Changes**

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ProtectedVault is ReentrancyGuard {
    mapping(address => uint256) public balances;
    
    function withdraw() public nonReentrant {
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0; // Update state first (CEI)
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
    }
}
```

### B. Flashloan Attack Prevention

```solidity
contract ProtectedToken {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    
    // ❌ VULNERABLE: Price manipulation possible
    function getPrice() public view returns (uint256) {
        return (address(this).balance * 1e18) / totalSupply;
    }
    
    // ✅ PROTECTED: Use TWAP (Time-Weighted Average Price)
    struct PriceObservation {
        uint256 price;
        uint256 timestamp;
    }
    
    PriceObservation[] public priceHistory;
    uint256 public constant TWAP_WINDOW = 1 hours;
    
    function getTWAPPrice() public view returns (uint256) {
        uint256 cutoff = block.timestamp - TWAP_WINDOW;
        uint256 sum = 0;
        uint256 count = 0;
        
        for (uint i = priceHistory.length - 1; i >= 0; i--) {
            if (priceHistory[i].timestamp < cutoff) break;
            sum += priceHistory[i].price;
            count++;
        }
        
        return count > 0 ? sum / count : 0;
    }
    
    // Record price periodically (via oracle or keeper)
    function recordPrice() public {
        uint256 currentPrice = (address(this).balance * 1e18) / totalSupply;
        priceHistory.push(PriceObservation(currentPrice, block.timestamp));
    }
}
```

---

## 6. Smart Contract Testing Strategies

### Question: What testing strategies do you use for production contracts?

### Answer:

### A. Comprehensive Test Suite

**File: `test/MyToken.comprehensive.test.ts`**

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MyToken Comprehensive Tests", function () {
  async function deployTokenFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy();
    return { token, owner, user1, user2 };
  }
  
  describe("Security Tests", function () {
    it("Should prevent unauthorized minting", async function () {
      const { token, user1 } = await loadFixture(deployTokenFixture);
      await expect(token.connect(user1).mint(user1.address, 1000))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
    
    it("Should prevent reentrancy attacks", async function () {
      // Deploy malicious contract
      const ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttacker");
      const attacker = await ReentrancyAttacker.deploy();
      
      // Attempt attack
      await expect(attacker.attack()).to.be.reverted;
    });
  });
  
  describe("Gas Optimization Tests", function () {
    it("Should use minimal gas for transfers", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      const tx = await token.transfer(user1.address, 1000);
      const receipt = await tx.wait();
      
      // Gas should be under 50k for simple transfer
      expect(receipt.gasUsed).to.be.lessThan(50000);
    });
  });
  
  describe("Fuzzing Tests", function () {
    it("Should handle random inputs correctly", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      
      // Use Hardhat's fuzzing
      for (let i = 0; i < 100; i++) {
        const randomAmount = Math.floor(Math.random() * 1000000);
        await expect(token.mint(owner.address, randomAmount))
          .to.emit(token, "Transfer");
      }
    });
  });
});
```

### B. Formal Verification (Advanced)

Using **Certora** or **Slither**:

```bash
# Install Slither
pip install slither-analyzer

# Analyze contract
slither contracts/MyToken.sol

# Output: Vulnerability report, gas optimization suggestions
```

---

## 7. Key File Locations Summary

### Upgradeable Contracts:
- `contracts/*Upgradeable.sol` - Upgradeable contract versions
- `scripts/deploy-upgradeable.ts` - Deployment with proxy
- `scripts/upgrade-contract.ts` - Upgrade existing proxy
- `hardhat.config.ts` - Add `@openzeppelin/hardhat-upgrades` plugin

### Gas Analysis:
- `test/*.gas.test.ts` - Gas benchmarking tests
- `scripts/analyze-gas.ts` - Gas analysis scripts
- `hardhat.config.ts` - Configure gas reporter

### Cross-Chain:
- `hardhat.config.ts` - Add L2 network configs
- `app/lib/networks/chains.ts` - Frontend chain configuration
- `contracts/CrossChain*.sol` - Bridge contracts

### Event Indexing:
- `subgraph/` - The Graph subgraph directory
- `app/lib/subgraph/queries.ts` - Frontend GraphQL queries
- `app/lib/events/indexer.ts` - Custom event indexer

---

## Interview Tips for Senior Roles:

1. **Talk about trade-offs** - Upgradeable vs immutable, gas vs security
2. **Reference real examples** - "Like Uniswap's proxy pattern" or "Similar to Compound's governance"
3. **Mention production considerations** - Multi-sig for upgrades, timelocks, audits
4. **Discuss scalability** - L2 solutions, state channels, sidechains
5. **Security mindset** - Always assume adversarial environment
6. **Gas optimization philosophy** - Optimize for common paths, not edge cases
7. **Testing rigor** - Fuzzing, formal verification, bug bounties

---

## Quick Reference Commands:

```bash
# Deploy upgradeable contract
npx hardhat run scripts/deploy-upgradeable.ts --network localhost

# Upgrade contract
npx hardhat run scripts/upgrade-contract.ts --network localhost

# Analyze gas
REPORT_GAS=true npx hardhat test

# Get OPCODEs
cast disasm 0x6080604052... > opcodes.txt

# Deploy to Optimism
npx hardhat run scripts/deploy.js --network optimism

# Generate subgraph
graph codegen && graph build
```

