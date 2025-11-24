# Developer Flow Guide: NFT, Token & MultiToken Integration

A concise guide explaining the complete flow from wallet connection to contract interaction and data display.

---

## 1. Wallet Connection Flow

### Where It Happens
**File**: `app/hooks/useWallet.ts`

### How It Works
1. **Check for Wallet Provider** (MetaMask)
   - Detects `window.ethereum` in browser
   - Handles multiple wallet extensions

2. **Request Connection**
   ```typescript
   await ethereumProvider.request({ method: "eth_requestAccounts" })
   ```

3. **Create Provider & Signer**
   ```typescript
   const provider = new BrowserProvider(window.ethereum)
   const signer = await provider.getSigner()
   const address = await signer.getAddress()
   ```

4. **Store Connection State**
   - Address, signer, provider stored in React state
   - Listens for account/chain changes

### Integration Point
```typescript
// In your component
const { address, signer, isConnected, connectWallet } = useWallet()
```

---

## 2. Contract Location & Deployment

### Contract Files
- **ERC20 Token**: `contracts/MyToken.sol`
- **ERC721 NFT**: `contracts/MyNFT.sol`
- **ERC1155 MultiToken**: `contracts/MyMultiToken.sol`

### Deployment Process

**Step 1: Start Local Network**
```bash
npm run node  # Starts Hardhat node on localhost:8545
```

**Step 2: Deploy Contracts**
```bash
npm run deploy:local  # Runs scripts/deploy.ts
```

**Step 3: Get Contract Addresses**
After deployment, you'll see:
```
ERC20 Token (MyToken): 0x5FbDB2315678afecb367f032d93F642f64180aa3
ERC721 NFT (MyNFT): 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ERC1155 Multi-Token (MyMultiToken): 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**Step 4: Update Frontend Addresses**
**File**: `app/lib/contracts/addresses.ts`
```typescript
export const CONTRACT_ADDRESSES = {
  MyToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  MyNFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  MyMultiToken: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
}
```

---

## 3. Getting Serialized Data (ABIs)

### What Are ABIs?
Application Binary Interfaces - JSON/array that describes contract functions the frontend can call.

### Where ABIs Are Defined
**File**: `app/lib/contracts/abis.ts`

### ABI Structure
```typescript
export const MyTokenABI = [
  "function name() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  // ... more functions
]
```

### Alternative: Generated ABIs
Full ABIs are also generated during compilation:
- **Location**: `artifacts/contracts/MyToken.sol/MyToken.json`
- **Usage**: Import and extract `abi` property

---

## 4. Frontend Integration

### Integration Layer
**File**: `app/lib/contracts/contracts.ts`

### Contract Instance Creation
```typescript
import { Contract } from "ethers"
import { CONTRACT_ADDRESSES } from "./addresses"
import { MyTokenABI } from "./abis"

