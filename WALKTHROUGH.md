# Codebase Walkthrough

This document provides a comprehensive walkthrough of the Web3 Ethereum DApp project structure, explaining how each component works and how they interact.

## Project Overview

This is a full-stack Web3 application that demonstrates interactions with three types of Ethereum smart contracts:
- **ERC20**: Fungible token standard
- **ERC721**: Non-fungible token (NFT) standard
- **ERC1155**: Multi-token standard

The project uses:
- **Next.js 15** with App Router and TypeScript for the frontend
- **Hardhat** for smart contract development, testing, and deployment
- **Ethers.js v6** for blockchain interactions
- **OpenZeppelin Contracts** for secure, audited contract implementations

---

## Project Structure

```
eth-project/
├── app/                          # Next.js App Router directory
│   ├── components/               # React components
│   │   └── ContractData.tsx     # Component to display contract data
│   ├── hooks/                    # Custom React hooks
│   │   └── useWallet.ts         # Wallet connection hook
│   ├── lib/                      # Utility libraries
│   │   └── contracts/           # Contract-related utilities
│   │       ├── abis.ts          # Contract ABIs
│   │       ├── addresses.ts     # Contract addresses
│   │       └── contracts.ts     # Contract interaction functions
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Main page component
├── contracts/                    # Solidity smart contracts
│   ├── MyToken.sol              # ERC20 token contract
│   ├── MyNFT.sol                # ERC721 NFT contract
│   └── MyMultiToken.sol         # ERC1155 multi-token contract
├── scripts/                      # Hardhat deployment scripts
│   ├── deploy.ts                # Deploy all contracts
│   └── deploy-separate.ts       # Deploy contracts separately
├── test/                         # Hardhat tests
│   ├── MyToken.test.ts          # ERC20 tests
│   ├── MyNFT.test.ts            # ERC721 tests
│   └── MyMultiToken.test.ts     # ERC1155 tests
├── hardhat.config.ts            # Hardhat configuration
├── package.json                 # Dependencies and scripts
└── WALKTHROUGH.md              # This file
```

---

## Smart Contracts

### 1. MyToken.sol (ERC20)

**Location**: `contracts/MyToken.sol`

This contract implements an ERC20 fungible token using OpenZeppelin's `ERC20` contract.

**Key Features**:
- Initial supply of 1 million tokens minted to the deployer
- Only owner can mint additional tokens
- Standard ERC20 functions: `transfer`, `balanceOf`, `totalSupply`
- Custom helper functions: `getTotalSupply()`, `getBalance()`

**Inheritance**:
- `ERC20`: Standard token implementation
- `Ownable`: Access control for minting

### 2. MyNFT.sol (ERC721)

**Location**: `contracts/MyNFT.sol`

This contract implements an ERC721 non-fungible token using OpenZeppelin's `ERC721URIStorage`.

**Key Features**:
- Each NFT has a unique token ID (auto-incremented)
- Each NFT can have metadata stored via URI
- Only owner can mint new NFTs
- Tracks total supply with OpenZeppelin's `Counters`

**Inheritance**:
- `ERC721`: Base NFT functionality
- `ERC721URIStorage`: Adds URI storage capability
- `Ownable`: Access control for minting

### 3. MyMultiToken.sol (ERC1155)

**Location**: `contracts/MyMultiToken.sol`

This contract implements an ERC1155 multi-token standard, allowing multiple token types in a single contract.

**Key Features**:
- Three predefined token types: GOLD (ID: 0), SILVER (ID: 1), BRONZE (ID: 2)
- Can mint individual tokens or batches
- Each token type has its own URI for metadata
- Supports both fungible and non-fungible concepts

**Inheritance**:
- `ERC1155`: Base multi-token functionality
- `ERC1155URIStorage`: Adds URI storage per token ID
- `Ownable`: Access control for minting

---

## Frontend Architecture

### Wallet Connection (`app/hooks/useWallet.ts`)

**Purpose**: Manages Web3 wallet connection state and interactions.

**Key Functions**:
- `connectWallet()`: Connects to MetaMask or other Web3 wallets
- `disconnectWallet()`: Clears wallet connection
- `checkConnection()`: Checks if wallet is already connected

**State Management**:
- Stores wallet address, signer, and provider
- Listens for account and chain changes
- Handles connection errors

**Usage**:
```typescript
const { address, isConnected, connectWallet, signer } = useWallet();
```

### Contract Utilities (`app/lib/contracts/`)

#### `addresses.ts`
Stores contract addresses. Update these after deployment:
```typescript
export const CONTRACT_ADDRESSES = {
  MyToken: "0x...",
  MyNFT: "0x...",
  MyMultiToken: "0x...",
};
```

#### `abis.ts`
Contains simplified ABIs for the contracts. These define the contract interface methods the frontend can call.

#### `contracts.ts`
Provides helper functions:
- `getMyTokenContract()`: Returns ERC20 contract instance
- `getMyNFTContract()`: Returns ERC721 contract instance
- `getMyMultiTokenContract()`: Returns ERC1155 contract instance
- `fetchContractData()`: Fetches all contract data for display

### Main Page (`app/page.tsx`)

**Purpose**: Main DApp interface that brings everything together.

**Functionality**:
1. Wallet connection UI with connect/disconnect button
2. Displays connected wallet address
3. Fetches and displays contract data when wallet is connected
4. Shows data from all three contract types in cards

