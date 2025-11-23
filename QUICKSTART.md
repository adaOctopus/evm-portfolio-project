# Quick Start Guide

## What This App Does

A full-stack Web3 DApp that connects to MetaMask and displays data from three Ethereum smart contracts:
- **ERC20**: Fungible token (like a coin) - shows your balance and total supply
- **ERC721**: NFT contract - shows how many NFTs exist and how many you own
- **ERC1155**: Multi-token contract - shows balances for Gold, Silver, and Bronze tokens

**Frontend** (Next.js) ↔️ **Ethers.js** ↔️ **MetaMask** ↔️ **Ethereum Network** ↔️ **Smart Contracts** (Solidity/Hardhat)

---

## How Everything Connects

```
User clicks "Connect Wallet"
    ↓
MetaMask prompts connection
    ↓
Ethers.js creates provider/signer from MetaMask
    ↓
Frontend calls smart contract functions using signer
    ↓
Contracts return data (balance, supply, etc.)
    ↓
Frontend displays data in UI cards
```

**Key Files:**
- `app/hooks/useWallet.ts` - Handles wallet connection
- `app/lib/contracts/contracts.ts` - Connects to contracts using Ethers.js
- `app/page.tsx` - Main UI that displays everything
- `contracts/*.sol` - Smart contracts deployed to blockchain
- `hardhat.config.ts` - Configures deployment networks

---

## Complete Setup Guide (From Scratch)

### Step 1: Initialize Next.js Project

```bash
# Create Next.js 15 project with TypeScript and Tailwind
npx create-next-app@latest eth-project --typescript --app --tailwind --eslint --no-src-dir --import-alias "@/*" --yes

cd eth-project
```

### Step 2: Install Hardhat & Smart Contract Dependencies

```bash
# Install Hardhat and tools
npm install --save-dev hardhat@^2.26.0 @nomicfoundation/hardhat-toolbox@^6.0.0 @nomicfoundation/hardhat-verify@^2.0.0 --legacy-peer-deps

# Install Ethers.js for frontend
npm install ethers@^6

# Install OpenZeppelin contracts (secure, audited standards)
npm install @openzeppelin/contracts

# Install dotenv for environment variables
npm install --save-dev dotenv @types/node
```

### Step 3: Set Up Hardhat Configuration

Create `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

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
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
```

### Step 4: Create Project Structure

```bash
mkdir -p contracts scripts test app/lib/contracts app/hooks app/components
```

### Step 5: Create Smart Contracts

**`contracts/MyToken.sol`** (ERC20):
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;

    constructor() ERC20("MyToken", "MTK") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function getTotalSupply() public view returns (uint256) {
        return totalSupply();
    }

    function getBalance(address account) public view returns (uint256) {
        return balanceOf(account);
    }
}
```

**`contracts/MyNFT.sol`** (ERC721):
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {}

    function mint(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        return newTokenId;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }

    function getOwner(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId);
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURI(tokenId);
    }
}
```

**`contracts/MyMultiToken.sol`** (ERC1155):
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";

