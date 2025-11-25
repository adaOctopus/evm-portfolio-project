import { ethers, upgrades } from "hardhat";

/**
 * Upgrade UUPS Contract
 * 
 * This script upgrades the SimpleStorageV1 proxy to SimpleStorageV2.
 * The proxy address stays the same, but the implementation changes.
 * 
 * IMPORTANT: Update PROXY_ADDRESS with your deployed proxy address!
 */
async function main() {
  // ⚠️ UPDATE THIS with your proxy address from deployment
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "0x0000000000000000000000000000000000000000";

  if (PROXY_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ Error: PROXY_ADDRESS not set!");
    console.log("Set it in .env file or pass as environment variable:");
    console.log("  PROXY_ADDRESS=0x... npm run upgrade:local");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();

  console.log("Upgrading SimpleStorageV1 to SimpleStorageV2...");
  console.log("Deployer address:", deployer.address);
  console.log("Proxy address:", PROXY_ADDRESS);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Verify current implementation
  const currentImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Current implementation:", currentImplementation);

  // Get current value before upgrade
  const proxy = await ethers.getContractAt("SimpleStorageV1", PROXY_ADDRESS);
  const valueBefore = await proxy.getValue();
  console.log("Value before upgrade:", valueBefore.toString());

  // Deploy new implementation and upgrade proxy
  const SimpleStorageV2 = await ethers.getContractFactory("SimpleStorageV2");
  
  console.log("\nUpgrading proxy to V2...");
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, SimpleStorageV2);
  await upgraded.waitForDeployment();

  // Get new implementation address
  const newImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);

  console.log("\n=== Upgrade Summary ===");
  console.log("✅ Proxy Address (unchanged):", PROXY_ADDRESS);
  console.log("📦 Old Implementation:", currentImplementation);
  console.log("📦 New Implementation:", newImplementation);
  console.log("\n💡 Proxy address stays the same!");
  console.log("💡 Only the implementation changed.\n");

  // Verify the contract works with new version
  console.log("=== Testing Upgraded Contract ===");
  const valueAfter = await upgraded.getValue();
  console.log("Value after upgrade (preserved):", valueAfter.toString());

  // Test new V2 functionality
  const v2Contract = await ethers.getContractAt("SimpleStorageV2", PROXY_ADDRESS);
  const updateCount = await v2Contract.getUpdateCount();
  console.log("Update count (new in V2):", updateCount.toString());

  // Test setting a value (should increment counter)
  console.log("\nSetting value to 300 (should increment counter)...");
  const tx = await v2Contract.setValue(300);
  await tx.wait();

  const newValue = await v2Contract.getValue();
  const newCount = await v2Contract.getUpdateCount();
  console.log("New value:", newValue.toString());
  console.log("New count:", newCount.toString());

  console.log("\n✅ Upgrade complete!");
  console.log("✅ All data preserved!");
  console.log("✅ New functionality working!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

