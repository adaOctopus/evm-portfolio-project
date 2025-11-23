import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying MachineDeFi contract with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Deploy MachineDeFi contract
  console.log("\n--- Deploying MachineDeFi ---");
  const MachineDeFi = await ethers.getContractFactory("MachineDeFi");
  const machineDeFi = await MachineDeFi.deploy();
  await machineDeFi.waitForDeployment();
  
  const machineDeFiAddress = await machineDeFi.getAddress();
  console.log("MachineDeFi deployed to:", machineDeFiAddress);

  // Example: Register a test machine (optional)
  console.log("\n--- Registering Example Machine ---");
  const registerTx = await machineDeFi.registerMachine(
    deployer.address, // Operator address
    "Tesla Supercharger Station #1234", // Machine name
    "ipfs://QmXxx...", // Metadata URI (replace with actual IPFS hash)
    ethers.parseEther("1000000") // 1M shares
  );
  
  await registerTx.wait();
  const machineId = 1;
  const machine = await machineDeFi.getMachine(machineId);
  const tokenAddress = await machineDeFi.getMachineToken(machineId);
  
  console.log("Example machine registered:");
  console.log("  Machine ID:", machine.machineId.toString());
  console.log("  Name:", machine.name);
  console.log("  Operator:", machine.operator);
  console.log("  Token Address:", tokenAddress);
  console.log("  Total Shares:", ethers.formatEther(machine.totalShares));

  console.log("\n=== Deployment Summary ===");
  console.log("MachineDeFi Contract:", machineDeFiAddress);
  console.log("\nConfiguration:");
  console.log("  Platform Fee:", (await machineDeFi.platformFeeBps()).toString(), "bps (2.5% default)");
  console.log("  Min Revenue Threshold:", ethers.formatEther(await machineDeFi.minRevenueThreshold()), "ETH");
  console.log("\nExample Machine:");
  console.log("  Machine ID:", machineId);
  console.log("  Token Address:", tokenAddress);
  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Update contract address in your frontend/app");
  console.log("2. Register real machines using registerMachine()");
  console.log("3. Deploy machine tokens are created automatically");
  console.log("4. Operators can report revenue using reportRevenue()");
  console.log("5. Token holders can claim revenue using claimRevenue()");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

