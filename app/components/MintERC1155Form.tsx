"use client";

import { useState } from "react";
import { JsonRpcSigner } from "ethers";
import { Contract } from "ethers";
import { CONTRACT_ADDRESSES } from "../lib/contracts/addresses";
import { MyMultiTokenABI } from "../lib/contracts/abis";

interface MintERC1155FormProps {
  signer: JsonRpcSigner | null;
  userAddress: string;
}

const TOKEN_TYPES = [
  { id: 0, name: "Gold", label: "🥇 Gold" },
  { id: 1, name: "Silver", label: "🥈 Silver" },
  { id: 2, name: "Bronze", label: "🥉 Bronze" },
];

export default function MintERC1155Form({ signer, userAddress }: MintERC1155FormProps) {
  const [tokenType, setTokenType] = useState<number>(0);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    if (!amount || parseInt(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const multiTokenContract = new Contract(CONTRACT_ADDRESSES.MyMultiToken, MyMultiTokenABI, signer);
      
      // Check if user is the owner
      const owner = await multiTokenContract.owner();
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        setError("Only the contract owner can mint tokens");
        setIsLoading(false);
        return;
      }

      const tx = await multiTokenContract.mint(userAddress, tokenType, amount, "0x");
      setSuccess(`Transaction sent! Hash: ${tx.hash}`);
      
      await tx.wait();
      setSuccess(`${amount} ${TOKEN_TYPES[tokenType].name} tokens minted successfully! Transaction: ${tx.hash}`);
      setAmount("");
    } catch (err: any) {
      console.error("Error minting ERC1155 tokens:", err);
      setError(err.message || "Failed to mint tokens");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Mint ERC1155 Tokens</h2>
      
      <form onSubmit={handleMint} className="space-y-4">
        <div>
          <label htmlFor="tokenType" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Token Type
          </label>
          <select
            id="tokenType"
            value={tokenType}
            onChange={(e) => setTokenType(parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            {TOKEN_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            min="1"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !signer}
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Minting..." : "Mint Tokens"}
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

