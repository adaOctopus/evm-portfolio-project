import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiRoleToken", function () {
  let token: any;
  let owner: any;
  let minter: any;
  let burner: any;
  let pauser: any;
  let user: any;

  const INITIAL_SUPPLY = ethers.parseEther("1000");
  const MAX_SUPPLY = ethers.parseEther("10000");

  beforeEach(async function () {
    [owner, minter, burner, pauser, user] = await ethers.getSigners();

    const MultiRoleToken = await ethers.getContractFactory("MultiRoleToken");
    token = await MultiRoleToken.deploy(INITIAL_SUPPLY, MAX_SUPPLY);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set correct initial supply", async function () {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should set max supply", async function () {
      expect(await token.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it("Should grant owner all roles", async function () {
      expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await token.hasRole(await token.MINTER_ROLE(), owner.address)).to.be.true;
      expect(await token.hasRole(await token.BURNER_ROLE(), owner.address)).to.be.true;
      expect(await token.hasRole(await token.PAUSER_ROLE(), owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await token.grantRole(await token.MINTER_ROLE(), minter.address);
    });

    it("Should allow minter to mint", async function () {
      const mintAmount = ethers.parseEther("100");
      await token.connect(minter).mint(user.address, mintAmount);

      expect(await token.balanceOf(user.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
    });

    it("Should not allow non-minter to mint", async function () {
      await expect(
        token.connect(user).mint(user.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });

    it("Should not mint beyond max supply", async function () {
      const excessAmount = MAX_SUPPLY - INITIAL_SUPPLY + ethers.parseEther("1");
      await expect(
        token.connect(minter).mint(user.address, excessAmount)
      ).to.be.revertedWithCustomError(token, "Panic").withArgs(0x11);
    });

    it("Should not mint when paused", async function () {
      await token.pause();
      await expect(
        token.connect(minter).mint(user.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await token.grantRole(await token.BURNER_ROLE(), burner.address);
    });

    it("Should allow burner to burn", async function () {
      const burnAmount = ethers.parseEther("100");
      await token.connect(burner).burn(owner.address, burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - burnAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
    });

    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      await token.connect(owner).burnFromSelf(burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - burnAmount);
    });

    it("Should not allow non-burner to burn others' tokens", async function () {
      await expect(
        token.connect(user).burn(owner.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pausable", function () {
    beforeEach(async function () {
      await token.grantRole(await token.PAUSER_ROLE(), pauser.address);
    });

    it("Should allow pauser to pause", async function () {
      await token.connect(pauser).pause();
      expect(await token.paused()).to.be.true;
    });

    it("Should prevent transfers when paused", async function () {
      await token.connect(pauser).pause();
      await expect(
        token.connect(owner).transfer(user.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should allow transfers when unpaused", async function () {
      await token.connect(pauser).pause();
      await token.connect(pauser).unpause();
      await expect(token.connect(owner).transfer(user.address, ethers.parseEther("100")))
        .to.not.be.reverted;
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant roles", async function () {
      await token.grantRole(await token.MINTER_ROLE(), minter.address);
      expect(await token.hasRole(await token.MINTER_ROLE(), minter.address)).to.be.true;
    });

    it("Should allow admin to revoke roles", async function () {
      await token.grantRole(await token.MINTER_ROLE(), minter.address);
      await token.revokeRole(await token.MINTER_ROLE(), minter.address);
      expect(await token.hasRole(await token.MINTER_ROLE(), minter.address)).to.be.false;
    });

    it("Should allow batch role granting", async function () {
      const roles = [
        await token.MINTER_ROLE(),
        await token.BURNER_ROLE(),
        await token.PAUSER_ROLE(),
      ];
      await token.grantRoles(minter.address, roles);

      expect(await token.hasRole(await token.MINTER_ROLE(), minter.address)).to.be.true;
      expect(await token.hasRole(await token.BURNER_ROLE(), minter.address)).to.be.true;
      expect(await token.hasRole(await token.PAUSER_ROLE(), minter.address)).to.be.true;
    });
  });

  describe("Max Supply Management", function () {
    it("Should allow admin to update max supply", async function () {
      const newMaxSupply = ethers.parseEther("20000");
      await token.setMaxSupply(newMaxSupply);
      expect(await token.maxSupply()).to.equal(newMaxSupply);
    });

    it("Should not allow max supply below current supply", async function () {
      await expect(
        token.setMaxSupply(ethers.parseEther("500"))
      ).to.be.revertedWithCustomError(token, "Panic").withArgs(0x11);
    });

    it("Should show remaining mintable amount", async function () {
      const remaining = await token.getRemainingMintable();
      expect(remaining).to.equal(MAX_SUPPLY - INITIAL_SUPPLY);
    });
  });
});

