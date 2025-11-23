"use client";

// Component to display contract data from all three contract types
interface ContractDataProps {
  data: {
    tokenName: string;
    tokenSymbol: string;
    tokenBalance: string;
    totalSupply: string;
    nftTotalSupply: string;
    nftBalance: string;
    goldBalance: string;
    silverBalance: string;
    bronzeBalance: string;
  } | null;
  isLoading: boolean;
}

export const ContractData = ({ data, isLoading }: ContractDataProps) => {
  if (isLoading) {
    return (
      <div className="mt-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading contract data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mt-8 rounded-lg bg-gray-100 p-6 text-center dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to view contract data
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-3">
      {/* ERC20 Token Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          ERC20 Token
        </h3>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.tokenName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Symbol</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.tokenSymbol}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Balance</p>
            <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {data.tokenBalance} {data.tokenSymbol}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Supply</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.totalSupply} {data.tokenSymbol}
            </p>
          </div>
        </div>
      </div>

      {/* ERC721 NFT Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          ERC721 NFT
        </h3>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total NFTs Minted</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.nftTotalSupply}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your NFTs</p>
            <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {data.nftBalance}
            </p>
          </div>
        </div>
      </div>

      {/* ERC1155 Multi-Token Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          ERC1155 Tokens
        </h3>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gold (ID: 0)</p>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {data.goldBalance}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Silver (ID: 1)</p>
            <p className="text-lg font-semibold text-gray-400 dark:text-gray-300">
              {data.silverBalance}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Bronze (ID: 2)</p>
            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {data.bronzeBalance}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