contract MyMultiToken is ERC1155URIStorage, Ownable {
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant BRONZE = 2;

    constructor() ERC1155("") Ownable(msg.sender) {
        _setURI(GOLD, "https://example.com/gold.json");
        _setURI(SILVER, "https://example.com/silver.json");
        _setURI(BRONZE, "https://example.com/bronze.json");
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) public onlyOwner {
        _mint(to, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    function getBalance(address account, uint256 id) public view returns (uint256) {
        return balanceOf(account, id);
    }

    function getTotalSupply(uint256 id) public pure returns (uint256) {
        require(id >= 0 && id <= 2, "Invalid token ID");
        return type(uint256).max;
    }
}
```

### Step 6: Create Deployment Script

**`scripts/deploy.ts`**:
```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ERC20
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();
  await myToken.waitForDeployment();
  const tokenAddress = await myToken.getAddress();
  console.log("MyToken deployed to:", tokenAddress);

  // Deploy ERC721
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy();
  await myNFT.waitForDeployment();
  const nftAddress = await myNFT.getAddress();
  console.log("MyNFT deployed to:", nftAddress);

  // Deploy ERC1155
  const MyMultiToken = await ethers.getContractFactory("MyMultiToken");
  const myMultiToken = await MyMultiToken.deploy();
  await myMultiToken.waitForDeployment();
  const multiTokenAddress = await myMultiToken.getAddress();
  console.log("MyMultiToken deployed to:", multiTokenAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("ERC20 Token:", tokenAddress);
  console.log("ERC721 NFT:", nftAddress);
  console.log("ERC1155 Multi-Token:", multiTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 7: Create Frontend Wallet Hook

**`app/hooks/useWallet.ts`**:
```typescript
"use client";

import { useState, useEffect } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

export const useWallet = () => {
  const [wallet, setWallet] = useState({
    address: null as string | null,
    signer: null as JsonRpcSigner | null,
    provider: null as BrowserProvider | null,
    isConnected: false,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", () => checkConnection());
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        setWallet({
          address: await signer.getAddress(),
          signer,
          provider,
          isConnected: true,
        });
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  };

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("Please install MetaMask");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setWallet({
        address: await signer.getAddress(),
        signer,
        provider,
        isConnected: true,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const disconnectWallet = () => {
    setWallet({ address: null, signer: null, provider: null, isConnected: false });
  };

  return { ...wallet, error, connectWallet, disconnectWallet };
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
```

### Step 8: Create Contract Utilities

**`app/lib/contracts/addresses.ts`**:
```typescript
export const CONTRACT_ADDRESSES = {
  MyToken: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
  MyNFT: process.env.NEXT_PUBLIC_NFT_ADDRESS || "0x0000000000000000000000000000000000000000",
  MyMultiToken: process.env.NEXT_PUBLIC_MULTITOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
};
```

**`app/lib/contracts/abis.ts`** (simplified ABIs):
```typescript
export const MyTokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function getTotalSupply() view returns (uint256)",
  "function getBalance(address) view returns (uint256)",
];

export const MyNFTABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
];

export const MyMultiTokenABI = [
  "function balanceOf(address, uint256) view returns (uint256)",
  "function getBalance(address, uint256) view returns (uint256)",
];
```

**`app/lib/contracts/contracts.ts`**:
```typescript
import { Contract, JsonRpcSigner, formatEther } from "ethers";
import { CONTRACT_ADDRESSES } from "./addresses";
import { MyTokenABI, MyNFTABI, MyMultiTokenABI } from "./abis";

export const getMyTokenContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyToken, MyTokenABI, signer);
};

export const getMyNFTContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyNFT, MyNFTABI, signer);
};

export const getMyMultiTokenContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyMultiToken, MyMultiTokenABI, signer);
};

export const fetchContractData = async (address: string, signer: JsonRpcSigner) => {
  const tokenContract = getMyTokenContract(signer);
  const nftContract = getMyNFTContract(signer);
  const multiTokenContract = getMyMultiTokenContract(signer);

  const [tokenName, tokenSymbol, tokenBalance, totalSupply, nftTotalSupply, nftBalance, goldBalance, silverBalance, bronzeBalance] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
    tokenContract.balanceOf(address),
    tokenContract.totalSupply(),
    nftContract.totalSupply(),
    nftContract.balanceOf(address),
    multiTokenContract.balanceOf(address, 0),
    multiTokenContract.balanceOf(address, 1),
    multiTokenContract.balanceOf(address, 2),
  ]);

  return {
    tokenName,
    tokenSymbol,
    tokenBalance: parseFloat(formatEther(tokenBalance)).toFixed(4),
    totalSupply: parseFloat(formatEther(totalSupply)).toFixed(4),
    nftTotalSupply: nftTotalSupply.toString(),
    nftBalance: nftBalance.toString(),
    goldBalance: goldBalance.toString(),
    silverBalance: silverBalance.toString(),
    bronzeBalance: bronzeBalance.toString(),
  };
};
```

### Step 9: Create UI Components

**`app/components/ContractData.tsx`** - Display component (see full project for details)

**`app/page.tsx`** - Main page with wallet connection and data display (see full project for details)

### Step 10: Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "compile": "hardhat compile",
    "test": "hardhat test",
    "node": "hardhat node",
    "deploy:local": "hardhat run scripts/deploy.ts --network localhost",
    "deploy:sepolia": "hardhat run scripts/deploy.ts --network sepolia",
    "clean": "hardhat clean"
  }
}
```

### Step 11: Create .gitignore

```gitignore
node_modules
.next
.env
.env.local
artifacts
cache
typechain-types
```

---

## How to Run

### 1. Compile Contracts
```bash
npm run compile
```

### 2. Start Local Blockchain (Terminal 1)
```bash
npm run node
```

### 3. Deploy Contracts (Terminal 2)
```bash
npm run deploy:local
```

**Copy the contract addresses from output!**

### 4. Update Contract Addresses

Edit `app/lib/contracts/addresses.ts` with the deployed addresses.

### 5. Configure MetaMask

- Add network: `http://127.0.0.1:8545`, Chain ID: `1337`
- Import test account using private key from Hardhat node output

### 6. Start Frontend (Terminal 3)
```bash
npm run dev
```

### 7. Open Browser

Go to `http://localhost:3000` and click "Connect Wallet"

---

## Key Commands Summary

```bash
# Setup
npm install
npm run compile

# Development
npm run node              # Start local blockchain
npm run deploy:local      # Deploy contracts
npm run dev              # Start frontend

# Production
npm run build            # Build frontend
npm run deploy:sepolia   # Deploy to testnet
```

---

## Project Structure Summary

```
eth-project/
├── contracts/          # Solidity smart contracts (ERC20, ERC721, ERC1155)
├── scripts/           # Deployment scripts
├── test/              # Hardhat tests
├── app/
│   ├── hooks/        # useWallet hook
│   ├── lib/contracts/ # Contract ABIs, addresses, utilities
│   ├── components/    # React components
│   └── page.tsx      # Main UI
└── hardhat.config.ts # Hardhat configuration
```

That's it! You now have a complete Web3 DApp setup.

