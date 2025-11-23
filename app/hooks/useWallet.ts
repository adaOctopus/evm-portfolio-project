"use client";

import { useState, useEffect } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

interface WalletState {
  address: string | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isConnected: boolean;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    signer: null,
    provider: null,
    isConnected: false,
  });

  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
      
      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum?.removeListener("chainChanged", () => window.location.reload());
      };
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setWallet({
          address,
          signer,
          provider,
          isConnected: true,
        });
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setWallet({
        address: null,
        signer: null,
        provider: null,
        isConnected: false,
      });
    } else {
      checkConnection();
    }
  };

  const connectWallet = async () => {
    setError(null);

    if (typeof window === "undefined" || !window.ethereum) {
      setError("Please install MetaMask or another Web3 wallet");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setWallet({
        address,
        signer,
        provider,
        isConnected: true,
      });
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      console.error("Error connecting wallet:", err);
    }
  };

  const disconnectWallet = () => {
    setWallet({
      address: null,
      signer: null,
      provider: null,
      isConnected: false,
    });
    setError(null);
  };

  return {
    ...wallet,
    error,
    connectWallet,
    disconnectWallet,
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

