"use client";

// Main page component - Web3 DApp interface with wallet connection and contract interactions
import { useState, useEffect } from "react";
import { useWallet } from "./hooks/useWallet";
import { ContractData } from "./components/ContractData";
import { fetchContractData, ContractData as ContractDataType } from "./lib/contracts/contracts";
import MintNFTForm from "./components/MintNFTForm";
import MintERC1155Form from "./components/MintERC1155Form";
import VaultForm from "./components/VaultForm";

export default function Home() {
  const { address, isConnected, connectWallet, disconnectWallet, signer, error, isLoading: walletLoading } = useWallet();
  const [contractData, setContractData] = useState<ContractDataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Fetch contract data when wallet connects
  useEffect(() => {
    if (isConnected && address && signer) {
      loadContractData();
    } else {
      setContractData(null);
      setDataError(null);
    }
  }, [isConnected, address, signer]);

  const loadContractData = async () => {
    if (!address || !signer) return;

    setIsLoading(true);
    setDataError(null);

    try {
      // Skip network check - assume network is correct if wallet is connected
      // Network verification happens during wallet connection
      console.log("📦 Starting to fetch contract data...");
      
      // Fetch contract data with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Contract data fetch timeout after 10 seconds")), 10000)
      );
      
      const dataPromise = fetchContractData(address, signer);
      const data = await Promise.race([dataPromise, timeoutPromise]) as ContractDataType;
      
      console.log("✅ Contract data fetched successfully:", data);
      setContractData(data);
    } catch (err: any) {
      console.error("Error loading contract data:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      setDataError(err.message || "Failed to load contract data. Make sure contracts are deployed and addresses are correct.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
            Web3 Ethereum DApp
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Interact with ERC20, ERC721, and ERC1155 smart contracts on Ethereum
          </p>
        </div>

        {/* Wallet Connection Section */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex-1">
                {isConnected && address ? (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Connected Wallet
                    </p>
                    <p className="text-lg font-mono font-semibold text-purple-600 dark:text-purple-400">
                      {formatAddress(address)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Connect your wallet to get started
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      Not Connected
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Button clicked, isConnected:", isConnected);
                  if (isConnected) {
                    disconnectWallet();
                  } else {
                    connectWallet();
                  }
                }}
                className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-lg active:scale-95 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={walletLoading}
              >
                {isConnected ? "Disconnect" : "Connect Wallet"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <p className="text-sm font-semibold">⚠️ {error}</p>
                {error.includes("install") && (
                  <p className="mt-2 text-xs">
                    If MetaMask is installed, try refreshing the page or check if it's enabled.
                  </p>
                )}
              </div>
            )}

            {dataError && (
              <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                <p className="text-sm">{dataError}</p>
              </div>
            )}

            {typeof window !== "undefined" && !window.ethereum && !error && !isConnected && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <p className="text-sm">
                  <strong>💡 MetaMask not detected.</strong> Please{" "}
                  <a 
                    href="https://metamask.io/download" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-semibold hover:text-blue-900"
                  >
                    install MetaMask
                  </a>{" "}
                  extension to connect your wallet. After installing, refresh this page.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contract Data Display */}
        <ContractData data={contractData} isLoading={isLoading} />

        {/* Interaction Forms */}
        {isConnected && address && signer && (
          <div className="mx-auto mt-12 max-w-6xl">
            <h2 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
              Interact with Contracts
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Mint NFT Form */}
              <MintNFTForm signer={signer} userAddress={address} />
              
              {/* Mint ERC1155 Form */}
              <MintERC1155Form signer={signer} userAddress={address} />
            </div>
            
            {/* SecureVault Form - Full Width */}
            <div className="mt-6">
              <VaultForm signer={signer} userAddress={address} />
            </div>
          </div>
        )}

        {/* Info Section */}
        {isConnected && (
          <div className="mx-auto mt-12 max-w-4xl">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                About This DApp
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>
                  This DApp demonstrates interactions with three standard Ethereum token
                  contracts:
                </p>
                <ul className="list-inside list-disc space-y-2 pl-4">
                  <li>
                    <strong>ERC20</strong>: Fungible token standard (like USDC, DAI)
                  </li>
                  <li>
                    <strong>ERC721</strong>: Non-fungible token standard (like CryptoPunks,
                    Bored Apes)
                  </li>
                  <li>
                    <strong>ERC1155</strong>: Multi-token standard supporting both fungible
                    and non-fungible tokens
                  </li>
                </ul>
                <p className="pt-2 text-sm">
                  Make sure you have deployed the contracts and updated the addresses in{" "}
                  <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700">
                    app/lib/contracts/addresses.ts
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
