import { Contract, JsonRpcSigner, formatEther } from "ethers";
import { CONTRACT_ADDRESSES, LOCAL_NETWORK } from "./addresses";
import { MyTokenABI, MyNFTABI, MyMultiTokenABI, TokenHandlerABI, TTokenABI } from "./abis";

export const getMyTokenContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyToken, MyTokenABI, signer);
};

export const getMyNFTContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyNFT, MyNFTABI, signer);
};

export const getMyMultiTokenContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.MyMultiToken, MyMultiTokenABI, signer);
};

export const getTokenHandlerContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.TokenHandler, TokenHandlerABI, signer);
};

export const getTTokenContract = (signer: JsonRpcSigner) => {
  return new Contract(CONTRACT_ADDRESSES.TToken, TTokenABI, signer);
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

    // Verify contracts exist at the addresses
    console.log("📦 Checking if contracts exist...");
    const tokenCode = await provider.getCode(CONTRACT_ADDRESSES.MyToken);
    console.log("🔍 Token contract code length:", tokenCode.length);
    
    if (tokenCode === "0x" || tokenCode.length <= 2) {
      throw new Error(`No contract found at MyToken address ${CONTRACT_ADDRESSES.MyToken}. Contracts may not be deployed. Run: npm run deploy:local`);
    }
    
    console.log("✅ Contracts exist, fetching data...");

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

