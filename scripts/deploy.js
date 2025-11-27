const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy ERC20 Token
  console.log("\n--- Deploying ERC20 Token ---");
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();
  await myToken.waitForDeployment();
  const tokenAddress = await myToken.getAddress();
  console.log("MyToken deployed to:", tokenAddress);

  // Deploy ERC721 NFT
  console.log("\n--- Deploying ERC721 NFT ---");
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy();
  await myNFT.waitForDeployment();
  const nftAddress = await myNFT.getAddress();
  console.log("MyNFT deployed to:", nftAddress);

  // Deploy ERC1155 Multi-Token
  console.log("\n--- Deploying ERC1155 Multi-Token ---");
  const MyMultiToken = await ethers.getContractFactory("MyMultiToken");
  const myMultiToken = await MyMultiToken.deploy();
  await myMultiToken.waitForDeployment();
  const multiTokenAddress = await myMultiToken.getAddress();
  console.log("MyMultiToken deployed to:", multiTokenAddress);

  // Deploy SecureVault
  console.log("\n--- Deploying SecureVault ---");
  const SecureVault = await ethers.getContractFactory("SecureVault");
  const secureVault = await SecureVault.deploy();
  await secureVault.waitForDeployment();
  const vaultAddress = await secureVault.getAddress();
  console.log("SecureVault deployed to:", vaultAddress);

  console.log("\n--- Deploying TToken ---");
  const TToken = await ethers.getContractFactory("TToken");
  const tToken = await TToken.deploy();
  await tToken.waitForDeployment();
  const tTokenAddress = await tToken.getAddress();
  console.log("TToken deployed to:", tTokenAddress);

  console.log("\n--- Deploying TokenHandler ---");
  const TokenHandler = await ethers.getContractFactory("TokenHandler");
  const tokenHandler = await TokenHandler.deploy();
  await tokenHandler.waitForDeployment();
  const tokenHandlerAddress = await tokenHandler.getAddress();
  console.log("TokenHandler deployed to:", tokenHandlerAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("ERC20 Token (MyToken):", tokenAddress);
  console.log("ERC721 NFT (MyNFT):", nftAddress);
  console.log("ERC1155 Multi-Token (MyMultiToken):", multiTokenAddress);
  console.log("SecureVault:", vaultAddress);
  console.log("\n✅ Copy these addresses and update app/lib/contracts/addresses.ts");
  console.log("\n=== Copy this into addresses.ts ===");
  console.log(`MyToken: "${tokenAddress}",`);
  console.log(`MyNFT: "${nftAddress}",`);
  console.log(`MyMultiToken: "${multiTokenAddress}",`);
  console.log(`SecureVault: "${vaultAddress}",`);
  console.log("TokenHandler:", tokenHandlerAddress);
  console.log("TToken:", tTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

