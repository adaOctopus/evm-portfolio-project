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
  const [isLoading, setIsLoading] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
    
    // Listen for account changes - handle multiple providers
    if (typeof window !== "undefined" && window.ethereum) {
      const provider = window.ethereum.providers?.find((p: any) => p.isMetaMask) || window.ethereum;
      
      if (provider && provider.on) {
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("chainChanged", (chainId: string) => {
          console.log("🔄 Chain changed to:", chainId);
          // Reload to reconnect with new network
          window.location.reload();
        });
        
        return () => {
          if (provider.removeListener) {
            provider.removeListener("accountsChanged", handleAccountsChanged);
            provider.removeListener("chainChanged", () => window.location.reload());
          }
        };
      }
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    try {
      // Handle multiple providers
      let ethereumProvider = window.ethereum;
      if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
        ethereumProvider = window.ethereum.providers.find((p: any) => p.isMetaMask) || window.ethereum.providers[0];
      }

      // Check accounts first before creating provider
      const accounts = await ethereumProvider.request({ method: "eth_accounts" });
      
      if (accounts && accounts.length > 0) {
        // Only create provider if we have accounts
        const provider = new BrowserProvider(ethereumProvider);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setWallet({
          address,
          signer,
          provider,
          isConnected: true,
        });
      }
    } catch (err: any) {
      // Ignore network change errors during check
      if (err.code !== "NETWORK_ERROR" && !err.message?.includes("network changed")) {
        console.error("Error checking connection:", err);
      }
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
    setIsLoading(true);
    console.log("Connect wallet button clicked");

    if (typeof window === "undefined") {
      console.error("Window is undefined - not in browser");
      setError("Please open this app in a browser");
      setIsLoading(false);
      return;
    }

    // Handle multiple wallet providers - prioritize MetaMask
    let ethereumProvider = window.ethereum;
    
    // If multiple providers exist (common with multiple wallet extensions)
    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      console.log("Multiple wallet providers detected, selecting MetaMask...");
      ethereumProvider = window.ethereum.providers.find(
        (provider: any) => provider.isMetaMask
      ) || window.ethereum.providers[0];
    } else if (window.ethereum?.isMetaMask) {
      // Single MetaMask provider
      ethereumProvider = window.ethereum;
    } else if (window.ethereum) {
      // Generic ethereum provider
      ethereumProvider = window.ethereum;
    }

    if (!ethereumProvider) {
      console.error("No wallet provider detected");
      setError("Please install MetaMask or another Web3 wallet. Visit https://metamask.io");
      setIsLoading(false);
      window.open("https://metamask.io", "_blank");
      return;
    }

    // Check if provider has the request method
    if (!ethereumProvider.request) {
      console.error("Wallet provider doesn't have request method");
      setError("Wallet version is too old. Please update your wallet to the latest version.");
      setIsLoading(false);
      return;
    }

    console.log("Wallet provider detected:", {
      isMetaMask: ethereumProvider.isMetaMask,
      hasRequest: typeof ethereumProvider.request === "function",
      providerName: ethereumProvider.isMetaMask ? "MetaMask" : "Unknown",
    });

    try {
      // Wait a bit for provider to be fully ready (sometimes it needs a moment)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!ethereumProvider || !ethereumProvider.request) {
        throw new Error("Wallet provider is not available");
      }
      
      // Try to request accounts with error handling
      console.log("Requesting accounts from wallet provider...");
      let accounts: string[] = [];
      
      try {
        // Wrap the request in try-catch to handle MetaMask's internal errors
        // The error from evmAsk.js suggests MetaMask is having issues selecting extensions
        console.log("Calling eth_requestAccounts on provider...");
        
        // Try direct call first
        try {
          accounts = await ethereumProvider.request({
            method: "eth_requestAccounts",
          }) as string[];
          console.log("Accounts received directly:", accounts);
        } catch (directErr: any) {
          console.warn("Direct request failed, trying alternative approach:", directErr);
          
          // If direct request fails with the evmAsk error, try using the provider's send method
          if (directErr.message?.includes("Unexpected error") || directErr.message?.includes("evmAsk")) {
            console.log("Detected MetaMask internal error, trying alternative connection method...");
            
            // Try using wallet_switchEthereumChain first, then request accounts
            try {
              // Try to get the chain first
              const chainId = await ethereumProvider.request({ method: "eth_chainId" });
              console.log("Current chain ID:", chainId);
              
              // Now try requesting accounts again
              accounts = await ethereumProvider.request({
                method: "eth_requestAccounts",
              }) as string[];
              console.log("Accounts received after chain check:", accounts);
            } catch (retryErr: any) {
              console.error("Retry also failed:", retryErr);
              throw directErr; // Throw original error
            }
          } else {
            throw directErr;
          }
        }
        
      } catch (requestErr: any) {
        console.error("Error in eth_requestAccounts:", requestErr);
        console.error("Error stack:", requestErr.stack);
        
        // If the request fails, try alternative method
        if (requestErr.code === -32002) {
          // Request already pending
          setError("Connection request already pending. Please check MetaMask and approve or reject the request.");
          setIsLoading(false);
          return;
        }
        
        if (requestErr.code === 4001) {
          // User rejected
          setError("Connection rejected. Please approve the connection in MetaMask.");
          setIsLoading(false);
          return;
        }
        
        // Handle the evmAsk.js error specifically
        if (requestErr.message?.includes("Unexpected error") || requestErr.stack?.includes("evmAsk")) {
          setError("MetaMask extension error. Try: 1) Refreshing the page 2) Disabling other wallet extensions 3) Restarting MetaMask");
          setIsLoading(false);
          return;
        }
        
        // Re-throw to outer catch
        throw requestErr;
      }
      
      if (!accounts || accounts.length === 0) {
        setError("No accounts found. Please unlock MetaMask and try again.");
        setIsLoading(false);
        return;
      }

      console.log("Creating BrowserProvider...");
      
      // Create provider with error handling
      let provider: BrowserProvider;
      let signer: JsonRpcSigner;
      let finalAddress: string;
      
      try {
        // Create provider from MetaMask
        provider = new BrowserProvider(ethereumProvider);
        console.log("BrowserProvider created successfully");
      } catch (providerErr: any) {
        console.error("Error creating BrowserProvider:", providerErr);
        console.error("Provider error details:", {
          message: providerErr.message,
          stack: providerErr.stack,
        });
        throw new Error("Failed to create provider: " + (providerErr.message || "Unknown error"));
      }
      
      try {
        // Wait a moment for provider to be ready
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Get signer for the connected account
        console.log("Getting signer...");
        signer = await provider.getSigner();
        console.log("Signer obtained");
        
        // Get the address from signer (most reliable)
        finalAddress = await signer.getAddress();
        console.log("Signer address:", finalAddress);
        
        // Verify it matches the account we requested
        const requestedAddress = accounts[0].toLowerCase();
        if (finalAddress.toLowerCase() !== requestedAddress) {
          console.warn("Address mismatch. Requested:", requestedAddress, "Got:", finalAddress.toLowerCase());
          // Use the signer's address as it's more reliable
        }
        
      } catch (signerErr: any) {
        console.error("Error getting signer:", signerErr);
        console.error("Signer error details:", {
          message: signerErr.message,
          stack: signerErr.stack,
          name: signerErr.name,
        });
        throw new Error("Failed to get signer: " + (signerErr.message || "Unknown error"));
      }
      
      console.log("Wallet connected successfully:", finalAddress);
      
      setWallet({
        address: finalAddress,
        signer: signer,
        provider: provider,
        isConnected: true,
      });
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      console.error("Error details:", {
        code: err.code,
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setIsLoading(false);
      
      // Handle different error types
      const isEvmAskError = err.message?.includes("Unexpected error") || 
                           err.stack?.includes("evmAsk.js") ||
                           err.stack?.includes("selectExtension");
      
      if (isEvmAskError) {
        setError("MetaMask extension error. This usually happens with multiple wallet extensions. Try: 1) Refresh page 2) Disable other wallet extensions 3) Restart browser 4) Update MetaMask");
      } else if (err.code === 4001 || err.message?.includes("rejected") || err.message?.includes("User rejected")) {
        setError("Connection rejected. Please approve the connection in MetaMask.");
      } else if (err.code === -32002 || err.message?.includes("pending")) {
        setError("Connection request already pending. Please check MetaMask and approve or reject the request.");
      } else if (err.message?.includes("Not allowed")) {
        setError("MetaMask connection not allowed. Please enable the connection in MetaMask settings.");
      } else {
        const errorMsg = err.message || err.toString() || "Unknown error";
        setError(`Failed to connect wallet: ${errorMsg}. Code: ${err.code || "N/A"}`);
      }
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
    isLoading,
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

