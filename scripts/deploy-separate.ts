import { ethers } from "hardhat";

// Separate deployment scripts for each contract if needed

async function deployERC20() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ERC20 Token with account:", deployer.address);

  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();
  await myToken.waitForDeployment();
  const address = await myToken.getAddress();

  console.log("MyToken deployed to:", address);
  return address;
}

async function deployERC721() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ERC721 NFT with account:", deployer.address);

  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy();
  await myNFT.waitForDeployment();
  const address = await myNFT.getAddress();

  console.log("MyNFT deployed to:", address);
  return address;
}

async function deployERC1155() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ERC1155 Multi-Token with account:", deployer.address);

  const MyMultiToken = await ethers.getContractFactory("MyMultiToken");
  const myMultiToken = await MyMultiToken.deploy();
  await myMultiToken.waitForDeployment();
  const address = await myMultiToken.getAddress();

  console.log("MyMultiToken deployed to:", address);
  return address;
}

// Run specific deployment based on command line argument
const contractType = process.argv[2];

if (contractType === "erc20") {
  deployERC20()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else if (contractType === "erc721") {
  deployERC721()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else if (contractType === "erc1155") {
  deployERC1155()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  console.log("Usage: npx hardhat run scripts/deploy-separate.ts --network <network> [erc20|erc721|erc1155]");
  process.exit(1);
}

