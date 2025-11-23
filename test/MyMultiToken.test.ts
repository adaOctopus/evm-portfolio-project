import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyMultiToken (ERC1155)", function () {
  let myMultiToken: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MyMultiToken = await ethers.getContractFactory("MyMultiToken");
    myMultiToken = await MyMultiToken.deploy();
    await myMultiToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await myMultiToken.owner()).to.equal(owner.address);
    });

    it("Should have correct token constants", async function () {
      expect(await myMultiToken.GOLD()).to.equal(0);
      expect(await myMultiToken.SILVER()).to.equal(1);
      expect(await myMultiToken.BRONZE()).to.equal(2);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint single token type", async function () {
      const amount = 100;
      await myMultiToken.mint(addr1.address, 0, amount, "0x");

      expect(await myMultiToken.balanceOf(addr1.address, 0)).to.equal(amount);
      expect(await myMultiToken.getBalance(addr1.address, 0)).to.equal(amount);
    });

    it("Should allow owner to mint multiple token types in batch", async function () {
      const ids = [0, 1, 2];
      const amounts = [100, 200, 300];
      await myMultiToken.mintBatch(addr1.address, ids, amounts, "0x");

      expect(await myMultiToken.balanceOf(addr1.address, 0)).to.equal(100);
      expect(await myMultiToken.balanceOf(addr1.address, 1)).to.equal(200);
      expect(await myMultiToken.balanceOf(addr1.address, 2)).to.equal(300);
    });

    it("Should not allow non-owner to mint", async function () {
      await expect(
        myMultiToken.connect(addr1).mint(addr2.address, 0, 100, "0x")
      ).to.be.revertedWithCustomError(myMultiToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token Balances", function () {
    it("Should correctly track balances after minting", async function () {
      await myMultiToken.mint(addr1.address, 0, 50, "0x");
      await myMultiToken.mint(addr1.address, 1, 75, "0x");

      expect(await myMultiToken.getBalance(addr1.address, 0)).to.equal(50);
      expect(await myMultiToken.getBalance(addr1.address, 1)).to.equal(75);
      expect(await myMultiToken.getBalance(addr1.address, 2)).to.equal(0);
    });
  });
});

