"use client";

import { useState, useEffect } from "react";
import { JsonRpcSigner, formatEther, parseEther } from "ethers";
import { Contract } from "ethers";
import { CONTRACT_ADDRESSES } from "../lib/contracts/addresses";
import { MachineDeFiABI, MachineTokenABI } from "../lib/contracts/abis";

interface MachineOnboardFormProps {
  signer: JsonRpcSigner | null;
  userAddress: string;
}

interface MachineData {
  machineId: bigint;
  operator: string;
  name: string;
  metadataURI: string;
  totalShares: bigint;
  totalRevenue: bigint;
  lastRevenueShare: bigint;
  creationTimestamp: bigint;
  active: boolean;
}

export default function MachineOnboardForm({ signer, userAddress }: MachineOnboardFormProps) {
  const [machineName, setMachineName] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [totalShares, setTotalShares] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [machineData, setMachineData] = useState<MachineData | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [tokenSupply, setTokenSupply] = useState("0");
  const [myMachines, setMyMachines] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load user's machines on mount
  useEffect(() => {
    if (signer && userAddress) {
      loadMyMachines();
    }
  }, [signer, userAddress]);

  // Load machine data when selectedMachineId changes
  useEffect(() => {
    if (signer && selectedMachineId) {
      loadMachineData();
    }
  }, [signer, selectedMachineId]);

  const loadMyMachines = async () => {
    if (!signer || !CONTRACT_ADDRESSES.MachineDeFi) return;

    try {
      const machineDeFi = new Contract(CONTRACT_ADDRESSES.MachineDeFi, MachineDeFiABI, signer);
      const machines = await machineDeFi.getOperatorMachines(userAddress);
      setMyMachines(machines);
      
      // If user has machines and none selected, select the first one
      if (machines.length > 0 && !selectedMachineId) {
        setSelectedMachineId(machines[0].toString());
      }
    } catch (err) {
      console.error("Error loading machines:", err);
    }
  };

  const loadMachineData = async () => {
    if (!signer || !selectedMachineId || !CONTRACT_ADDRESSES.MachineDeFi) return;

    try {
      const machineDeFi = new Contract(CONTRACT_ADDRESSES.MachineDeFi, MachineDeFiABI, signer);
      
      const [machine, tokenAddr] = await Promise.all([
        machineDeFi.getMachine(selectedMachineId),
        machineDeFi.getMachineToken(selectedMachineId),
      ]);

      setMachineData({
        machineId: machine.machineId,
        operator: machine.operator,
        name: machine.name,
        metadataURI: machine.metadataURI,
        totalShares: machine.totalShares,
        totalRevenue: machine.totalRevenue,
        lastRevenueShare: machine.lastRevenueShare,
        creationTimestamp: machine.creationTimestamp,
        active: machine.active,
      });

      setTokenAddress(tokenAddr);

      // Load token data
      if (tokenAddr && tokenAddr !== "0x0000000000000000000000000000000000000000") {
        const token = new Contract(tokenAddr, MachineTokenABI, signer);
        const [balance, supply] = await Promise.all([
          token.balanceOf(userAddress),
          token.totalSupply(),
        ]);
        setTokenBalance(formatEther(balance));
        setTokenSupply(formatEther(supply));
      }
    } catch (err: any) {
      console.error("Error loading machine data:", err);
      setError(`Failed to load machine data: ${err.message}`);
    }
  };

  const handleRegisterMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !CONTRACT_ADDRESSES.MachineDeFi) {
      setError("Wallet not connected or contract not deployed");
      return;
    }

    if (!machineName.trim()) {
      setError("Please enter a machine name");
      return;
    }

    if (!metadataURI.trim()) {
      setError("Please enter a metadata URI (IPFS or URL)");
      return;
    }

    if (!totalShares || parseFloat(totalShares) <= 0) {
      setError("Please enter a valid number of shares");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const machineDeFi = new Contract(CONTRACT_ADDRESSES.MachineDeFi, MachineDeFiABI, signer);
      
      const tx = await machineDeFi.registerMachine(
        userAddress, // Operator
        machineName,
        metadataURI,
        parseEther(totalShares)
      );

      setSuccess(`Transaction sent! Hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      // Find the MachineRegistered event from receipt
      let machineId: string | null = null;
      
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            // Try to parse the log with the contract interface
            const parsed = machineDeFi.interface.parseLog({
              topics: log.topics || [],
              data: log.data || "0x",
            } as any);
            
            if (parsed && parsed.name === "MachineRegistered") {
              machineId = parsed.args.machineId.toString();
              break;
            }
          } catch (e) {
            // Continue searching other logs
            continue;
          }
        }
      }
      
      // Reload machines list to get the latest
      await loadMyMachines();
      
      if (machineId) {
        setSuccess(`Machine registered successfully! Machine ID: ${machineId}, Transaction: ${tx.hash}`);
        setSelectedMachineId(machineId);
      } else {
        // Fallback: try to find the newest machine
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadMyMachines();
        
        if (myMachines.length > 0) {
          const newestMachineId = myMachines[myMachines.length - 1].toString();
          setSelectedMachineId(newestMachineId);
          setSuccess(`Machine registered! Transaction: ${tx.hash}. Machine ID: ${newestMachineId}`);
        } else {
          setSuccess(`Machine registered! Transaction: ${tx.hash}. Please refresh to see your machine.`);
        }
      }
      
      // Clear form
      setMachineName("");
      setMetadataURI("");
      setTotalShares("");
    } catch (err: any) {
      console.error("Error registering machine:", err);
      setError(err.message || "Failed to register machine");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Check if contract is deployed
  const isContractDeployed = CONTRACT_ADDRESSES.MachineDeFi && 
    CONTRACT_ADDRESSES.MachineDeFi !== "0x0000000000000000000000000000000000000000";

  if (!isContractDeployed) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-xl dark:border-yellow-800 dark:bg-yellow-900/20">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Machine DeFi - Onboard & View Machines
        </h2>
        <div className="rounded-lg bg-yellow-100 p-4 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <p className="font-semibold">⚠️ Contract Not Deployed</p>
          <p className="mt-2 text-sm">
            The MachineDeFi contract is not deployed yet. Please deploy it first using:
          </p>
          <code className="mt-2 block rounded bg-yellow-200 px-3 py-2 text-xs dark:bg-yellow-900/50">
            npx hardhat run scripts/deploy-machine-defi.ts --network localhost
          </code>
          <p className="mt-2 text-sm">
            Then update the address in <code className="text-xs">app/lib/contracts/addresses.ts</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Machine DeFi - Onboard & View Machines
      </h2>

      {/* Register New Machine Form */}
      <div className="mb-8">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
          Register New Machine
        </h3>
        <form onSubmit={handleRegisterMachine} className="space-y-4">
          <div>
            <label htmlFor="machineName" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Machine Name
            </label>
            <input
              type="text"
              id="machineName"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              placeholder="Tesla Supercharger #1234"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="metadataURI" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Metadata URI (IPFS or URL)
            </label>
            <input
              type="text"
              id="metadataURI"
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              placeholder="ipfs://QmXxx... or https://example.com/metadata.json"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="totalShares" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Shares (Initial Supply)
            </label>
            <input
              type="text"
              id="totalShares"
              value={totalShares}
              onChange={(e) => setTotalShares(e.target.value)}
              placeholder="1000000"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Initial number of tokens to mint (will be sent to you as operator)
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !signer}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Registering..." : "Register Machine"}
          </button>
        </form>
      </div>

      {/* View Existing Machines */}
      {myMachines.length > 0 && (
        <div className="mb-6 border-t border-gray-200 pt-6 dark:border-gray-700">
          <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
            Your Machines
          </h3>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {myMachines.map((id) => (
              <option key={id.toString()} value={id.toString()}>
                Machine #{id.toString()}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Machine Data Display */}
      {machineData && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
            Machine Details
          </h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Machine ID</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                #{machineData.machineId.toString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                  machineData.active
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {machineData.active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {machineData.name}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Metadata URI</p>
              <a
                href={machineData.metadataURI}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-purple-600 hover:underline dark:text-purple-400"
              >
                {machineData.metadataURI}
              </a>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Operator</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white">
                {formatAddress(machineData.operator)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Shares</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatEther(machineData.totalShares)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatEther(machineData.totalRevenue)} ETH
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Revenue Share</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {machineData.lastRevenueShare > 0
                  ? formatDate(machineData.lastRevenueShare)
                  : "Never"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatDate(machineData.creationTimestamp)}
              </p>
            </div>

            {tokenAddress && (
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Token Contract</p>
                <p className="font-mono text-sm text-purple-600 dark:text-purple-400">
                  {formatAddress(tokenAddress)}
                </p>
              </div>
            )}

            {tokenSupply && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Token Supply</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tokenSupply}
                </p>
              </div>
            )}

            {tokenBalance && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your Token Balance</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tokenBalance}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <p className="text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}

