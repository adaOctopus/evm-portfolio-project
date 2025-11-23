import { Contract, JsonRpcSigner, formatEther } from "ethers";
import { CONTRACT_ADDRESSES } from "./addresses";
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
  } catch (error) {
    console.error("Error fetching contract data:", error);
    throw error;
  }
};

