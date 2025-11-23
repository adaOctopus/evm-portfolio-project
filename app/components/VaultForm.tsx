"use client";

import { useState, useEffect } from "react";
import { JsonRpcSigner, formatEther, parseEther } from "ethers";
import { Contract } from "ethers";
import { CONTRACT_ADDRESSES } from "../lib/contracts/addresses";
import { SecureVaultABI } from "../lib/contracts/abis";

interface VaultFormProps {
  signer: JsonRpcSigner | null;
  userAddress: string;
}

export default function VaultForm({ signer, userAddress }: VaultFormProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [userBalance, setUserBalance] = useState("0");
  const [contractBalance, setContractBalance] = useState("0");
  const [isOwner, setIsOwner] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadVaultData = async () => {
    if (!signer) return;

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.SecureVault, SecureVaultABI, signer);
      
      const [balance, contractBal, owner, paused] = await Promise.all([
        vaultContract.getBalance(userAddress),
        vaultContract.getContractBalance(),
        vaultContract.owner(),
        vaultContract.paused(),
      ]);

      setUserBalance(formatEther(balance));
      setContractBalance(formatEther(contractBal));
      setIsOwner(owner.toLowerCase() === userAddress.toLowerCase());
      setIsPaused(paused);
    } catch (err) {
      console.error("Error loading vault data:", err);
    }
  };

  useEffect(() => {
    loadVaultData();
  }, [signer, userAddress]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.SecureVault, SecureVaultABI, signer);
      const tx = await vaultContract.deposit({ value: parseEther(depositAmount) });
      setSuccess(`Deposit transaction sent! Hash: ${tx.hash}`);
      
      await tx.wait();
      setSuccess(`Successfully deposited ${depositAmount} ETH! Transaction: ${tx.hash}`);
      setDepositAmount("");
      await loadVaultData();
    } catch (err: any) {
      console.error("Error depositing:", err);
      setError(err.message || "Failed to deposit");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      setError("Wallet not connected");
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.SecureVault, SecureVaultABI, signer);
      const tx = await vaultContract.withdraw(parseEther(withdrawAmount));
      setSuccess(`Withdraw transaction sent! Hash: ${tx.hash}`);
      
      await tx.wait();
      setSuccess(`Successfully withdrew ${withdrawAmount} ETH! Transaction: ${tx.hash}`);
      setWithdrawAmount("");
      await loadVaultData();
    } catch (err: any) {
      console.error("Error withdrawing:", err);
      setError(err.message || "Failed to withdraw");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (!signer || !isOwner) return;

    setIsLoading(true);
    setError(null);

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.SecureVault, SecureVaultABI, signer);
      const tx = await vaultContract.pause();
      await tx.wait();
      setSuccess("Vault paused successfully!");
      await loadVaultData();
    } catch (err: any) {
      setError(err.message || "Failed to pause");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpause = async () => {
    if (!signer || !isOwner) return;

    setIsLoading(true);
    setError(null);

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.SecureVault, SecureVaultABI, signer);
      const tx = await vaultContract.unpause();
      await tx.wait();
      setSuccess("Vault unpaused successfully!");
      await loadVaultData();
    } catch (err: any) {
      setError(err.message || "Failed to unpause");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">SecureVault</h2>
        {isPaused && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">
            PAUSED
          </span>
        )}
      </div>

      {/* Balance Info */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Your Balance</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {parseFloat(userBalance).toFixed(4)} ETH
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Contract Balance</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {parseFloat(contractBalance).toFixed(4)} ETH
          </p>
        </div>
      </div>

      {/* Deposit Form */}
      <form onSubmit={handleDeposit} className="mb-4 space-y-4">
        <div>
          <label htmlFor="depositAmount" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Deposit Amount (ETH)
          </label>
          <input
            type="number"
            id="depositAmount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.1"
            step="0.001"
            min="0"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            disabled={isLoading || isPaused}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !signer || isPaused}
          className="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Deposit"}
        </button>
      </form>

      {/* Withdraw Form */}
      <form onSubmit={handleWithdraw} className="mb-4 space-y-4">
        <div>
          <label htmlFor="withdrawAmount" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Withdraw Amount (ETH)
          </label>
          <input
            type="number"
            id="withdrawAmount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0.1"
            step="0.001"
            min="0"
            max={userBalance}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            disabled={isLoading || isPaused}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !signer || isPaused}
          className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3 font-semibold text-white transition-all hover:from-orange-700 hover:to-red-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Withdraw"}
        </button>
      </form>

      {/* Owner Controls */}
      {isOwner && (
        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Owner Controls</p>
          <div className="flex gap-2">
            {isPaused ? (
              <button
                onClick={handleUnpause}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Unpause
              </button>
            ) : (
              <button
                onClick={handlePause}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Pause
              </button>
            )}
          </div>
        </div>
      )}

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

