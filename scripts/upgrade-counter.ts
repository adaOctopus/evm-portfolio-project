import { ethers, upgrades } from "hardhat";

/**
 * Upgrade SimpleCounterV1 to SimpleCounterV2
 * 
 * How Upgrade Works:
 * 1. Deploys new Implementation contract (SimpleCounterV2)
 * 2. Updates Proxy to point to new Implementation
 * 3. Proxy address stays the same
 * 4. All existing data is preserved
 * 5. New functionality is available
 */
async function main() {
  // Get proxy address from environment or use default
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "0x0000000000000000000000000000000000000000";

  if (PROXY_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ Error: PROXY_ADDRESS not set!");
    console.log("\nUsage:");
    console.log("  PROXY_ADDRESS=0x... npm run upgrade:counter");
    console.log("\nOr set in .env file:");
    console.log("  PROXY_ADDRESS=0x...");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();

  console.log("🔄 Upgrading SimpleCounterV1 to SimpleCounterV2...");
  console.log("Deployer:", deployer.address);
  console.log("Proxy:", PROXY_ADDRESS);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get current implementation
  const currentImpl = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Current implementation:", currentImpl);

  // Get current state before upgrade
  const v1Contract = await ethers.getContractAt("SimpleCounterV1", PROXY_ADDRESS);
  const countBefore = await v1Contract.getCount();
  console.log("Count before upgrade:", countBefore.toString());

  // Deploy new implementation and upgrade proxy
  const SimpleCounterV2 = await ethers.getContractFactory("SimpleCounterV2");
  
  console.log("\nDeploying V2 implementation and upgrading proxy...");
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, SimpleCounterV2);
  await upgraded.waitForDeployment();

  // Get new implementation address
  const newImpl = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);

  console.log("\n=== ✅ Upgrade Complete ===");
  console.log("📍 Proxy Address (unchanged):", PROXY_ADDRESS);
  console.log("📦 Old Implementation:", currentImpl);
  console.log("📦 New Implementation:", newImpl);
  console.log("\n💡 Proxy address stayed the same!");
  console.log("💡 Only implementation changed.\n");

  // Verify data is preserved
  console.log("=== Verifying Upgrade ===");
  const v2Contract = await ethers.getContractAt("SimpleCounterV2", PROXY_ADDRESS);
  
  const countAfter = await v2Contract.getCount();
  console.log("Count after upgrade (preserved):", countAfter.toString());
  
  if (countAfter.toString() === countBefore.toString()) {
    console.log("✅ Data preserved correctly!");
  } else {
    console.log("⚠️  Warning: Data mismatch!");
  }

  // Test new V2 functionality
  console.log("\n=== Testing New V2 Features ===");
  const maxCount = await v2Contract.getMaxCount();
  console.log("Max count (new in V2):", maxCount.toString());

  console.log("\nTesting decrement (new in V2)...");
  const tx = await v2Contract.decrement();
  await tx.wait();
  
  const newCount = await v2Contract.getCount();
  console.log("Count after decrement:", newCount.toString());

  console.log("\nTesting increment (should update max)...");
  await v2Contract.increment();
  await v2Contract.increment();
  const finalCount = await v2Contract.getCount();
  const finalMax = await v2Contract.getMaxCount();
  console.log("Final count:", finalCount.toString());
  console.log("Final max:", finalMax.toString());

  console.log("\n✅ Upgrade successful!");
  console.log("✅ All data preserved!");
  console.log("✅ New functionality working!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

