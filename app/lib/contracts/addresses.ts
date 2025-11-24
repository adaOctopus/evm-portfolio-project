// Contract addresses - Update these after deployment
// For local development, these will be set after running: npx hardhat node
// Then deploy with: npx hardhat run scripts/deploy.ts --network localhost

export const CONTRACT_ADDRESSES = {
  // Deployed contract addresses (updated after deployment)
  // NOTE: These addresses change every time Hardhat node restarts!
  // Run: npm run deploy:local to get fresh addresses
  MyToken: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  MyNFT: process.env.NEXT_PUBLIC_NFT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  MyMultiToken: process.env.NEXT_PUBLIC_MULTITOKEN_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  SecureVault: process.env.NEXT_PUBLIC_VAULT_ADDRESS || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
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

