import { ethers, upgrades } from "hardhat";

/**
 * Deploy SimpleCounterV1 as UUPS Upgradeable Contract
 * 
 * How UUPS Works:
 * 1. Deploys a Proxy contract (this address stays the same)
 * 2. Deploys Implementation contract (SimpleCounterV1)
 * 3. Proxy forwards all calls to Implementation
 * 4. Storage is in Proxy, logic is in Implementation
 * 5. When upgrading, only Implementation changes, Proxy stays same
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying SimpleCounterV1 as UUPS upgradeable contract...");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get contract factory
  const SimpleCounterV1 = await ethers.getContractFactory("SimpleCounterV1");
  
  // Deploy as UUPS proxy
  // This creates:
  // 1. Proxy contract (address returned)
  // 2. Implementation contract (SimpleCounterV1)
  const proxy = await upgrades.deployProxy(
    SimpleCounterV1,
    [0], // Initialize with count = 0
    { 
      kind: "uups",  // Use UUPS pattern
      initializer: "initialize"  // Function to call on first deployment
    }
  );

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  // Get implementation address (the actual contract code)
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\n=== ✅ Deployment Complete ===");
  console.log("📍 Proxy Address (USE THIS!):", proxyAddress);
  console.log("📦 Implementation Address:", implementationAddress);
  console.log("\n💡 Important:");
  console.log("   - Proxy address stays the same when upgrading");
  console.log("   - Only implementation address changes");
  console.log("   - All data is stored in the proxy\n");

  // Test the contract
  console.log("=== Testing Contract ===");
  const initialCount = await proxy.getCount();
  console.log("Initial count:", initialCount.toString());

  console.log("\nIncrementing counter...");
  const tx = await proxy.increment();
  await tx.wait();
  
  const newCount = await proxy.getCount();
  console.log("New count:", newCount.toString());

  console.log("\n✅ Deployment and test successful!");
  console.log("\n📝 To upgrade to V2, run:");
  console.log(`   PROXY_ADDRESS=${proxyAddress} npm run upgrade:counter`);
  console.log("\n💾 Save this proxy address for upgrades!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

