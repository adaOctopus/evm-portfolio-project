# Simple Command Guide

## 🚀 Quick Commands Reference

### 1. Compile Contracts (Convert Solidity to Bytecode)

```bash
npm run compile
```

**What it does**: Takes your Solidity contracts and converts them to code the blockchain can understand.

**When to use**: After writing or changing any contract code.

---

### 2. Start Local Blockchain (Hardhat Node)

**Terminal 1**:
```bash
npm run node
```

**What it does**: 
- Starts a fake Ethereum blockchain on your computer
- Creates 20 test accounts with free ETH (10,000 each)
- Shows you private keys for the accounts

**Keep this running** - You need it to test and deploy.

**To stop**: Press `Ctrl + C`

---

### 3. Deploy Contracts to Local Blockchain

**Terminal 2** (while node is running in Terminal 1):
```bash
npm run deploy:local
```

**What it does**: 
- Deploys all 3 contracts (ERC20, ERC721, ERC1155) to your local blockchain
- Shows you the contract addresses

**Important**: Copy the addresses it prints! You'll need them for the frontend.

**Example output**:
```
MyToken deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
MyNFT deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
MyMultiToken deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

---

### 4. Update Contract Addresses in Frontend

After deploying, edit this file:
```
app/lib/contracts/addresses.ts
```

Replace the zero addresses with the ones from deployment:

```typescript
export const CONTRACT_ADDRESSES = {
  MyToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",        // From deploy output
  MyNFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",          // From deploy output
  MyMultiToken: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",   // From deploy output
};
```

---

### 5. Start Frontend (Next.js App)

**Terminal 3**:
```bash
npm run dev
```

**What it does**: 
- Starts the web app at http://localhost:3000
- Opens in your browser automatically

**Keep this running** - Your app stays live while it's running.

**To stop**: Press `Ctrl + C`

---

### 6. Test Contracts

**Terminal** (can stop the node for this, or use new terminal):
```bash
npm test
```

**What it does**: 
- Runs all test files
- Tests each contract to make sure they work correctly
- Shows you which tests passed or failed

**Test specific contract**:
```bash
npx hardhat test test/MyToken.test.ts
npx hardhat test test/SecureVault.test.ts
```

---

### 7. Connect MetaMask to Local Blockchain

**Steps**:

1. Open MetaMask extension
2. Click network dropdown (top) → "Add Network" → "Add a network manually"
3. Fill in:
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 1337
   - **Currency Symbol**: ETH
4. Click "Save"

**Import Test Account**:

1. When you run `npm run node`, it shows private keys like:
   ```
   Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

2. In MetaMask: Click account icon → "Import Account" → Paste private key → "Import"

3. Now you have 10,000 test ETH! 🎉

---

### 8. Interact with Contracts (Frontend)

1. Open http://localhost:3000 in browser
2. Make sure MetaMask is connected to "Hardhat Local" network
3. Click "Connect Wallet" button
4. Approve connection in MetaMask
5. See your contract data displayed!

---

### 9. Deploy to Sepolia Testnet (Real Test Network)

**First, create `.env` file**:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_key_here
```

**Then deploy**:
```bash
npm run deploy:sepolia
```

**What it does**: 
- Deploys contracts to Sepolia (real Ethereum testnet)
- Costs test ETH (free from faucets)

---

## 📋 Complete Workflow (Step by Step)

### First Time Setup:

1. **Install dependencies** (one time):
   ```bash
   npm install
   ```

2. **Compile contracts**:
   ```bash
   npm run compile
   ```

### Every Time You Want to Test:

1. **Start local blockchain** (Terminal 1):
   ```bash
   npm run node
   ```

2. **Deploy contracts** (Terminal 2):
   ```bash
   npm run deploy:local
   ```
   - Copy the addresses!

3. **Update addresses** in `app/lib/contracts/addresses.ts`

4. **Start frontend** (Terminal 3):
   ```bash
   npm run dev
   ```

5. **Connect MetaMask**:
   - Add Hardhat Local network (Chain ID: 1337)
   - Import a test account using private key from Terminal 1

6. **Open browser**: http://localhost:3000

7. **Click "Connect Wallet"** and see your data!

---

## 🧹 Clean Up

**Clear compiled files** (start fresh):
```bash
npm run clean
```

**Stop everything**:
- Press `Ctrl + C` in each terminal running node/dev

---

## 📝 Common Commands Cheat Sheet

| What You Want | Command |
|--------------|---------|
| Compile contracts | `npm run compile` |
| Start local blockchain | `npm run node` |
| Deploy to local | `npm run deploy:local` |
| Start frontend | `npm run dev` |
| Run tests | `npm test` |
| Deploy to testnet | `npm run deploy:sepolia` |
| Clean cache | `npm run clean` |

---

## ❓ Troubleshooting

**"Port 8545 already in use"**:
- Another Hardhat node is running. Kill it or use different port.

**"Contract address is zero"**:
- You haven't deployed yet. Run `npm run deploy:local`

**"Failed to connect wallet"**:
- Make sure MetaMask is installed
- Make sure you're on "Hardhat Local" network
- Make sure the node is running

**"Contract data not loading"**:
- Check contract addresses are correct in `app/lib/contracts/addresses.ts`
- Make sure contracts are deployed (Terminal 1 still running)
- Check browser console for errors

---

**That's it! Simple and straightforward.** 🎯

