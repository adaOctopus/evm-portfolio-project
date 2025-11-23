// Contract addresses - Update these after deployment
// For local development, these will be set after running: npx hardhat node
// Then deploy with: npx hardhat run scripts/deploy.ts --network localhost

export const CONTRACT_ADDRESSES = {
  // Update these addresses after deployment
  MyToken: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
  MyNFT: process.env.NEXT_PUBLIC_NFT_ADDRESS || "0x0000000000000000000000000000000000000000",
  MyMultiToken: process.env.NEXT_PUBLIC_MULTITOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
};

// For local Hardhat network
export const LOCAL_NETWORK = {
  chainId: "0x539", // 1337 in hex
  chainName: "Hardhat Local",
  rpcUrls: ["http://127.0.0.1:8545"],
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
};

