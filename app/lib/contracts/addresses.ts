// Contract addresses - Update these after deployment
// For local development, these will be set after running: npx hardhat node
// Then deploy with: npx hardhat run scripts/deploy.ts --network localhost

export const CONTRACT_ADDRESSES = {
  // Deployed contract addresses (updated after deployment)
  // NOTE: These addresses change every time Hardhat node restarts!
  // Run: npm run deploy:local to get fresh addresses
  MyToken: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  MyNFT: process.env.NEXT_PUBLIC_NFT_ADDRESS || "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  MyMultiToken: process.env.NEXT_PUBLIC_MULTITOKEN_ADDRESS || "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
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

