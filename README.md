# Web3 Ethereum DApp

A full-stack Web3 application demonstrating interactions with ERC20, ERC721, and ERC1155 smart contracts on Ethereum. Built with Next.js 15, Hardhat, and Ethers.js.

## 🚀 Features

- **ERC20 Token**: Fungible token with minting capabilities
- **ERC721 NFT**: Non-fungible token contract with URI storage
- **ERC1155 Multi-Token**: Multi-token standard supporting Gold, Silver, and Bronze tokens
- **Wallet Integration**: Connect with MetaMask or any Web3 wallet
- **Modern UI**: Beautiful, responsive Web3 interface with dark mode support
- **Full Test Coverage**: Comprehensive Hardhat tests for all contracts
- **Easy Deployment**: Ready-to-use deployment scripts

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension (for wallet connection)
- Git

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Blockchain**: Solidity, Hardhat, Ethers.js v6
- **Smart Contracts**: OpenZeppelin Contracts (ERC20, ERC721, ERC1155)

## 📦 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd eth-project
```

2. Install dependencies:
```bash
npm install
```

3. Compile smart contracts:
```bash
npm run compile
```

## 🧪 Testing

Run all tests:
```bash
npm test
```

Test specific contracts:
```bash
npx hardhat test test/MyToken.test.ts
npx hardhat test test/MyNFT.test.ts
npx hardhat test test/MyMultiToken.test.ts
```

## 🚀 Getting Started

### 1. Start Local Hardhat Network

In one terminal, start a local blockchain:
```bash
npm run node
```

This starts a Hardhat node with 20 test accounts, each pre-funded with 10,000 ETH.

### 2. Deploy Contracts

In another terminal, deploy all contracts to the local network:
```bash
npm run deploy:local
```

**Important**: Copy the contract addresses from the output. You'll need to update them in `app/lib/contracts/addresses.ts`.

### 3. Update Contract Addresses

Open `app/lib/contracts/addresses.ts` and update the addresses:
```typescript
export const CONTRACT_ADDRESSES = {
  MyToken: "0x...", // From deployment output
  MyNFT: "0x...",   // From deployment output
  MyMultiToken: "0x...", // From deployment output
};
```

### 4. Configure MetaMask for Local Network

1. Open MetaMask
2. Go to Settings → Networks → Add Network
3. Add the following details:
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 1337
   - **Currency Symbol**: ETH

4. Import a test account:
   - Copy a private key from the Hardhat node output
   - In MetaMask: Account menu → Import Account → Paste private key

### 5. Start Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Connect Wallet

1. Click "Connect Wallet" button
2. Approve the connection in MetaMask
3. View your contract data!

## 📁 Project Structure

```
eth-project/
├── app/                    # Next.js frontend
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks (useWallet)
│   ├── lib/              # Utilities and contract helpers
│   └── page.tsx          # Main page
├── contracts/            # Solidity smart contracts
├── scripts/              # Deployment scripts
├── test/                 # Hardhat tests
├── hardhat.config.ts     # Hardhat configuration
└── WALKTHROUGH.md        # Detailed codebase walkthrough
```

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Smart Contracts
- `npm run compile` - Compile contracts
- `npm test` - Run all tests
- `npm run node` - Start local Hardhat node
- `npm run deploy:local` - Deploy to local network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run clean` - Clean cache and artifacts

## 🔧 Configuration

### Environment Variables

Create a `.env` file for testnet deployment:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

For frontend contract addresses:
```env
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_NFT_ADDRESS=0x...
NEXT_PUBLIC_MULTITOKEN_ADDRESS=0x...
```

## 📚 Contract Details

### ERC20 (MyToken)
- **Name**: MyToken
- **Symbol**: MTK
- **Initial Supply**: 1,000,000 tokens
- **Decimals**: 18
- **Features**: Minting (owner only), transfers

### ERC721 (MyNFT)
- **Name**: MyNFT
- **Symbol**: MNFT
- **Features**: Minting with URI, unique token IDs

### ERC1155 (MyMultiToken)
- **Token Types**: 
  - GOLD (ID: 0)
  - SILVER (ID: 1)
  - BRONZE (ID: 2)
- **Features**: Batch minting, individual minting

## 🔐 Security

- Uses OpenZeppelin's audited contract libraries
- Access control with `Ownable` for minting functions
- Follows standard ERC token implementations

## 📖 Documentation

For a detailed walkthrough of the codebase, see [WALKTHROUGH.md](./WALKTHROUGH.md).

## 🌐 Deployment

### Deploy to Sepolia Testnet

1. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
2. Set up `.env` file with your credentials
3. Deploy:
```bash
npm run deploy:sepolia
```

### Deploy Frontend

Deploy to Vercel, Netlify, or any static hosting platform:
```bash
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🔗 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Next.js Documentation](https://nextjs.org/docs)
- [ERC Standards](https://eips.ethereum.org/erc)

## 💡 Tips

- Always test contracts locally before deploying to testnets
- Never commit private keys or `.env` files
- Use testnet ETH for testing (free from faucets)
- Check gas prices before mainnet deployments

---

Built with ❤️ for the Web3 community
