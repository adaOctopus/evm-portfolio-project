// Contract addresses - Update these after deployment
// For local development, these will be set after running: npx hardhat node
// Then deploy with: npx hardhat run scripts/deploy.ts --network localhost

export const CONTRACT_ADDRESSES = {
  // Deployed contract addresses (updated after deployment)
  // NOTE: These addresses change every time Hardhat node restarts!
  // Run: npm run deploy:local to get fresh addresses
  MyToken: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
  MyNFT: process.env.NEXT_PUBLIC_NFT_ADDRESS || "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
  MyMultiToken: process.env.NEXT_PUBLIC_MULTITOKEN_ADDRESS || "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
  SecureVault: process.env.NEXT_PUBLIC_VAULT_ADDRESS || "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
  MachineDeFi: process.env.NEXT_PUBLIC_MACHINE_DEFI_ADDRESS || "0x0000000000000000000000000000000000000000",
};

// For local Hardhat network
export const LOCAL_NETWORK = {
  chainId: "0x539", // 1337 in hex
  chainIdNumber: 1337,
  chainName: "Hardhat Local",
  rpcUrls: ["http://127.0.0.1:8545"],
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
};

