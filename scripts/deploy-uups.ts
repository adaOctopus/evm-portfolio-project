import { ethers, upgrades } from "hardhat";

/**
 * Deploy UUPS Upgradeable Contract
 * 
 * This script deploys the SimpleStorageV1 contract as a UUPS proxy.
 * The proxy address stays the same, but the implementation can be upgraded.
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying SimpleStorageV1 as UUPS upgradeable contract...");
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy the implementation contract behind a UUPS proxy
  const SimpleStorageV1 = await ethers.getContractFactory("SimpleStorageV1");
  
  // Deploy as UUPS proxy
  // The proxy address will be returned, but the implementation is deployed separately
  const proxy = await upgrades.deployProxy(
    SimpleStorageV1,
    [100], // Initial value: 100
    { 
      kind: "uups",
      initializer: "initialize"
    }
  );

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  // Get the implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("✅ Proxy Address (use this!):", proxyAddress);
  console.log("📦 Implementation Address:", implementationAddress);
  console.log("\n💡 The proxy address stays the same when you upgrade.");
  console.log("💡 Only the implementation address changes.\n");

  // Verify the contract works
  console.log("=== Testing Contract ===");
  const value = await proxy.getValue();
  console.log("Initial stored value:", value.toString());

  // Set a new value
  console.log("\nSetting value to 200...");
  const tx = await proxy.setValue(200);
  await tx.wait();
  
  const newValue = await proxy.getValue();
  console.log("New stored value:", newValue.toString());

  console.log("\n✅ Deployment and test complete!");
  console.log("\n📝 To upgrade this contract, run:");
  console.log("   npm run upgrade:local");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

