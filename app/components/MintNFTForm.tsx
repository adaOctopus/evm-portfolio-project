"use client";

import { useState } from "react";
import { JsonRpcSigner, parseEther } from "ethers";
import { Contract } from "ethers";
import { CONTRACT_ADDRESSES } from "../lib/contracts/addresses";
import { MyNFTABI } from "../lib/contracts/abis";

interface MintNFTFormProps {
  signer: JsonRpcSigner | null;
  userAddress: string;
}

export default function MintNFTForm({ signer, userAddress }: MintNFTFormProps) {
  const [tokenURI, setTokenURI] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    if (!tokenURI.trim()) {
      console.log("No token URI entered");
      setError("Please enter a token URI");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const nftContract = new Contract(CONTRACT_ADDRESSES.MyNFT, MyNFTABI, signer);
      
      // Check if user is the owner
      const owner = await nftContract.owner();
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        setError("Only the contract owner can mint NFTs");
        setIsLoading(false);
        return;
      }

      const tx = await nftContract.mint(userAddress, tokenURI);
      setSuccess(`Transaction sent! Hash: ${tx.hash}`);
      
      await tx.wait();
      setSuccess(`NFT minted successfully! Transaction confirmed: ${tx.hash}`);
      setTokenURI("");
    } catch (err: any) {
      console.error("Error minting NFT:", err);
      setError(err.message || "Failed to mint NFT");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Mint ERC721 NFT</h2>
      
      <form onSubmit={handleMint} className="space-y-4">
        <div>
          <label htmlFor="tokenURI" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Token URI (Metadata URL)
          </label>
          <input
            type="text"
            id="tokenURI"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="https://example.com/metadata/1.json"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !signer}
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Minting..." : "Mint NFT"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <p className="text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}

