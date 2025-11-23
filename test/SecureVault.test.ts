import { expect } from "chai";
import { ethers } from "hardhat";

describe("SecureVault", function () {
  let vault: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const SecureVault = await ethers.getContractFactory("SecureVault");
    vault = await SecureVault.deploy();
    await vault.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });
  });

  describe("Deposits", function () {
    it("Should allow deposits", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await expect(vault.connect(addr1).deposit({ value: depositAmount }))
        .to.emit(vault, "Deposit")
        .withArgs(addr1.address, depositAmount);

      expect(await vault.getBalance(addr1.address)).to.equal(depositAmount);
    });

    it("Should prevent deposits when paused", async function () {
      await vault.pause();
      await expect(
        vault.connect(addr1).deposit({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await vault.connect(addr1).deposit({ value: ethers.parseEther("2.0") });
    });

    it("Should allow withdrawals", async function () {
      const withdrawAmount = ethers.parseEther("1.0");
      await expect(vault.connect(addr1).withdraw(withdrawAmount))
        .to.emit(vault, "Withdrawal")
        .withArgs(addr1.address, withdrawAmount);

      expect(await vault.getBalance(addr1.address)).to.equal(ethers.parseEther("1.0"));
    });

    it("Should prevent withdrawals when paused", async function () {
      await vault.pause();
      await expect(
        vault.connect(addr1).withdraw(ethers.parseEther("1.0"))
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");
    });

    it("Should prevent withdrawing more than balance", async function () {
      await expect(
        vault.connect(addr1).withdraw(ethers.parseEther("3.0"))
      ).to.be.revertedWithCustomError(vault, "Panic").withArgs(0x11);
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      await vault.pause();
      expect(await vault.paused()).to.be.true;
    });

    it("Should allow owner to unpause", async function () {
      await vault.pause();
      await vault.unpause();
      expect(await vault.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        vault.connect(addr1).pause()
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Withdraw", function () {
    beforeEach(async function () {
      await vault.connect(addr1).deposit({ value: ethers.parseEther("1.0") });
      await vault.connect(addr2).deposit({ value: ethers.parseEther("1.0") });
    });

    it("Should allow owner to emergency withdraw", async function () {
      const contractBalance = await vault.getContractBalance();
      await expect(vault.emergencyWithdraw())
        .to.emit(vault, "EmergencyWithdraw")
        .withArgs(owner.address, contractBalance);

      expect(await vault.getContractBalance()).to.equal(0);
      expect(await vault.totalDeposits()).to.equal(0);
    });

    it("Should not allow non-owner to emergency withdraw", async function () {
      await expect(
        vault.connect(addr1).emergencyWithdraw()
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });
  });
});

