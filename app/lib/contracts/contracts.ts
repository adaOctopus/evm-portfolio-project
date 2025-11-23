import { Contract, JsonRpcSigner, formatEther } from "ethers";
import { CONTRACT_ADDRESSES, LOCAL_NETWORK } from "./addresses";
import { MyTokenABI, MyNFTABI, MyMultiTokenABI } from "./abis";

export const getMyTokenContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyToken, MyTokenABI, signer);
};

export const getMyNFTContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyNFT, MyNFTABI, signer);
};

export const getMyMultiTokenContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyMultiToken, MyMultiTokenABI, signer);
};

export interface ContractData {
  tokenName: string;
  tokenSymbol: string;
  tokenBalance: string;
  totalSupply: string;
  nftTotalSupply: string;
  nftBalance: string;
  goldBalance: string;
  silverBalance: string;
  bronzeBalance: string;
}

export const fetchContractData = async (
  address: string,
  signer: JsonRpcSigner
): Promise<ContractData> => {
  try {
    // Check if contracts are deployed (not zero addresses)
    if (CONTRACT_ADDRESSES.MyToken === "0x0000000000000000000000000000000000000000" ||
        CONTRACT_ADDRESSES.MyNFT === "0x0000000000000000000000000000000000000000" ||
        CONTRACT_ADDRESSES.MyMultiToken === "0x0000000000000000000000000000000000000000") {
      throw new Error("Contracts not deployed yet! Please deploy contracts first and update addresses in app/lib/contracts/addresses.ts");
    }

    // Get the provider from signer
    const provider = signer.provider;
    if (!provider) {
      throw new Error("No provider available from signer");
    }

    // ALWAYS check network directly from MetaMask (most reliable)
    const targetChainId = LOCAL_NETWORK.chainIdNumber;
    let currentChainId: number;

    if (typeof window !== "undefined" && window.ethereum) {
      // Get chain ID directly from MetaMask
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      currentChainId = parseInt(chainIdHex, 16);
      console.log("🔍 MetaMask chain ID (direct):", currentChainId, "Expected:", targetChainId);
    } else {
      throw new Error("MetaMask not available");
    }

    // If on wrong network, try to switch automatically
    if (currentChainId !== targetChainId) {
      console.warn(`⚠️ Wrong network! MetaMask is on Chain ID: ${currentChainId}, but contracts need Chain ID: ${targetChainId}`);
      
      // Try to switch network automatically
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: LOCAL_NETWORK.chainId }],
        });
        console.log("✅ Network switch requested");
        
        // Wait for network to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Re-check network after switch
        const newChainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        const newChainId = parseInt(newChainIdHex, 16);
        
        if (newChainId !== targetChainId) {
          throw new Error(`Network switch failed. Please manually switch MetaMask to Hardhat Local (Chain ID: ${targetChainId})`);
        }
      } catch (switchError: any) {
        // If network doesn't exist, try to add it
        if (switchError.code === 4902) {
          console.log("Network doesn't exist, adding Hardhat Local...");
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [LOCAL_NETWORK],
            });
            console.log("✅ Network added");
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (addError: any) {
            throw new Error(`Please add Hardhat Local network in MetaMask (Chain ID: ${targetChainId})`);
          }
        } else if (switchError.code === 4001) {
          throw new Error("Network switch was rejected. Please switch MetaMask to Hardhat Local manually.");
        } else {
          throw new Error(`Could not switch network. Please switch MetaMask to Hardhat Local (Chain ID: ${targetChainId})`);
        }
      }
    } else {
      console.log("✅ Network is correct!");
    }

    // Verify contracts exist at the addresses
    const tokenCode = await provider.getCode(CONTRACT_ADDRESSES.MyToken);
    console.log("🔍 Token contract code length:", tokenCode.length);
    if (tokenCode === "0x" || tokenCode.length <= 2) {
      throw new Error(`No contract found at MyToken address ${CONTRACT_ADDRESSES.MyToken}. Contracts may not be deployed. Run: npm run deploy:local`);
    }

    const tokenContract = getMyTokenContract(signer);
    const nftContract = getMyNFTContract(signer);
    const multiTokenContract = getMyMultiTokenContract(signer);

    // Fetch ERC20 data
    const [tokenName, tokenSymbol, tokenBalance, totalSupply] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.balanceOf(address),
      tokenContract.totalSupply(),
    ]);

    // Fetch ERC721 data
    const [nftTotalSupply, nftBalance] = await Promise.all([
      nftContract.totalSupply(),
      nftContract.balanceOf(address),
    ]);

    // Fetch ERC1155 data
    const [goldBalance, silverBalance, bronzeBalance] = await Promise.all([
      multiTokenContract.balanceOf(address, 0), // GOLD
      multiTokenContract.balanceOf(address, 1), // SILVER
      multiTokenContract.balanceOf(address, 2), // BRONZE
    ]);

    return {
      tokenName,
      tokenSymbol,
      tokenBalance: parseFloat(formatEther(tokenBalance)).toFixed(4),
      totalSupply: parseFloat(formatEther(totalSupply)).toFixed(4),
      nftTotalSupply: nftTotalSupply.toString(),
      nftBalance: nftBalance.toString(),
      goldBalance: goldBalance.toString(),
      silverBalance: silverBalance.toString(),
      bronzeBalance: bronzeBalance.toString(),
    };
  } catch (error: any) {
    console.error("Error fetching contract data:", error);
    
    // Provide helpful error message
    if (error.message?.includes("not deployed")) {
      throw error; // Re-throw our custom error
    }
    
    if (error.code === "BAD_DATA" || error.message?.includes("decode result")) {
      throw new Error("Contracts not deployed or wrong addresses. Deploy contracts first and update addresses in app/lib/contracts/addresses.ts");
    }
    
    throw error;
  }
};

