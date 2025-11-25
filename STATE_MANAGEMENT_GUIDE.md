# State Management Guide

## Current Approach: React Hooks + Props

### How We Manage State

**1. Local Component State (useState)**
```typescript
// In app/page.tsx
const [contractData, setContractData] = useState<ContractDataType | null>(null)
const [isLoading, setIsLoading] = useState(false)
const [dataError, setDataError] = useState<string | null>(null)

// In app/components/MintNFTForm.tsx
const [tokenURI, setTokenURI] = useState("")
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

**2. Custom Hook for Wallet State**
```typescript
// app/hooks/useWallet.ts
export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    signer: null,
    provider: null,
    isConnected: false,
  })
  // ... returns wallet state and functions
}
```

**3. Props Drilling**
```typescript
// Main page passes down to children
<MintNFTForm signer={signer} userAddress={address} />
<MintERC1155Form signer={signer} userAddress={address} />
```

### Current Structure

- **Wallet State**: Managed in `useWallet` hook, used in main page
- **Contract Data**: Local state in main page, fetched via `useEffect`
- **Form State**: Each form component manages its own state (loading, errors, inputs)
- **No Global State**: Everything is local or passed via props

---

## Is This The Best Way?

### ✅ Pros (Current Approach)

1. **Simple & Lightweight** - No extra dependencies
2. **Easy to Understand** - Standard React patterns
3. **Good for Small Apps** - Works well for current scope
4. **No Overhead** - No state management library needed

### ❌ Cons (Current Approach)

1. **Props Drilling** - Passing `signer` and `address` through multiple components
2. **Duplicate State** - Each form has its own loading/error state
3. **No Shared State** - Contract data refetched in each component that needs it
4. **Hard to Scale** - Adding more features becomes messy

---

## Alternative Approaches

### Option 1: React Context API (Recommended for This App)

**Best For**: Sharing wallet state and contract data across components

**Implementation**:
```typescript
// app/context/WalletContext.tsx
const WalletContext = createContext<WalletContextType | null>(null)

export const WalletProvider = ({ children }) => {
  const wallet = useWallet()
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

// Usage in components
const { signer, address } = useContext(WalletContext)
```

**Pros**:
- Eliminates props drilling
- Wallet state accessible anywhere
- Built into React (no dependencies)
- Perfect for wallet connection state

**Cons**:
- Can cause unnecessary re-renders if not optimized
- Still need useState for local form state

---

### Option 2: Zustand (Lightweight State Library)

**Best For**: Global state with minimal boilerplate

**Implementation**:
```typescript
// app/store/walletStore.ts
import { create } from 'zustand'

interface WalletStore {
  address: string | null
  signer: JsonRpcSigner | null
  isConnected: boolean
  setWallet: (wallet: WalletState) => void
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: null,
  signer: null,
  isConnected: false,
  setWallet: (wallet) => set(wallet),
}))

// Usage
const { address, signer } = useWalletStore()
```

**Pros**:
- Very lightweight (~1KB)
- No providers needed
- Simple API
- Good TypeScript support

**Cons**:
- Extra dependency
- Might be overkill for small apps

---

### Option 3: React Query (For Async Data)

**Best For**: Managing contract data fetching, caching, refetching

**Implementation**:
```typescript
// app/hooks/useContractData.ts
import { useQuery } from '@tanstack/react-query'

export const useContractData = (address: string, signer: JsonRpcSigner) => {
  return useQuery({
    queryKey: ['contractData', address],
    queryFn: () => fetchContractData(address, signer),
    enabled: !!address && !!signer,
  })
}

// Usage
const { data, isLoading, error } = useContractData(address, signer)
```

**Pros**:
- Automatic caching
- Background refetching
- Loading/error states handled
- Prevents duplicate requests

**Cons**:
- Extra dependency
- Learning curve
- Might be overkill for simple fetches

---

### Option 4: Redux Toolkit (For Complex Apps)

**Best For**: Large applications with complex state interactions

**Pros**:
- Industry standard
- Great dev tools
- Predictable state updates
- Time-travel debugging

**Cons**:
- Heavy boilerplate
- Steep learning curve
- Overkill for this app size

---

## Recommendation

### For Current App Size: **React Context API**

**Why**:
1. Eliminates props drilling for wallet state
2. No extra dependencies
3. Simple to implement
4. Perfect for wallet connection state
5. Can keep local state for forms

**Implementation Plan**:
```typescript
// 1. Create WalletContext
app/context/WalletContext.tsx

// 2. Wrap app in WalletProvider
app/layout.tsx

// 3. Use context in components
const { signer, address } = useWalletContext()
```

### For Future Growth: **Zustand + React Query**

**Why**:
1. Zustand for wallet state (simpler than Context)
2. React Query for contract data (caching, refetching)
3. Still lightweight
4. Scales better

---

## Quick Comparison

| Approach | Complexity | Bundle Size | Best For |
|----------|-----------|-------------|----------|
| **Current (Hooks)** | Low | 0KB | Small apps |
| **Context API** | Low | 0KB | Sharing wallet state |
| **Zustand** | Low | ~1KB | Global state |
| **React Query** | Medium | ~10KB | Async data |
| **Redux** | High | ~15KB | Large apps |

---

## Summary

**Current**: React Hooks + Props → Works but has props drilling  
**Recommended**: React Context API → Eliminates props drilling, no dependencies  
**Future**: Zustand + React Query → Better scaling, still lightweight