**Data Flow**:
1. User clicks "Connect Wallet"
2. `useWallet` hook connects to MetaMask
3. Once connected, `fetchContractData()` is called
4. Data is fetched from all three contracts
5. `ContractData` component displays the information

### Contract Data Component (`app/components/ContractData.tsx`)

**Purpose**: Renders contract data in a user-friendly card layout.

**Displays**:
- ERC20: Token name, symbol, user balance, total supply
- ERC721: Total NFTs minted, user's NFT balance
- ERC1155: Balances for Gold, Silver, and Bronze tokens

---

## Hardhat Configuration

### `hardhat.config.ts`

**Networks Configured**:
- `hardhat`: Local test network (chainId: 1337)
- `localhost`: Points to local Hardhat node
- `sepolia`: Ethereum Sepolia testnet (requires env variables)

**Solidity Settings**:
- Version: 0.8.28
- Optimizer enabled with 200 runs

**Environment Variables Needed** (for Sepolia):
- `SEPOLIA_RPC_URL`: RPC endpoint URL
- `PRIVATE_KEY`: Deployer private key
- `ETHERSCAN_API_KEY`: For contract verification

---

## Deployment Scripts

### `scripts/deploy.ts`

Deploys all three contracts in sequence and outputs their addresses.

**Usage**:
```bash
# Local network
npm run node  # In one terminal
npm run deploy:local  # In another terminal

# Sepolia testnet
npm run deploy:sepolia
```

**Output**: Contract addresses printed to console and JSON format.

### `scripts/deploy-separate.ts`

Allows deploying contracts individually:

```bash
# Deploy only ERC20
npx hardhat run scripts/deploy-separate.ts --network localhost erc20

# Deploy only ERC721
npx hardhat run scripts/deploy-separate.ts --network localhost erc721

# Deploy only ERC1155
npx hardhat run scripts/deploy-separate.ts --network localhost erc1155
```

---

## Testing

Each contract has comprehensive tests in the `test/` directory:

### Test Coverage

**MyToken.test.ts**:
- Deployment verification
- Owner checks
- Minting functionality
- Transfer functionality
- Balance checks

**MyNFT.test.ts**:
- Deployment verification
- Minting NFTs
- Token ID incrementation
- Owner verification
- Token URI storage

**MyMultiToken.test.ts**:
- Deployment verification
- Single token minting
- Batch minting
- Balance tracking

**Run Tests**:
```bash
npm test
```

---

## Development Workflow

### 1. Compile Contracts

```bash
npm run compile
```

This generates:
- `artifacts/`: Compiled contract bytecode and ABIs
- `cache/`: Hardhat cache files

### 2. Test Contracts

```bash
npm test
```

Runs all test suites using Hardhat's built-in test runner.

### 3. Start Local Network

```bash
npm run node
```

Starts a local Hardhat node with 20 test accounts, each with 10,000 ETH.

### 4. Deploy to Local Network

In a new terminal:
```bash
npm run deploy:local
```

**Important**: Copy the contract addresses from the output and update `app/lib/contracts/addresses.ts`.

### 5. Start Frontend

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 6. Connect Wallet

1. Install MetaMask browser extension
2. Import one of the Hardhat test accounts:
   - Use the private keys shown when running `npm run node`
3. Click "Connect Wallet" in the DApp
4. Approve the connection in MetaMask

### 7. View Contract Data

Once connected, the DApp will automatically fetch and display:
- Your ERC20 token balance
- Total ERC20 supply
- Your NFT count
- Your ERC1155 token balances

---

## Data Flow Diagram

```
User Action: Click "Connect Wallet"
    ↓
useWallet Hook
    ↓
MetaMask Connection
    ↓
Wallet Connected (address, signer available)
    ↓
fetchContractData() called automatically
    ↓
Contracts initialized with signer
    ↓
Parallel contract calls:
    ├── ERC20: name(), symbol(), balanceOf(), totalSupply()
    ├── ERC721: totalSupply(), balanceOf()
    └── ERC1155: balanceOf(address, 0/1/2)
    ↓
Data formatted and returned
    ↓
ContractData component renders cards
```

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root for testnet deployment:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Frontend Environment Variables (Optional)

For production, you can set contract addresses via environment variables:

```env
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_NFT_ADDRESS=0x...
NEXT_PUBLIC_MULTITOKEN_ADDRESS=0x...
```

---

## Troubleshooting

### "Please install MetaMask"
- Install MetaMask browser extension
- Make sure it's enabled

### "Failed to load contract data"
- Contracts may not be deployed
- Contract addresses may be incorrect
- Make sure you're on the correct network (localhost:8545 for local)

### "Contract address is zero address"
- Deploy contracts first
- Update addresses in `app/lib/contracts/addresses.ts`
- Restart the Next.js dev server

### "Insufficient funds" errors
- Make sure your wallet has ETH/test ETH
- For local network, use test accounts from Hardhat node

---

## Next Steps

1. **Customize Contracts**: Modify the contracts to add your own logic
2. **Add More Functions**: Extend the frontend to call additional contract methods
3. **Add Minting UI**: Create forms to mint tokens/NFTs from the frontend
4. **Deploy to Testnet**: Test on Sepolia testnet
5. **Add Transaction History**: Track and display past transactions
6. **Multi-chain Support**: Add support for other networks (Polygon, Arbitrum, etc.)

---

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Next.js Documentation](https://nextjs.org/docs)
- [ERC Standards](https://eips.ethereum.org/erc)

---

This walkthrough should give you a complete understanding of how the codebase is structured and how to work with it. Happy coding!