export const getMyTokenContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyToken, MyTokenABI, signer)
}
```

### Usage Pattern
1. Get signer from wallet hook
2. Create contract instance with address + ABI + signer
3. Call contract functions

---

## 5. Interacting with Contracts

### ERC20 Token Interaction

**Minting Tokens**:
```typescript
const tokenContract = getMyTokenContract(signer)
const tx = await tokenContract.mint(userAddress, parseEther("1000"))
await tx.wait()  // Wait for confirmation
```

**Reading Data**:
```typescript
const name = await tokenContract.name()
const balance = await tokenContract.balanceOf(userAddress)
const totalSupply = await tokenContract.totalSupply()
```

### ERC721 NFT Interaction

**Minting NFT**:
```typescript
const nftContract = new Contract(
  CONTRACT_ADDRESSES.MyNFT, 
  MyNFTABI, 
  signer
)
const tx = await nftContract.mint(userAddress, "https://example.com/metadata.json")
await tx.wait()
```

**Reading NFT Data**:
```typescript
const totalSupply = await nftContract.totalSupply()
const balance = await nftContract.balanceOf(userAddress)
const owner = await nftContract.ownerOf(tokenId)
const tokenURI = await nftContract.tokenURI(tokenId)
```

### ERC1155 MultiToken Interaction

**Minting MultiTokens**:
```typescript
const multiTokenContract = new Contract(
  CONTRACT_ADDRESSES.MyMultiToken,
  MyMultiTokenABI,
  signer
)
// Mint Gold tokens (ID: 0)
const tx = await multiTokenContract.mint(userAddress, 0, 100, "0x")
await tx.wait()
```

**Reading MultiToken Data**:
```typescript
const goldBalance = await multiTokenContract.balanceOf(userAddress, 0)
const silverBalance = await multiTokenContract.balanceOf(userAddress, 1)
const bronzeBalance = await multiTokenContract.balanceOf(userAddress, 2)
```

### Complete Example: MintNFTForm Component

**File**: `app/components/MintNFTForm.tsx`

```typescript
const handleMint = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // 1. Create contract instance
  const nftContract = new Contract(
    CONTRACT_ADDRESSES.MyNFT, 
    MyNFTABI, 
    signer
  )
  
  // 2. Check ownership (if needed)
  const owner = await nftContract.owner()
  
  // 3. Call contract function
  const tx = await nftContract.mint(userAddress, tokenURI)
  
  // 4. Wait for confirmation
  await tx.wait()
  
  // 5. Update UI
  setSuccess(`NFT minted! Hash: ${tx.hash}`)
}
```

---

## 6. Displaying Data

### Data Fetching Function
**File**: `app/lib/contracts/contracts.ts`

```typescript
export const fetchContractData = async (
  address: string,
  signer: JsonRpcSigner
): Promise<ContractData> => {
  // Create contract instances
  const tokenContract = getMyTokenContract(signer)
  const nftContract = getMyNFTContract(signer)
  const multiTokenContract = getMyMultiTokenContract(signer)
  
  // Fetch all data in parallel
  const [tokenName, tokenBalance, nftTotalSupply, goldBalance] = 
    await Promise.all([
      tokenContract.name(),
      tokenContract.balanceOf(address),
      nftContract.totalSupply(),
      multiTokenContract.balanceOf(address, 0),
    ])
  
  return {
    tokenName,
    tokenBalance: formatEther(tokenBalance),
    nftTotalSupply: nftTotalSupply.toString(),
    goldBalance: goldBalance.toString(),
    // ... more data
  }
}
```

### Display Component
**File**: `app/components/ContractData.tsx`

```typescript
export const ContractData = ({ data, isLoading }: ContractDataProps) => {
  if (isLoading) return <LoadingSpinner />
  if (!data) return <ConnectWalletPrompt />
  
  return (
    <div className="grid md:grid-cols-3">
      {/* ERC20 Card */}
      <div>
        <h3>ERC20 Token</h3>
        <p>Name: {data.tokenName}</p>
        <p>Balance: {data.tokenBalance}</p>
      </div>
      
      {/* ERC721 Card */}
      <div>
        <h3>ERC721 NFT</h3>
        <p>Total: {data.nftTotalSupply}</p>
        <p>Your NFTs: {data.nftBalance}</p>
      </div>
      
      {/* ERC1155 Card */}
      <div>
        <h3>ERC1155 Tokens</h3>
        <p>Gold: {data.goldBalance}</p>
        <p>Silver: {data.silverBalance}</p>
        <p>Bronze: {data.bronzeBalance}</p>
      </div>
    </div>
  )
}
```

### Main Page Integration
**File**: `app/page.tsx`

```typescript
export default function Home() {
  const { address, signer, isConnected } = useWallet()
  const [contractData, setContractData] = useState(null)
  
  useEffect(() => {
    if (isConnected && signer) {
      loadContractData()
    }
  }, [isConnected, signer])
  
  const loadContractData = async () => {
    const data = await fetchContractData(address, signer)
    setContractData(data)
  }
  
  return (
    <div>
      <WalletConnectButton />
      <ContractData data={contractData} />
      {isConnected && <MintNFTForm signer={signer} userAddress={address} />}
    </div>
  )
}
```

---

## Complete Flow Summary

### Step-by-Step Process

1. **User Clicks "Connect Wallet"**
   - `useWallet` hook detects MetaMask
   - Requests account access
   - Creates provider and signer
   - Stores connection state

2. **Wallet Connected**
   - `useEffect` in main page triggers
   - Calls `fetchContractData(address, signer)`

3. **Fetching Data**
   - Creates contract instances using addresses + ABIs + signer
   - Calls view functions (read-only)
   - Formats and returns data

4. **Displaying Data**
   - `ContractData` component receives data
   - Renders in cards (ERC20, ERC721, ERC1155)

5. **User Interaction**
   - User fills form (e.g., mint NFT)
   - Component creates contract instance
   - Calls write function (e.g., `mint()`)
   - Waits for transaction confirmation
   - Updates UI with success/error

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/hooks/useWallet.ts` | Wallet connection logic |
| `contracts/MyToken.sol` | ERC20 contract |
| `contracts/MyNFT.sol` | ERC721 contract |
| `contracts/MyMultiToken.sol` | ERC1155 contract |
| `scripts/deploy.ts` | Deployment script |
| `app/lib/contracts/addresses.ts` | Contract addresses |
| `app/lib/contracts/abis.ts` | Contract ABIs |
| `app/lib/contracts/contracts.ts` | Contract utilities |
| `app/components/MintNFTForm.tsx` | NFT minting UI |
| `app/components/ContractData.tsx` | Data display component |
| `app/page.tsx` | Main page integration |

---

## Quick Reference: Common Patterns

### Pattern 1: Read Contract Data
```typescript
const contract = new Contract(address, abi, signer)
const data = await contract.functionName()
```

### Pattern 2: Write to Contract
```typescript
const contract = new Contract(address, abi, signer)
const tx = await contract.functionName(params)
await tx.wait()
```

### Pattern 3: Batch Read Operations
```typescript
const [data1, data2, data3] = await Promise.all([
  contract1.read(),
  contract2.read(),
  contract3.read(),
])
```

### Pattern 4: Error Handling
```typescript
try {
  const tx = await contract.mint(...)
  await tx.wait()
  setSuccess("Success!")
} catch (err: any) {
  setError(err.message)
}
```

---

## Summary

**Wallet Connection** → `useWallet` hook manages MetaMask connection  
**Contracts** → Solidity files in `contracts/` folder  
**Deployment** → `npm run deploy:local` after `npm run node`  
**Addresses** → Update `app/lib/contracts/addresses.ts`  
**ABIs** → Defined in `app/lib/contracts/abis.ts`  
**Integration** → Create contract instances in components  
**Interaction** → Use signer to call contract functions  
**Display** → Fetch data and render in React components

