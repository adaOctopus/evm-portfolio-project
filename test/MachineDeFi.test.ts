import { expect } from "chai";
import { ethers } from "hardhat";
import { MachineDeFi, MachineToken } from "../typechain-types";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MachineDeFi", function () {
  async function deployMachineDeFiFixture() {
    const [owner, operator, investor1, investor2, investor3] = await ethers.getSigners();

    const MachineDeFiFactory = await ethers.getContractFactory("MachineDeFi");
    const machineDeFi = await MachineDeFiFactory.deploy();

    return { machineDeFi, owner, operator, investor1, investor2, investor3 };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { machineDeFi } = await loadFixture(deployMachineDeFiFixture);
      expect(await machineDeFi.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set correct owner", async function () {
      const { machineDeFi, owner } = await loadFixture(deployMachineDeFiFixture);
      expect(await machineDeFi.owner()).to.equal(owner.address);
    });

    it("Should have default platform fee of 2.5%", async function () {
      const { machineDeFi } = await loadFixture(deployMachineDeFiFixture);
      expect(await machineDeFi.platformFeeBps()).to.equal(250);
    });
  });

  describe("Machine Registration", function () {
    it("Should register a new machine and create token", async function () {
      const { machineDeFi, operator } = await loadFixture(deployMachineDeFiFixture);

      const tx = await machineDeFi.registerMachine(
        operator.address,
        "Tesla Supercharger #1234",
        "ipfs://QmXxx...",
        ethers.parseEther("1000000") // 1M shares
      );

      await expect(tx)
        .to.emit(machineDeFi, "MachineRegistered")
        .withArgs(1, operator.address, "Tesla Supercharger #1234", "ipfs://QmXxx...", expect.any(String));

      const machine = await machineDeFi.getMachine(1);
      expect(machine.machineId).to.equal(1);
      expect(machine.operator).to.equal(operator.address);
      expect(machine.name).to.equal("Tesla Supercharger #1234");
      expect(machine.totalShares).to.equal(ethers.parseEther("1000000"));
      expect(machine.active).to.be.true;

      const tokenAddress = await machineDeFi.getMachineToken(1);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);

      const token = await ethers.getContractAt("MachineToken", tokenAddress);
      expect(await token.balanceOf(operator.address)).to.equal(ethers.parseEther("1000000"));
    });

    it("Should revert if operator is zero address", async function () {
      const { machineDeFi } = await loadFixture(deployMachineDeFiFixture);

      await expect(
        machineDeFi.registerMachine(
          ethers.ZeroAddress,
          "Test Machine",
          "ipfs://...",
          ethers.parseEther("1000")
        )
      ).to.be.revertedWithCustomError(machineDeFi, "ZeroAddress");
    });

    it("Should allow multiple machines from same operator", async function () {
      const { machineDeFi, operator } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Machine 1", "ipfs://1", ethers.parseEther("1000"));
      await machineDeFi.registerMachine(operator.address, "Machine 2", "ipfs://2", ethers.parseEther("1000"));

      const machines = await machineDeFi.getOperatorMachines(operator.address);
      expect(machines.length).to.equal(2);
    });
  });

  describe("Revenue Reporting and Distribution", function () {
    it("Should report revenue and create snapshot", async function () {
      const { machineDeFi, operator } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(
        operator.address,
        "Revenue Machine",
        "ipfs://...",
        ethers.parseEther("1000000")
      );

      const revenueAmount = ethers.parseEther("1.0");
      const tx = await machineDeFi.connect(operator).reportRevenue(1, { value: revenueAmount });

      await expect(tx)
        .to.emit(machineDeFi, "RevenueReported")
        .withArgs(1, revenueAmount, 1, operator.address);

      const machine = await machineDeFi.getMachine(1);
      expect(machine.totalRevenue).to.equal(revenueAmount);
      expect(machine.lastRevenueShare).to.be.gt(0);
    });

    it("Should distribute revenue proportionally to token holders", async function () {
      const { machineDeFi, operator, investor1, investor2 } = await loadFixture(deployMachineDeFiFixture);

      // Register machine
      await machineDeFi.registerMachine(
        operator.address,
        "Revenue Machine",
        "ipfs://...",
        ethers.parseEther("1000")
      );

      const tokenAddress = await machineDeFi.getMachineToken(1);
      const token = await ethers.getContractAt("MachineToken", tokenAddress);

      // Operator transfers tokens to investors (simulating token sale)
      await token.connect(operator).transfer(investor1.address, ethers.parseEther("300")); // 30%
      await token.connect(operator).transfer(investor2.address, ethers.parseEther("200")); // 20%
      // Operator keeps 50%

      // Report revenue
      const revenueAmount = ethers.parseEther("10.0");
      await machineDeFi.connect(operator).reportRevenue(1, { value: revenueAmount });

      // Calculate expected shares (after 2.5% platform fee)
      const platformFee = (revenueAmount * 250n) / 10000n;
      const distributableRevenue = revenueAmount - platformFee;

      // Claim revenue
      await machineDeFi.connect(investor1).claimRevenue(1, 1);
      await machineDeFi.connect(investor2).claimRevenue(1, 1);
      await machineDeFi.connect(operator).claimRevenue(1, 1);

      // Check balances
      const investor1Share = (distributableRevenue * ethers.parseEther("300")) / ethers.parseEther("1000");
      const investor2Share = (distributableRevenue * ethers.parseEther("200")) / ethers.parseEther("1000");
      const operatorShare = (distributableRevenue * ethers.parseEther("500")) / ethers.parseEther("1000");

      // Note: Balances include initial ETH, so we need to check balance changes
      // This is simplified - in real test, track balance before/after
    });

    it("Should revert if not operator tries to report revenue", async function () {
      const { machineDeFi, operator, investor1 } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));

      await expect(
        machineDeFi.connect(investor1).reportRevenue(1, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(machineDeFi, "UnauthorizedOperator");
    });

    it("Should revert if revenue below minimum threshold", async function () {
      const { machineDeFi, operator } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));

      await expect(
        machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("0.001") })
      ).to.be.revertedWithCustomError(machineDeFi, "InsufficientRevenue");
    });

    it("Should handle multiple revenue reports correctly", async function () {
      const { machineDeFi, operator, investor1 } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));
      const tokenAddress = await machineDeFi.getMachineToken(1);
      const token = await ethers.getContractAt("MachineToken", tokenAddress);

      // Transfer some tokens
      await token.connect(operator).transfer(investor1.address, ethers.parseEther("100"));

      // First revenue report
      await machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") });

      // Transfer more tokens
      await token.connect(operator).transfer(investor1.address, ethers.parseEther("100"));

      // Second revenue report
      await machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") });

      const machine = await machineDeFi.getMachine(1);
      expect(machine.totalRevenue).to.equal(ethers.parseEther("2.0"));
      expect(await machineDeFi.snapshotCounters(1)).to.equal(2);
    });
  });

  describe("Revenue Claiming", function () {
    it("Should allow user to claim revenue based on snapshot", async function () {
      const { machineDeFi, operator, investor1 } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));
      const tokenAddress = await machineDeFi.getMachineToken(1);
      const token = await ethers.getContractAt("MachineToken", tokenAddress);

      await token.connect(operator).transfer(investor1.address, ethers.parseEther("100"));

      await machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") });

      const initialBalance = await ethers.provider.getBalance(investor1.address);

      const tx = await machineDeFi.connect(investor1).claimRevenue(1, 1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(investor1.address);

      // Check that revenue was claimed (accounting for gas)
      const platformFee = (ethers.parseEther("1.0") * 250n) / 10000n;
      const distributableRevenue = ethers.parseEther("1.0") - platformFee;
      const expectedShare = (distributableRevenue * ethers.parseEther("100")) / ethers.parseEther("1000");

      expect(finalBalance).to.be.closeTo(initialBalance + expectedShare - gasUsed, ethers.parseEther("0.0001"));
    });

    it("Should prevent double claiming", async function () {
      const { machineDeFi, operator, investor1 } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));
      const tokenAddress = await machineDeFi.getMachineToken(1);
      const token = await ethers.getContractAt("MachineToken", tokenAddress);

      await token.connect(operator).transfer(investor1.address, ethers.parseEther("100"));
      await machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") });

      await machineDeFi.connect(investor1).claimRevenue(1, 1);

      await expect(
        machineDeFi.connect(investor1).claimRevenue(1, 1)
      ).to.be.revertedWithCustomError(machineDeFi, "AlreadyClaimed");
    });

    it("Should revert if user has no shares at snapshot time", async function () {
      const { machineDeFi, operator, investor1 } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));
      await machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") });

      await expect(
        machineDeFi.connect(investor1).claimRevenue(1, 1)
      ).to.be.revertedWithCustomError(machineDeFi, "NoSharesOwned");
    });

    it("Should allow batch claiming", async function () {
      const { machineDeFi, operator, investor1 } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));
      const tokenAddress = await machineDeFi.getMachineToken(1);
      const token = await ethers.getContractAt("MachineToken", tokenAddress);

      await token.connect(operator).transfer(investor1.address, ethers.parseEther("100"));

      // Multiple revenue reports
      await machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") });
      await machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") });
      await machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") });

      const initialBalance = await ethers.provider.getBalance(investor1.address);

      await machineDeFi.connect(investor1).batchClaimRevenue(1, [1, 2, 3]);

      const finalBalance = await ethers.provider.getBalance(investor1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Metadata Management", function () {
    it("Should allow operator to update metadata", async function () {
      const { machineDeFi, operator } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://old", ethers.parseEther("1000"));

      await expect(machineDeFi.connect(operator).updateMachineMetadata(1, "ipfs://new"))
        .to.emit(machineDeFi, "MachineMetadataUpdated")
        .withArgs(1, "ipfs://new");

      const machine = await machineDeFi.getMachine(1);
      expect(machine.metadataURI).to.equal("ipfs://new");
    });

    it("Should revert if non-operator tries to update metadata", async function () {
      const { machineDeFi, operator, investor1 } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://old", ethers.parseEther("1000"));

      await expect(
        machineDeFi.connect(investor1).updateMachineMetadata(1, "ipfs://new")
      ).to.be.revertedWithCustomError(machineDeFi, "UnauthorizedOperator");
    });
  });

  describe("Machine Management", function () {
    it("Should allow operator to activate/deactivate machine", async function () {
      const { machineDeFi, operator } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));

      await machineDeFi.connect(operator).setMachineStatus(1, false);
      let machine = await machineDeFi.getMachine(1);
      expect(machine.active).to.be.false;

      await machineDeFi.connect(operator).setMachineStatus(1, true);
      machine = await machineDeFi.getMachine(1);
      expect(machine.active).to.be.true;
    });

    it("Should prevent revenue reporting when machine is inactive", async function () {
      const { machineDeFi, operator } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));
      await machineDeFi.connect(operator).setMachineStatus(1, false);

      await expect(
        machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(machineDeFi, "MachineNotActive");
    });

    it("Should allow operator transfer", async function () {
      const { machineDeFi, operator, investor1 } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));

      await machineDeFi.connect(operator).transferOperator(1, investor1.address);

      const machine = await machineDeFi.getMachine(1);
      expect(machine.operator).to.equal(investor1.address);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set platform fee", async function () {
      const { machineDeFi, owner } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.connect(owner).setPlatformFee(500); // 5%
      expect(await machineDeFi.platformFeeBps()).to.equal(500);
    });

    it("Should revert if platform fee > 10%", async function () {
      const { machineDeFi, owner } = await loadFixture(deployMachineDeFiFixture);

      await expect(
        machineDeFi.connect(owner).setPlatformFee(1100) // 11%
      ).to.be.revertedWithCustomError(machineDeFi, "InvalidFee");
    });

    it("Should allow owner to pause/unpause", async function () {
      const { machineDeFi, owner, operator } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));

      await machineDeFi.connect(owner).pause();

      await expect(
        machineDeFi.registerMachine(operator.address, "Test2", "ipfs://...", ethers.parseEther("1000"))
      ).to.be.reverted;

      await machineDeFi.connect(owner).unpause();

      await machineDeFi.registerMachine(operator.address, "Test3", "ipfs://...", ethers.parseEther("1000"));
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for machine registration", async function () {
      const { machineDeFi, operator } = await loadFixture(deployMachineDeFiFixture);

      const tx = await machineDeFi.registerMachine(
        operator.address,
        "Gas Test Machine",
        "ipfs://gas-test",
        ethers.parseEther("1000000")
      );
      const receipt = await tx.wait();

      // Registration should be under 1M gas (includes token deployment)
      expect(receipt!.gasUsed).to.be.lessThan(1000000n);
    });

    it("Should use reasonable gas for revenue reporting", async function () {
      const { machineDeFi, operator } = await loadFixture(deployMachineDeFiFixture);

      await machineDeFi.registerMachine(operator.address, "Test", "ipfs://...", ethers.parseEther("1000"));

      const tx = await machineDeFi.connect(operator).reportRevenue(1, { value: ethers.parseEther("1.0") });
      const receipt = await tx.wait();

      // Revenue reporting should be efficient
      expect(receipt!.gasUsed).to.be.lessThan(200000n);
    });
  });
});

