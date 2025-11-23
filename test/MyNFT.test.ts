import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyNFT (ERC721)", function () {
  let myNFT: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MyNFT = await ethers.getContractFactory("MyNFT");
    myNFT = await MyNFT.deploy();
    await myNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await myNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await myNFT.name()).to.equal("MyNFT");
      expect(await myNFT.symbol()).to.equal("MNFT");
    });

    it("Should start with zero total supply", async function () {
      expect(await myNFT.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint NFT", async function () {
      const tokenURI = "https://example.com/nft/1";
      const tx = await myNFT.mint(addr1.address, tokenURI);
      await tx.wait();

      expect(await myNFT.totalSupply()).to.equal(1);
      expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await myNFT.getOwner(1)).to.equal(addr1.address);
      expect(await myNFT.getTokenURI(1)).to.equal(tokenURI);
    });

    it("Should increment token IDs correctly", async function () {
      await myNFT.mint(addr1.address, "https://example.com/nft/1");
      await myNFT.mint(addr1.address, "https://example.com/nft/2");
      await myNFT.mint(addr2.address, "https://example.com/nft/3");

      expect(await myNFT.totalSupply()).to.equal(3);
      expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await myNFT.ownerOf(2)).to.equal(addr1.address);
      expect(await myNFT.ownerOf(3)).to.equal(addr2.address);
    });

    it("Should not allow non-owner to mint", async function () {
      await expect(
        myNFT.connect(addr1).mint(addr2.address, "https://example.com/nft/1")
      ).to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
    });
  });
});

